import { RedisClient } from '../storage/redis-client.js';
import { TradingSystem } from './trading-system.js';
import { Animal } from '../types/animal.js';
import { Item, Currency, Rarity, HabitatType } from '../types/common.js';
import { MarketplaceListing, ListingType, AuctionListing } from '../types/trading.js';

export interface MarketplaceFilters {
  type?: ListingType;
  rarity?: Rarity;
  habitatType?: HabitatType;
  priceRange?: {
    min: Currency;
    max: Currency;
  };
  searchTerm?: string;
}

export interface MarketplaceStats {
  totalListings: number;
  totalSales: number;
  averagePrice: Currency;
  topSellingItems: Array<{
    name: string;
    count: number;
    averagePrice: Currency;
  }>;
  recentSales: Array<{
    itemName: string;
    price: Currency;
    soldAt: Date;
  }>;
}

export class MarketplaceSystem {
  private redis: RedisClient;
  private tradingSystem: TradingSystem;

  constructor(redis: RedisClient, tradingSystem: TradingSystem) {
    this.redis = redis;
    this.tradingSystem = tradingSystem;
  }

  async searchMarketplace(filters: MarketplaceFilters, limit: number = 50): Promise<MarketplaceListing[]> {
    let listings = await this.tradingSystem.getMarketplaceListings(filters.type, limit * 2);

    // Apply filters
    if (filters.rarity) {
      listings = listings.filter(listing => {
        if (listing.animal) {
          return listing.animal.rarity === filters.rarity;
        }
        if (listing.item) {
          return listing.item.rarity === filters.rarity;
        }
        return false;
      });
    }

    if (filters.habitatType) {
      listings = listings.filter(listing => {
        if (listing.animal) {
          return listing.animal.type.includes(filters.habitatType!);
        }
        return false;
      });
    }

    if (filters.priceRange) {
      listings = listings.filter(listing => {
        return this.isPriceInRange(listing.price, filters.priceRange!);
      });
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      listings = listings.filter(listing => {
        const name = listing.animal?.name || listing.item?.name || '';
        const description = listing.description || '';
        return name.toLowerCase().includes(searchTerm) || 
               description.toLowerCase().includes(searchTerm);
      });
    }

    return listings.slice(0, limit);
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    // Get all completed sales from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesData = await this.getRecentSales(thirtyDaysAgo);
    
    const totalListings = await this.redis.scard('active_listings');
    const totalSales = salesData.length;
    
    // Calculate average price
    const totalRevenue = salesData.reduce((sum, sale) => ({
      pawCoins: sum.pawCoins + sale.price.pawCoins,
      researchPoints: sum.researchPoints + sale.price.researchPoints,
      battleTokens: sum.battleTokens + sale.price.battleTokens
    }), { pawCoins: 0, researchPoints: 0, battleTokens: 0 });

    const averagePrice: Currency = {
      pawCoins: totalSales > 0 ? Math.floor(totalRevenue.pawCoins / totalSales) : 0,
      researchPoints: totalSales > 0 ? Math.floor(totalRevenue.researchPoints / totalSales) : 0,
      battleTokens: totalSales > 0 ? Math.floor(totalRevenue.battleTokens / totalSales) : 0
    };

    // Get top selling items
    const itemCounts = new Map<string, { count: number; totalPrice: Currency }>();
    salesData.forEach(sale => {
      const itemName = sale.itemName;
      const existing = itemCounts.get(itemName) || { 
        count: 0, 
        totalPrice: { pawCoins: 0, researchPoints: 0, battleTokens: 0 } 
      };
      
      existing.count++;
      existing.totalPrice.pawCoins += sale.price.pawCoins;
      existing.totalPrice.researchPoints += sale.price.researchPoints;
      existing.totalPrice.battleTokens += sale.price.battleTokens;
      
      itemCounts.set(itemName, existing);
    });

    const topSellingItems = Array.from(itemCounts.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        averagePrice: {
          pawCoins: Math.floor(data.totalPrice.pawCoins / data.count),
          researchPoints: Math.floor(data.totalPrice.researchPoints / data.count),
          battleTokens: Math.floor(data.totalPrice.battleTokens / data.count)
        }
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentSales = salesData
      .sort((a, b) => b.soldAt.getTime() - a.soldAt.getTime())
      .slice(0, 20);

    return {
      totalListings,
      totalSales,
      averagePrice,
      topSellingItems,
      recentSales
    };
  }

  async getFeaturedListings(): Promise<MarketplaceListing[]> {
    // Get high-value or rare items to feature
    const allListings = await this.tradingSystem.getMarketplaceListings(undefined, 100);
    
    const featuredListings = allListings
      .filter(listing => {
        // Feature rare animals or high-value items
        if (listing.animal && [Rarity.EPIC, Rarity.LEGENDARY].includes(listing.animal.rarity)) {
          return true;
        }
        if (listing.item && [Rarity.EPIC, Rarity.LEGENDARY].includes(listing.item.rarity)) {
          return true;
        }
        // Feature high-priced items
        const totalPrice = listing.price.pawCoins + listing.price.researchPoints + listing.price.battleTokens;
        return totalPrice > 1000;
      })
      .sort((a, b) => {
        // Sort by rarity and price
        const aValue = this.getListingValue(a);
        const bValue = this.getListingValue(b);
        return bValue - aValue;
      })
      .slice(0, 10);

    return featuredListings;
  }

  async getRecommendedListings(trainerId: string): Promise<MarketplaceListing[]> {
    // Get trainer's preferences and collection to recommend relevant items
    const trainerData = await this.redis.get(`trainer:${trainerId}`);
    if (!trainerData) {
      return [];
    }

    const trainer = JSON.parse(trainerData);
    const allListings = await this.tradingSystem.getMarketplaceListings(undefined, 100);
    
    // Recommend based on trainer's favorite habitat or missing animals
    const recommendations = allListings
      .filter(listing => {
        if (listing.sellerId === trainerId) {
          return false; // Don't recommend own listings
        }
        
        // Recommend animals from trainer's favorite habitat
        if (listing.animal && trainer.stats.favoriteHabitat) {
          return listing.animal.type.includes(trainer.stats.favoriteHabitat);
        }
        
        // Recommend items that match trainer's specialization
        if (listing.item) {
          switch (trainer.specialization) {
            case 'research':
              return listing.item.type === 'training';
            case 'battle':
              return listing.item.type === 'battle';
            case 'conservation':
              return listing.item.type === 'capture';
            default:
              return true;
          }
        }
        
        return false;
      })
      .slice(0, 10);

    return recommendations;
  }

  async getActiveAuctions(): Promise<AuctionListing[]> {
    const auctionIds = await this.redis.smembers('active_auctions');
    const auctions: AuctionListing[] = [];
    
    for (const auctionId of auctionIds) {
      const data = await this.redis.get(`auction:${auctionId}`);
      if (data) {
        const auction = JSON.parse(data);
        // Check if auction hasn't expired
        if (new Date(auction.endsAt) > new Date()) {
          auctions.push(auction);
        }
      }
    }
    
    return auctions.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
  }

  async getEndingSoonAuctions(): Promise<AuctionListing[]> {
    const activeAuctions = await this.getActiveAuctions();
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    return activeAuctions
      .filter(auction => new Date(auction.endsAt) <= twentyFourHoursFromNow)
      .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
  }

  private isPriceInRange(price: Currency, range: { min: Currency; max: Currency }): boolean {
    const totalPrice = price.pawCoins + price.researchPoints + price.battleTokens;
    const minPrice = range.min.pawCoins + range.min.researchPoints + range.min.battleTokens;
    const maxPrice = range.max.pawCoins + range.max.researchPoints + range.max.battleTokens;
    
    return totalPrice >= minPrice && totalPrice <= maxPrice;
  }

  private getListingValue(listing: MarketplaceListing): number {
    let value = listing.price.pawCoins + listing.price.researchPoints + listing.price.battleTokens;
    
    // Add bonus for rarity
    if (listing.animal) {
      switch (listing.animal.rarity) {
        case Rarity.LEGENDARY:
          value += 10000;
          break;
        case Rarity.EPIC:
          value += 5000;
          break;
        case Rarity.RARE:
          value += 1000;
          break;
      }
    }
    
    if (listing.item) {
      switch (listing.item.rarity) {
        case Rarity.LEGENDARY:
          value += 5000;
          break;
        case Rarity.EPIC:
          value += 2500;
          break;
        case Rarity.RARE:
          value += 500;
          break;
      }
    }
    
    return value;
  }

  private async getRecentSales(since: Date): Promise<Array<{ itemName: string; price: Currency; soldAt: Date }>> {
    // This would query completed marketplace transactions
    // For now, return empty array as placeholder
    return [];
  }
}