import { Animal } from './animal.js';
import { Item, Currency } from './common.js';

export interface TradeOffer {
  id: string;
  fromTrainerId: string;
  toTrainerId: string;
  offeredAnimals: Animal[];
  offeredItems: Item[];
  offeredCurrency: Partial<Currency>;
  requestedAnimals: Animal[];
  requestedItems: Item[];
  requestedCurrency: Partial<Currency>;
  message?: string;
  status: TradeStatus;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}

export enum TradeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  COMPLETED = 'completed'
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  type: ListingType;
  animal?: Animal;
  item?: Item;
  price: Currency;
  description?: string;
  status: ListingStatus;
  createdAt: Date;
  expiresAt: Date;
  purchasedBy?: string;
  purchasedAt?: Date;
}

export enum ListingType {
  ANIMAL = 'animal',
  ITEM = 'item'
}

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface AuctionListing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  animal: Animal;
  startingBid: Currency;
  currentBid: Currency;
  currentBidderId?: string;
  currentBidderUsername?: string;
  bidHistory: AuctionBid[];
  description?: string;
  status: AuctionStatus;
  createdAt: Date;
  endsAt: Date;
  completedAt?: Date;
}

export interface AuctionBid {
  bidderId: string;
  bidderUsername: string;
  amount: Currency;
  timestamp: Date;
}

export enum AuctionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_BIDS = 'no_bids'
}

export interface GiftTransaction {
  id: string;
  fromTrainerId: string;
  fromUsername: string;
  toTrainerId: string;
  toUsername: string;
  giftedAnimals: Animal[];
  giftedItems: Item[];
  giftedCurrency: Partial<Currency>;
  message?: string;
  status: GiftStatus;
  createdAt: Date;
  claimedAt?: Date;
}

export enum GiftStatus {
  PENDING = 'pending',
  CLAIMED = 'claimed',
  EXPIRED = 'expired'
}

export interface TradingStats {
  totalTradesCompleted: number;
  totalItemsSold: number;
  totalAnimalsSold: number;
  totalRevenue: Currency;
  totalSpent: Currency;
  averageRating: number;
  totalRatings: number;
}

export interface TradeRating {
  id: string;
  tradeId: string;
  raterId: string;
  raterUsername: string;
  ratedTrainerId: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
}