import { EconomyManager, defaultEconomyConfig } from './economy.js';
import { PremiumManager, PremiumTier } from './premium.js';
import { AnalyticsManager, EventType } from './analytics.js';
import { TrainerProfile } from '../types/trainer.js';
import { Currency, Item, ItemType } from '../types/common.js';

export class EconomyIntegrationService {
  private economyManager: EconomyManager;
  private premiumManager: PremiumManager;
  private analyticsManager: AnalyticsManager;

  constructor() {
    this.economyManager = new EconomyManager(defaultEconomyConfig);
    this.premiumManager = new PremiumManager(this.economyManager);
    this.analyticsManager = new AnalyticsManager();
  }

  // Integrated currency operations with analytics
  async addCurrencyWithTracking(
    profile: TrainerProfile,
    currency: Currency,
    source: string,
    sessionId: string
  ): Promise<void> {
    // Apply premium bonuses
    const premiumTier = this.premiumManager.getPremiumTier(profile);
    const bonusMultiplier = this.getPremiumCurrencyBonus(premiumTier);
    
    const bonusCurrency: Currency = {
      pawCoins: Math.floor(currency.pawCoins * bonusMultiplier),
      researchPoints: Math.floor(currency.researchPoints * bonusMultiplier),
      battleTokens: Math.floor(currency.battleTokens * bonusMultiplier)
    };

    this.economyManager.addCurrency(profile, bonusCurrency);
    
    // Track analytics
    this.analyticsManager.trackCurrencyTransaction(
      profile.trainerId,
      sessionId,
      'earned',
      bonusCurrency,
      source
    );
  }

  async spendCurrencyWithTracking(
    profile: TrainerProfile,
    cost: Currency,
    purpose: string,
    sessionId: string
  ): Promise<boolean> {
    if (!this.economyManager.canAfford(profile, cost)) {
      return false;
    }

    const success = this.economyManager.deductCurrency(profile, cost);
    if (success) {
      this.analyticsManager.trackCurrencyTransaction(
        profile.trainerId,
        sessionId,
        'spent',
        cost,
        purpose
      );
    }

    return success;
  }

  // Integrated item operations
  async purchaseItemWithTracking(
    profile: TrainerProfile,
    itemId: string,
    quantity: number,
    sessionId: string
  ): Promise<boolean> {
    const itemPrice = defaultEconomyConfig.itemPrices[itemId];
    if (!itemPrice) {
      return false;
    }

    const totalCost: Currency = {
      pawCoins: itemPrice.pawCoins * quantity,
      researchPoints: itemPrice.researchPoints * quantity,
      battleTokens: itemPrice.battleTokens * quantity
    };

    if (!await this.spendCurrencyWithTracking(profile, totalCost, `item_purchase_${itemId}`, sessionId)) {
      return false;
    }

    const item = this.economyManager.createItem(itemId, ItemType.CAPTURE, 'common' as any, quantity);
    this.economyManager.addItemToInventory(profile, item);

    // Track purchase
    this.analyticsManager.trackEvent(
      profile.trainerId,
      EventType.ITEM_PURCHASED,
      {
        itemId,
        quantity,
        cost: totalCost,
        totalValue: this.calculateCurrencyValue(totalCost)
      },
      sessionId
    );

    return true;
  }

  async useItemWithTracking(
    profile: TrainerProfile,
    itemId: string,
    quantity: number,
    context: string,
    sessionId: string
  ): Promise<boolean> {
    const success = this.economyManager.removeItemFromInventory(profile, itemId, quantity);
    
    if (success) {
      this.analyticsManager.trackEvent(
        profile.trainerId,
        EventType.ITEM_USED,
        {
          itemId,
          quantity,
          context
        },
        sessionId
      );
    }

    return success;
  }

  // Integrated premium operations
  async purchasePremiumWithTracking(
    profile: TrainerProfile,
    tier: PremiumTier,
    duration: number,
    sessionId: string
  ): Promise<boolean> {
    const success = this.premiumManager.subscribeToPremium(profile, tier, duration);
    
    if (success) {
      const cost = this.getSubscriptionCost(tier, duration);
      this.analyticsManager.trackPremiumPurchase(
        profile.trainerId,
        sessionId,
        tier,
        duration,
        cost
      );

      // Track A/B test conversion if applicable
      this.analyticsManager.trackABTestConversion(
        profile.trainerId,
        'premium_pricing_test',
        this.calculateCurrencyValue(cost)
      );
    }

    return success;
  }

