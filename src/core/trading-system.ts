import { RedisClient } from '../storage/redis-client.js';
import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';
import { Item, Currency } from '../types/common.js';
import {
  TradeOffer,
  TradeStatus,
  MarketplaceListing,
  ListingType,
  ListingStatus,
  AuctionListing,
  AuctionBid,
  AuctionStatus,
  GiftTransaction,
  GiftStatus,
  TradingStats,
  TradeRating
} from '../types/trading.js';

export class TradingSystem {
  private redis: RedisClient;

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  // Trade Offers
  async createTradeOffer(offer: Omit<TradeOffer, 'id' | 'status' | 'createdAt' | 'expiresAt'>): Promise<TradeOffer> {
    const tradeOffer: TradeOffer = {
      ...offer,
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: TradeStatus.PENDING,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    await this.redis.set(`trade_offer:${tradeOffer.id}`, JSON.stringify(tradeOffer));
    
    // Add to user's pending trades
    await this.redis.sadd(`user_trades:${offer.fromTrainerId}`, tradeOffer.id);
    await this.redis.sadd(`user_trades:${offer.toTrainerId}`, tradeOffer.id);

    return tradeOffer;
  }

  async getTradeOffer(tradeId: string): Promise<TradeOffer | null> {
    const data = await this.redis.get(`trade_offer:${tradeId}`);
    return data ? JSON.parse(data) : null;
  }

  async getUserTrades(trainerId: string): Promise<TradeOffer[]> {
    const tradeIds = await this.redis.smembers(`user_trades:${trainerId}`);
    const trades: TradeOffer[] = [];
    
    for (const tradeId of tradeIds) {
      const trade = await this.getTradeOffer(tradeId);
      if (trade) {
        trades.push(trade);
      }
    }
    
    return trades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async acceptTradeOffer(tradeId: string, acceptingTrainerId: string): Promise<boolean> {
    const trade = await this.getTradeOffer(tradeId);
    if (!trade || trade.status !== TradeStatus.PENDING || trade.toTrainerId !== acceptingTrainerId) {
      return false;
    }

    // Validate both traders still have the required resources
    const fromTrainer = await this.getTrainerProfile(trade.fromTrainerId);
    const toTrainer = await this.getTrainerProfile(trade.toTrainerId);
    
    if (!fromTrainer || !toTrainer) {
      return false;
    }

    // Execute the trade
    try {
      await this.executeTradeTransfer(trade, fromTrainer, toTrainer);
      
      // Update trade status
      trade.status = TradeStatus.COMPLETED;
      trade.completedAt = new Date();
      await this.redis.set(`trade_offer:${tradeId}`, JSON.stringify(trade));

      return true;
    } catch (error) {
      console.error('Trade execution failed:', error);
      return false;
    }
  }

  async rejectTradeOffer(tradeId: string, rejectingTrainerId: string): Promise<boolean> {
    const trade = await this.getTradeOffer(tradeId);
    if (!trade || trade.status !== TradeStatus.PENDING || trade.toTrainerId !== rejectingTrainerId) {
      return false;
    }

    trade.status = TradeStatus.REJECTED;
    await this.redis.set(`trade_offer:${tradeId}`, JSON.stringify(trade));
    return true;
  }

  // Marketplace Listings
  async createMarketplaceListing(listing: Omit<MarketplaceListing, 'id' | 'status' | 'createdAt' | 'expiresAt'>): Promise<MarketplaceListing> {
    const marketplaceListing: MarketplaceListing = {
      ...listing,
      id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: ListingStatus.ACTIVE,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    await this.redis.set(`marketplace_listing:${marketplaceListing.id}`, JSON.stringify(marketplaceListing));
    await this.redis.sadd('active_listings', marketplaceListing.id);
    await this.redis.sadd(`user_listings:${listing.sellerId}`, marketplaceListing.id);

    return marketplaceListing;
  }

  async getMarketplaceListings(type?: ListingType, limit: number = 50): Promise<MarketplaceListing[]> {
    const listingIds = await this.redis.smembers('active_listings');
    const listings: MarketplaceListing[] = [];
    
    for (const listingId of listingIds.slice(0, limit)) {
      const data = await this.redis.get(`marketplace_listing:${listingId}`);
      if (data) {
        const listing = JSON.parse(data);
        if (!type || listing.type === type) {
          listings.push(listing);
        }
      }
    }
    
    return listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async purchaseMarketplaceListing(listingId: string, buyerId: string): Promise<boolean> {
    const listing = await this.getMarketplaceListing(listingId);
    if (!listing || listing.status !== ListingStatus.ACTIVE || listing.sellerId === buyerId) {
      return false;
    }

    const buyer = await this.getTrainerProfile(buyerId);
    if (!buyer || !this.hasEnoughCurrency(buyer.currency, listing.price)) {
      return false;
    }

    try {
      // Transfer item/animal to buyer and currency to seller
      await this.executeMarketplacePurchase(listing, buyer);
      
      // Update listing status
      listing.status = ListingStatus.SOLD;
      listing.purchasedBy = buyerId;
      listing.purchasedAt = new Date();
      await this.redis.set(`marketplace_listing:${listingId}`, JSON.stringify(listing));
      await this.redis.srem('active_listings', listingId);

      return true;
    } catch (error) {
      console.error('Marketplace purchase failed:', error);
      return false;
    }
  }

  // Auction System
  async createAuctionListing(auction: Omit<AuctionListing, 'id' | 'currentBid' | 'bidHistory' | 'status' | 'createdAt' | 'endsAt'>): Promise<AuctionListing> {
    const auctionListing: AuctionListing = {
      ...auction,
      id: `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentBid: auction.startingBid,
      bidHistory: [],
      status: AuctionStatus.ACTIVE,
      createdAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    await this.redis.set(`auction:${auctionListing.id}`, JSON.stringify(auctionListing));
    await this.redis.sadd('active_auctions', auctionListing.id);
    await this.redis.sadd(`user_auctions:${auction.sellerId}`, auctionListing.id);

    return auctionListing;
  }

  async placeBid(auctionId: string, bidderId: string, bidderUsername: string, bidAmount: Currency): Promise<boolean> {
    const auction = await this.getAuctionListing(auctionId);
    if (!auction || auction.status !== AuctionStatus.ACTIVE || auction.sellerId === bidderId) {
      return false;
    }

    const bidder = await this.getTrainerProfile(bidderId);
    if (!bidder || !this.hasEnoughCurrency(bidder.currency, bidAmount)) {
      return false;
    }

    // Check if bid is higher than current bid
    if (!this.isBidHigher(bidAmount, auction.currentBid)) {
      return false;
    }

    // Add bid to history
    const bid: AuctionBid = {
      bidderId,
      bidderUsername,
      amount: bidAmount,
      timestamp: new Date()
    };

    auction.bidHistory.push(bid);
    auction.currentBid = bidAmount;
    auction.currentBidderId = bidderId;
    auction.currentBidderUsername = bidderUsername;

    await this.redis.set(`auction:${auctionId}`, JSON.stringify(auction));
    return true;
  }

  // Gift System
  async sendGift(gift: Omit<GiftTransaction, 'id' | 'status' | 'createdAt'>): Promise<GiftTransaction> {
    const giftTransaction: GiftTransaction = {
      ...gift,
      id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: GiftStatus.PENDING,
      createdAt: new Date()
    };

    await this.redis.set(`gift:${giftTransaction.id}`, JSON.stringify(giftTransaction));
    await this.redis.sadd(`user_gifts:${gift.toTrainerId}`, giftTransaction.id);

    return giftTransaction;
  }

  async claimGift(giftId: string, claimerId: string): Promise<boolean> {
    const gift = await this.getGift(giftId);
    if (!gift || gift.status !== GiftStatus.PENDING || gift.toTrainerId !== claimerId) {
      return false;
    }

    try {
      // Transfer items to claimer
      await this.executeGiftTransfer(gift, claimerId);
      
      gift.status = GiftStatus.CLAIMED;
      gift.claimedAt = new Date();
      await this.redis.set(`gift:${giftId}`, JSON.stringify(gift));

      return true;
    } catch (error) {
      console.error('Gift claim failed:', error);
      return false;
    }
  }

  // Helper methods
  private async getTrainerProfile(trainerId: string): Promise<TrainerProfile | null> {
    const data = await this.redis.get(`trainer:${trainerId}`);
    return data ? JSON.parse(data) : null;
  }

  private async getMarketplaceListing(listingId: string): Promise<MarketplaceListing | null> {
    const data = await this.redis.get(`marketplace_listing:${listingId}`);
    return data ? JSON.parse(data) : null;
  }

  private async getAuctionListing(auctionId: string): Promise<AuctionListing | null> {
    const data = await this.redis.get(`auction:${auctionId}`);
    return data ? JSON.parse(data) : null;
  }

  private async getGift(giftId: string): Promise<GiftTransaction | null> {
    const data = await this.redis.get(`gift:${giftId}`);
    return data ? JSON.parse(data) : null;
  }

  private hasEnoughCurrency(userCurrency: Currency, requiredCurrency: Partial<Currency>): boolean {
    return (
      (requiredCurrency.pawCoins || 0) <= userCurrency.pawCoins &&
      (requiredCurrency.researchPoints || 0) <= userCurrency.researchPoints &&
      (requiredCurrency.battleTokens || 0) <= userCurrency.battleTokens
    );
  }

  private isBidHigher(newBid: Currency, currentBid: Currency): boolean {
    const newTotal = newBid.pawCoins + newBid.researchPoints + newBid.battleTokens;
    const currentTotal = currentBid.pawCoins + currentBid.researchPoints + currentBid.battleTokens;
    return newTotal > currentTotal;
  }

  private async executeTradeTransfer(trade: TradeOffer, fromTrainer: TrainerProfile, toTrainer: TrainerProfile): Promise<void> {
    // This would implement the actual transfer logic
    // For now, this is a placeholder that would integrate with the storage system
    console.log('Executing trade transfer:', trade.id);
  }

  private async executeMarketplacePurchase(listing: MarketplaceListing, buyer: TrainerProfile): Promise<void> {
    // This would implement the actual purchase logic
    console.log('Executing marketplace purchase:', listing.id);
  }

  private async executeGiftTransfer(gift: GiftTransaction, claimerId: string): Promise<void> {
    // This would implement the actual gift transfer logic
    console.log('Executing gift transfer:', gift.id);
  }
}