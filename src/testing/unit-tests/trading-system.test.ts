/**
 * Unit tests for Trading System
 */

import { TradingSystem } from '../../core/trading-system.js';
import { RedisClient } from '../../storage/redis-client.js';
import { TradeOffer, TradeStatus, MarketplaceListing, ListingStatus, AuctionListing, AuctionStatus, GiftTransaction, GiftStatus } from '../../types/trading.js';
import { Currency, Item } from '../../types/common.js';

describe('TradingSystem', () => {
  let tradingSystem: TradingSystem;
  let mockRedis: jest.Mocked<RedisClient>;

  beforeEach(() => {
    // Create mock Redis client
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      del: jest.fn()
    } as any;

    tradingSystem = new TradingSystem(mockRedis);
  });

  describe('Trade Offers', () => {
    test('should create trade offer successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.sadd.mockResolvedValue(1);

      const tradeData = {
        fromTrainerId: 'trainer1',
        toTrainerId: 'trainer2',
        fromTrainerUsername: 'Player1',
        toTrainerUsername: 'Player2',
        offeredAnimals: ['animal1'],
        requestedAnimals: ['animal2'],
        offeredItems: [],
        requestedItems: [],
        offeredCurrency: { pawCoins: 100, researchPoints: 0, battleTokens: 0 },
        requestedCurrency: { pawCoins: 0, researchPoints: 50, battleTokens: 0 },
        message: 'Trade my wolf for your eagle'
      };

      const tradeOffer = await tradingSystem.createTradeOffer(tradeData);

      expect(tradeOffer.id).toBeTruthy();
      expect(tradeOffer.status).toBe(TradeStatus.PENDING);
      expect(tradeOffer.fromTrainerId).toBe('trainer1');
      expect(tradeOffer.toTrainerId).toBe('trainer2');
      expect(mockRedis.set).toHaveBeenCalledWith(
        `trade_offer:${tradeOffer.id}`,
        JSON.stringify(tradeOffer)
      );
      expect(mockRedis.sadd).toHaveBeenCalledWith('user_trades:trainer1', tradeOffer.id);
      expect(mockRedis.sadd).toHaveBeenCalledWith('user_trades:trainer2', tradeOffer.id);
    });

    test('should get trade offer by ID', async () => {
      const mockTrade: TradeOffer = {
        id: 'trade123',
        fromTrainerId: 'trainer1',
        toTrainerId: 'trainer2',
        fromTrainerUsername: 'Player1',
        toTrainerUsername: 'Player2',
        offeredAnimals: ['animal1'],
        requestedAnimals: ['animal2'],
        offeredItems: [],
        requestedItems: [],
        offeredCurrency: { pawCoins: 100, researchPoints: 0, battleTokens: 0 },
        requestedCurrency: { pawCoins: 0, researchPoints: 50, battleTokens: 0 },
        message: 'Test trade',
        status: TradeStatus.PENDING,
        createdAt: new Date(),
        expiresAt: new Date()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockTrade));

      const result = await tradingSystem.getTradeOffer('trade123');

      expect(result).toEqual(mockTrade);
      expect(mockRedis.get).toHaveBeenCalledWith('trade_offer:trade123');
    });

    test('should return null for non-existent trade offer', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await tradingSystem.getTradeOffer('nonexistent');

      expect(result).toBeNull();
    });

    test('should get user trades', async () => {
      const tradeIds = ['trade1', 'trade2'];
      const mockTrades = tradeIds.map(id => ({
        id,
        fromTrainerId: 'trainer1',
        toTrainerId: 'trainer2',
        status: TradeStatus.PENDING,
        createdAt: new Date()
      }));

      mockRedis.smembers.mockResolvedValue(tradeIds);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockTrades[0]))
        .mockResolvedValueOnce(JSON.stringify(mockTrades[1]));

      const result = await tradingSystem.getUserTrades('trainer1');

      expect(result).toHaveLength(2);
      expect(mockRedis.smembers).toHaveBeenCalledWith('user_trades:trainer1');
    });

    test('should accept trade offer', async () => {
      const mockTrade: TradeOffer = {
        id: 'trade123',
        fromTrainerId: 'trainer1',
        toTrainerId: 'trainer2',
        fromTrainerUsername: 'Player1',
        toTrainerUsername: 'Player2',
        offeredAnimals: [],
        requestedAnimals: [],
        offeredItems: [],
        requestedItems: [],
        offeredCurrency: { pawCoins: 0, researchPoints: 0, battleTokens: 0 },
        requestedCurrency: { pawCoins: 0, researchPoints: 0, battleTokens: 0 },
        message: 'Test trade',
        status: TradeStatus.PENDING,
        createdAt: new Date(),
        expiresAt: new Date()
      };

      const mockTrainer = {
        trainerId: 'trainer2',
        currency: { pawCoins: 1000, researchPoints: 500, battleTokens: 100 }
      };

      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockTrade))
        .mockResolvedValueOnce(JSON.stringify(mockTrainer))
        .mockResolvedValueOnce(JSON.stringify(mockTrainer));
      mockRedis.set.mockResolvedValue('OK');

      const result = await tradingSystem.acceptTradeOffer('trade123', 'trainer2');

      expect(result).toBe(true);
    });

    test('should reject invalid trade acceptance', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await tradingSystem.acceptTradeOffer('nonexistent', 'trainer2');

      expect(result).toBe(false);
    });

    test('should reject trade offer', async () => {
      const mockTrade: TradeOffer = {
        id: 'trade123',
        fromTrainerId: 'trainer1',
        toTrainerId: 'trainer2',
        fromTrainerUsername: 'Player1',
        toTrainerUsername: 'Player2',
        offeredAnimals: [],
        requestedAnimals: [],
        offeredItems: [],
        requestedItems: [],
        offeredCurrency: { pawCoins: 0, researchPoints: 0, battleTokens: 0 },
        requestedCurrency: { pawCoins: 0, researchPoints: 0, battleTokens: 0 },
        message: 'Test trade',
        status: TradeStatus.PENDING,
        createdAt: new Date(),
        expiresAt: new Date()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockTrade));
      mockRedis.set.mockResolvedValue('OK');

      const result = await tradingSystem.rejectTradeOffer('trade123', 'trainer2');

      expect(result).toBe(true);
    });
  });

  describe('Marketplace Listings', () => {
    test('should create marketplace listing', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.sadd.mockResolvedValue(1);

      const listingData = {
        sellerId: 'trainer1',
        sellerUsername: 'Player1',
        type: 'animal' as any,
        itemId: 'animal1',
        itemName: 'Wolf',
        description: 'Strong forest wolf',
        price: { pawCoins: 500, researchPoints: 0, battleTokens: 0 },
        quantity: 1
      };

      const listing = await tradingSystem.createMarketplaceListing(listingData);

      expect(listing.id).toBeTruthy();
      expect(listing.status).toBe(ListingStatus.ACTIVE);
      expect(listing.sellerId).toBe('trainer1');
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.sadd).toHaveBeenCalledWith('active_listings', listing.id);
    });

    test('should get marketplace listings', async () => {
      const listingIds = ['listing1', 'listing2'];
      const mockListings = listingIds.map(id => ({
        id,
        sellerId: 'trainer1',
        type: 'animal',
        status: ListingStatus.ACTIVE,
        createdAt: new Date()
      }));

      mockRedis.smembers.mockResolvedValue(listingIds);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockListings[0]))
        .mockResolvedValueOnce(JSON.stringify(mockListings[1]));

      const result = await tradingSystem.getMarketplaceListings();

      expect(result).toHaveLength(2);
      expect(mockRedis.smembers).toHaveBeenCalledWith('active_listings');
    });

    test('should purchase marketplace listing', async () => {
      const mockListing: MarketplaceListing = {
        id: 'listing123',
        sellerId: 'trainer1',
        sellerUsername: 'Player1',
        type: 'animal' as any,
        itemId: 'animal1',
        itemName: 'Wolf',
        description: 'Strong wolf',
        price: { pawCoins: 500, researchPoints: 0, battleTokens: 0 },
        quantity: 1,
        status: ListingStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: new Date()
      };

      const mockBuyer = {
        trainerId: 'trainer2',
        currency: { pawCoins: 1000, researchPoints: 500, battleTokens: 100 }
      };

      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockListing))
        .mockResolvedValueOnce(JSON.stringify(mockBuyer));
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.srem.mockResolvedValue(1);

      const result = await tradingSystem.purchaseMarketplaceListing('listing123', 'trainer2');

      expect(result).toBe(true);
    });
  });

  describe('Auction System', () => {
    test('should create auction listing', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.sadd.mockResolvedValue(1);

      const auctionData = {
        sellerId: 'trainer1',
        sellerUsername: 'Player1',
        type: 'animal' as any,
        itemId: 'rare_animal',
        itemName: 'Rare Eagle',
        description: 'Very rare mountain eagle',
        startingBid: { pawCoins: 1000, researchPoints: 0, battleTokens: 0 },
        buyoutPrice: { pawCoins: 5000, researchPoints: 0, battleTokens: 0 }
      };

      const auction = await tradingSystem.createAuctionListing(auctionData);

      expect(auction.id).toBeTruthy();
      expect(auction.status).toBe(AuctionStatus.ACTIVE);
      expect(auction.currentBid).toEqual(auctionData.startingBid);
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.sadd).toHaveBeenCalledWith('active_auctions', auction.id);
    });

    test('should place bid on auction', async () => {
      const mockAuction: AuctionListing = {
        id: 'auction123',
        sellerId: 'trainer1',
        sellerUsername: 'Player1',
        type: 'animal' as any,
        itemId: 'rare_animal',
        itemName: 'Rare Eagle',
        description: 'Very rare eagle',
        startingBid: { pawCoins: 1000, researchPoints: 0, battleTokens: 0 },
        currentBid: { pawCoins: 1000, researchPoints: 0, battleTokens: 0 },
        buyoutPrice: { pawCoins: 5000, researchPoints: 0, battleTokens: 0 },
        bidHistory: [],
        status: AuctionStatus.ACTIVE,
        createdAt: new Date(),
        endsAt: new Date()
      };

      const mockBidder = {
        trainerId: 'trainer2',
        currency: { pawCoins: 2000, researchPoints: 500, battleTokens: 100 }
      };

      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockAuction))
        .mockResolvedValueOnce(JSON.stringify(mockBidder));
      mockRedis.set.mockResolvedValue('OK');

      const bidAmount = { pawCoins: 1500, researchPoints: 0, battleTokens: 0 };
      const result = await tradingSystem.placeBid('auction123', 'trainer2', 'Player2', bidAmount);

      expect(result).toBe(true);
    });

    test('should reject insufficient bid', async () => {
      const mockAuction: AuctionListing = {
        id: 'auction123',
        sellerId: 'trainer1',
        sellerUsername: 'Player1',
        type: 'animal' as any,
        itemId: 'rare_animal',
        itemName: 'Rare Eagle',
        description: 'Very rare eagle',
        startingBid: { pawCoins: 1000, researchPoints: 0, battleTokens: 0 },
        currentBid: { pawCoins: 1500, researchPoints: 0, battleTokens: 0 },
        buyoutPrice: { pawCoins: 5000, researchPoints: 0, battleTokens: 0 },
        bidHistory: [],
        status: AuctionStatus.ACTIVE,
        createdAt: new Date(),
        endsAt: new Date()
      };

      const mockBidder = {
        trainerId: 'trainer2',
        currency: { pawCoins: 2000, researchPoints: 500, battleTokens: 100 }
      };

      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockAuction))
        .mockResolvedValueOnce(JSON.stringify(mockBidder));

      const bidAmount = { pawCoins: 1200, researchPoints: 0, battleTokens: 0 }; // Lower than current bid
      const result = await tradingSystem.placeBid('auction123', 'trainer2', 'Player2', bidAmount);

      expect(result).toBe(false);
    });
  });

  describe('Gift System', () => {
    test('should send gift', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.sadd.mockResolvedValue(1);

      const giftData = {
        fromTrainerId: 'trainer1',
        toTrainerId: 'trainer2',
        fromTrainerUsername: 'Player1',
        toTrainerUsername: 'Player2',
        giftedAnimals: ['animal1'],
        giftedItems: [],
        giftedCurrency: { pawCoins: 100, researchPoints: 0, battleTokens: 0 },
        message: 'Happy birthday!'
      };

      const gift = await tradingSystem.sendGift(giftData);

      expect(gift.id).toBeTruthy();
      expect(gift.status).toBe(GiftStatus.PENDING);
      expect(gift.fromTrainerId).toBe('trainer1');
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.sadd).toHaveBeenCalledWith('user_gifts:trainer2', gift.id);
    });

    test('should claim gift', async () => {
      const mockGift: GiftTransaction = {
        id: 'gift123',
        fromTrainerId: 'trainer1',
        toTrainerId: 'trainer2',
        fromTrainerUsername: 'Player1',
        toTrainerUsername: 'Player2',
        giftedAnimals: [],
        giftedItems: [],
        giftedCurrency: { pawCoins: 100, researchPoints: 0, battleTokens: 0 },
        message: 'Test gift',
        status: GiftStatus.PENDING,
        createdAt: new Date()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockGift));
      mockRedis.set.mockResolvedValue('OK');

      const result = await tradingSystem.claimGift('gift123', 'trainer2');

      expect(result).toBe(true);
    });

    test('should reject invalid gift claim', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await tradingSystem.claimGift('nonexistent', 'trainer2');

      expect(result).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    test('should validate currency requirements correctly', async () => {
      // This tests the private hasEnoughCurrency method indirectly
      const mockListing: MarketplaceListing = {
        id: 'listing123',
        sellerId: 'trainer1',
        sellerUsername: 'Player1',
        type: 'animal' as any,
        itemId: 'animal1',
        itemName: 'Wolf',
        description: 'Strong wolf',
        price: { pawCoins: 1500, researchPoints: 0, battleTokens: 0 }, // More than buyer has
        quantity: 1,
        status: ListingStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: new Date()
      };

      const mockBuyer = {
        trainerId: 'trainer2',
        currency: { pawCoins: 1000, researchPoints: 500, battleTokens: 100 } // Not enough pawCoins
      };

      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockListing))
        .mockResolvedValueOnce(JSON.stringify(mockBuyer));

      const result = await tradingSystem.purchaseMarketplaceListing('listing123', 'trainer2');

      expect(result).toBe(false); // Should fail due to insufficient currency
    });
  });
});