  async purchaseCosmeticWithTracking(
    profile: TrainerProfile,
    cosmeticId: string,
    sessionId: string
  ): Promise<boolean> {
    const cosmetic = this.premiumManager.getCosmeticStore().find(c => c.id === cosmeticId);
    if (!cosmetic) {
      return false;
    }

    const success = this.premiumManager.purchaseCosmetic(profile, cosmeticId);
    
    if (success) {
      this.analyticsManager.trackEvent(
        profile.trainerId,
        EventType.COSMETIC_PURCHASED,
        {
          cosmeticId,
          category: cosmetic.category,
          rarity: cosmetic.rarity,
          price: cosmetic.price,
          revenue: this.calculateCurrencyValue(cosmetic.price)
        },
        sessionId
      );
    }

    return success;
  }

  // Daily rewards with premium bonuses and analytics
  async processDailyRewardsWithTracking(
    profile: TrainerProfile,
    sessionId: string
  ): Promise<any> {
    const reward = this.economyManager.processLoginBonus(profile);
    
    if (reward) {
      // Apply premium bonuses to daily rewards
      const premiumTier = this.premiumManager.getPremiumTier(profile);
      const bonusMultiplier = this.getPremiumCurrencyBonus(premiumTier);
      
      if (bonusMultiplier > 1) {
        const bonusCurrency: Currency = {
          pawCoins: Math.floor(reward.currency.pawCoins * (bonusMultiplier - 1)),
          researchPoints: Math.floor(reward.currency.researchPoints * (bonusMultiplier - 1)),
          battleTokens: Math.floor(reward.currency.battleTokens * (bonusMultiplier - 1))
        };
        
        this.economyManager.addCurrency(profile, bonusCurrency);
        reward.currency.pawCoins += bonusCurrency.pawCoins;
        reward.currency.researchPoints += bonusCurrency.researchPoints;
        reward.currency.battleTokens += bonusCurrency.battleTokens;
      }

      // Track analytics
      this.analyticsManager.trackCurrencyTransaction(
        profile.trainerId,
        sessionId,
        'earned',
        reward.currency,
        'daily_reward'
      );

      this.analyticsManager.trackEvent(
        profile.trainerId,
        EventType.USER_LOGIN,
        {
          consecutiveDays: reward.day,
          bonusMultiplier: reward.bonusMultiplier,
          premiumTier: premiumTier,
          rewardValue: this.calculateCurrencyValue(reward.currency)
        },
        sessionId
      );
    }

    return reward;
  }

  // A/B testing integration for economy features
  async getOptimizedPricing(
    profile: TrainerProfile,
    itemType: string
  ): Promise<Currency> {
    const variantId = this.analyticsManager.assignUserToABTest(
      profile.trainerId,
      'pricing_optimization_test'
    );

    const basePricing = defaultEconomyConfig.itemPrices[itemType] || {
      pawCoins: 100,
      researchPoints: 0,
      battleTokens: 0
    };

    // Apply A/B test pricing modifications
    switch (variantId) {
      case 'discount_20':
        return {
          pawCoins: Math.floor(basePricing.pawCoins * 0.8),
          researchPoints: Math.floor(basePricing.researchPoints * 0.8),
          battleTokens: Math.floor(basePricing.battleTokens * 0.8)
        };
      case 'premium_15':
        return {
          pawCoins: Math.floor(basePricing.pawCoins * 1.15),
          researchPoints: Math.floor(basePricing.researchPoints * 1.15),
          battleTokens: Math.floor(basePricing.battleTokens * 1.15)
        };
      default:
        return basePricing;
    }
  }

  // Analytics dashboard data
  async getEconomyDashboard(startDate: Date, endDate: Date): Promise<EconomyDashboard> {
    const revenueMetrics = this.analyticsManager.calculateRevenueMetrics(startDate, endDate);
    const engagementMetrics = this.analyticsManager.calculateEngagementMetrics(endDate);

    return {
      revenue: revenueMetrics,
      engagement: engagementMetrics,
      currencyDistribution: await this.calculateCurrencyDistribution(),
      itemPopularity: await this.calculateItemPopularity(startDate, endDate),
      premiumConversion: await this.calculatePremiumConversion(startDate, endDate),
      abTestResults: this.getActiveABTestResults()
    };
  }

  // Helper methods
  private getPremiumCurrencyBonus(tier: PremiumTier): number {
    const bonuses = {
      [PremiumTier.FREE]: 1.0,
      [PremiumTier.TRAINER]: 1.25,
      [PremiumTier.ELITE]: 1.5,
      [PremiumTier.CHAMPION]: 2.0
    };
    return bonuses[tier] || 1.0;
  }

  private getSubscriptionCost(tier: PremiumTier, duration: number): Currency {
    const baseCosts = {
      [PremiumTier.TRAINER]: { pawCoins: 500, researchPoints: 0, battleTokens: 0 },
      [PremiumTier.ELITE]: { pawCoins: 1000, researchPoints: 0, battleTokens: 0 },
      [PremiumTier.CHAMPION]: { pawCoins: 2000, researchPoints: 0, battleTokens: 0 }
    };

    const baseCost = baseCosts[tier] || { pawCoins: 0, researchPoints: 0, battleTokens: 0 };
    const durationMultiplier = duration / 30;

    return {
      pawCoins: Math.floor(baseCost.pawCoins * durationMultiplier),
      researchPoints: Math.floor(baseCost.researchPoints * durationMultiplier),
      battleTokens: Math.floor(baseCost.battleTokens * durationMultiplier)
    };
  }

  private calculateCurrencyValue(currency: Currency): number {
    return currency.pawCoins + (currency.researchPoints * 5) + (currency.battleTokens * 10);
  }

  private async calculateCurrencyDistribution(): Promise<CurrencyDistribution> {
    // This would query actual user data in a real implementation
    return {
      totalPawCoins: 1000000,
      totalResearchPoints: 200000,
      totalBattleTokens: 50000,
      averagePerUser: {
        pawCoins: 500,
        researchPoints: 100,
        battleTokens: 25
      }
    };
  }

  private async calculateItemPopularity(startDate: Date, endDate: Date): Promise<ItemPopularity[]> {
    // This would analyze actual purchase data
    return [
      { itemId: 'puzzle_hint', purchases: 1500, revenue: 15000 },
      { itemId: 'capture_boost', purchases: 800, revenue: 20000 },
      { itemId: 'health_potion', purchases: 600, revenue: 12000 }
    ];
  }

  private async calculatePremiumConversion(startDate: Date, endDate: Date): Promise<PremiumConversionMetrics> {
    return {
      freeToTrainer: 0.05,
      trainerToElite: 0.15,
      eliteToChampion: 0.08,
      overallConversion: 0.12,
      averageTimeToConvert: 7 // days
    };
  }

  private getActiveABTestResults(): any[] {
    return [
      this.analyticsManager.getABTestResults('pricing_optimization_test'),
      this.analyticsManager.getABTestResults('premium_pricing_test')
    ].filter(result => result !== null);
  }

  // Public getters for managers
  getEconomyManager(): EconomyManager {
    return this.economyManager;
  }

  getPremiumManager(): PremiumManager {
    return this.premiumManager;
  }

  getAnalyticsManager(): AnalyticsManager {
    return this.analyticsManager;
  }
}

// Dashboard interfaces
export interface EconomyDashboard {
  revenue: any;
  engagement: any;
  currencyDistribution: CurrencyDistribution;
  itemPopularity: ItemPopularity[];
  premiumConversion: PremiumConversionMetrics;
  abTestResults: any[];
}

export interface CurrencyDistribution {
  totalPawCoins: number;
  totalResearchPoints: number;
  totalBattleTokens: number;
  averagePerUser: Currency;
}

export interface ItemPopularity {
  itemId: string;
  purchases: number;
  revenue: number;
}

export interface PremiumConversionMetrics {
  freeToTrainer: number;
  trainerToElite: number;
  eliteToChampion: number;
  overallConversion: number;
  averageTimeToConvert: number;
}