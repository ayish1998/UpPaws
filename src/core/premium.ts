import { TrainerProfile } from '../types/trainer.js';
import { Currency, Item, ItemType, Rarity } from '../types/common.js';
import { EconomyManager } from './economy.js';

export enum PremiumTier {
  FREE = 'free',
  TRAINER = 'trainer',
  ELITE = 'elite',
  CHAMPION = 'champion'
}

export interface PremiumSubscription {
  tier: PremiumTier;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  benefits: PremiumBenefit[];
}

export interface PremiumBenefit {
  id: string;
  name: string;
  description: string;
  type: BenefitType;
  value: number;
  tier: PremiumTier;
}

export enum BenefitType {
  STORAGE_INCREASE = 'storage_increase',
  CURRENCY_BONUS = 'currency_bonus',
  EXCLUSIVE_ACCESS = 'exclusive_access',
  FASTER_PROGRESSION = 'faster_progression',
  COSMETIC_UNLOCK = 'cosmetic_unlock',
  PRIORITY_MATCHING = 'priority_matching'
}

export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  category: CosmeticCategory;
  rarity: Rarity;
  price: Currency;
  premiumOnly: boolean;
  unlockRequirement?: string;
}

export enum CosmeticCategory {
  TRAINER_OUTFIT = 'trainer_outfit',
  ANIMAL_ACCESSORY = 'animal_accessory',
  HABITAT_THEME = 'habitat_theme',
  BATTLE_EFFECT = 'battle_effect',
  UI_THEME = 'ui_theme'
}

export interface TournamentPass {
  id: string;
  name: string;
  description: string;
  tournamentId: string;
  price: Currency;
  benefits: string[];
  validUntil: Date;
}

export class PremiumManager {
  private economyManager: EconomyManager;

  constructor(economyManager: EconomyManager) {
    this.economyManager = economyManager;
  }

  // Premium subscription management
  subscribeToPremium(profile: TrainerProfile, tier: PremiumTier, duration: number): boolean {
    const cost = this.getSubscriptionCost(tier, duration);
    
    if (!this.economyManager.canAfford(profile, cost)) {
      return false;
    }

    this.economyManager.deductCurrency(profile, cost);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    profile.premiumSubscription = {
      tier,
      startDate,
      endDate,
      autoRenew: false,
      benefits: this.getPremiumBenefits(tier)
    };

    // Apply immediate benefits
    this.applyPremiumBenefits(profile, tier);

    return true;
  }

  isPremiumActive(profile: TrainerProfile): boolean {
    if (!profile.premiumSubscription) {
      return false;
    }

    return new Date() <= profile.premiumSubscription.endDate;
  }

  getPremiumTier(profile: TrainerProfile): PremiumTier {
    if (!this.isPremiumActive(profile)) {
      return PremiumTier.FREE;
    }

    return profile.premiumSubscription!.tier;
  }

  // Premium benefits
  private getPremiumBenefits(tier: PremiumTier): PremiumBenefit[] {
    const benefits: Record<PremiumTier, PremiumBenefit[]> = {
      [PremiumTier.FREE]: [],
      [PremiumTier.TRAINER]: [
        {
          id: 'storage_boost_1',
          name: 'Expanded Storage',
          description: 'Increase animal collection capacity by 50',
          type: BenefitType.STORAGE_INCREASE,
          value: 50,
          tier: PremiumTier.TRAINER
        },
        {
          id: 'currency_bonus_1',
          name: 'Daily Currency Bonus',
          description: 'Earn 25% more currency from all activities',
          type: BenefitType.CURRENCY_BONUS,
          value: 0.25,
          tier: PremiumTier.TRAINER
        },
        {
          id: 'exclusive_habitats_1',
          name: 'Premium Habitats',
          description: 'Access to 2 exclusive premium habitats',
          type: BenefitType.EXCLUSIVE_ACCESS,
          value: 2,
          tier: PremiumTier.TRAINER
        }
      ],
      [PremiumTier.ELITE]: [
        {
          id: 'storage_boost_2',
          name: 'Elite Storage',
          description: 'Increase animal collection capacity by 100',
          type: BenefitType.STORAGE_INCREASE,
          value: 100,
          tier: PremiumTier.ELITE
        },
        {
          id: 'currency_bonus_2',
          name: 'Elite Currency Bonus',
          description: 'Earn 50% more currency from all activities',
          type: BenefitType.CURRENCY_BONUS,
          value: 0.5,
          tier: PremiumTier.ELITE
        },
        {
          id: 'faster_training',
          name: 'Accelerated Training',
          description: 'Animals gain experience 2x faster',
          type: BenefitType.FASTER_PROGRESSION,
          value: 2.0,
          tier: PremiumTier.ELITE
        },
        {
          id: 'priority_matching',
          name: 'Priority Battle Matching',
          description: 'Faster matchmaking in tournaments',
          type: BenefitType.PRIORITY_MATCHING,
          value: 1,
          tier: PremiumTier.ELITE
        }
      ],
      [PremiumTier.CHAMPION]: [
        {
          id: 'storage_boost_3',
          name: 'Champion Storage',
          description: 'Unlimited animal collection capacity',
          type: BenefitType.STORAGE_INCREASE,
          value: -1, // -1 indicates unlimited
          tier: PremiumTier.CHAMPION
        },
        {
          id: 'currency_bonus_3',
          name: 'Champion Currency Bonus',
          description: 'Earn 100% more currency from all activities',
          type: BenefitType.CURRENCY_BONUS,
          value: 1.0,
          tier: PremiumTier.CHAMPION
        },
        {
          id: 'exclusive_access_all',
          name: 'All Premium Content',
          description: 'Access to all premium habitats and features',
          type: BenefitType.EXCLUSIVE_ACCESS,
          value: -1,
          tier: PremiumTier.CHAMPION
        },
        {
          id: 'cosmetic_unlock_all',
          name: 'All Cosmetics Unlocked',
          description: 'Access to all premium cosmetic items',
          type: BenefitType.COSMETIC_UNLOCK,
          value: -1,
          tier: PremiumTier.CHAMPION
        }
      ]
    };

    return benefits[tier] || [];
  }

  private applyPremiumBenefits(profile: TrainerProfile, tier: PremiumTier): void {
    const benefits = this.getPremiumBenefits(tier);
    
    for (const benefit of benefits) {
      switch (benefit.type) {
        case BenefitType.STORAGE_INCREASE:
          profile.maxCollectionSize = benefit.value === -1 ? 
            Number.MAX_SAFE_INTEGER : 
            (profile.maxCollectionSize || 100) + benefit.value;
          break;
        case BenefitType.COSMETIC_UNLOCK:
          if (benefit.value === -1) {
            profile.unlockedCosmetics = this.getAllCosmeticIds();
          }
          break;
      }
    }
  }

  // Cosmetic store
  getCosmeticStore(): CosmeticItem[] {
    return [
      {
        id: 'trainer_outfit_forest',
        name: 'Forest Ranger Outfit',
        description: 'A rugged outfit perfect for forest exploration',
        category: CosmeticCategory.TRAINER_OUTFIT,
        rarity: Rarity.COMMON,
        price: { pawCoins: 500, researchPoints: 0, battleTokens: 0 },
        premiumOnly: false
      },
      {
        id: 'trainer_outfit_ocean',
        name: 'Marine Biologist Outfit',
        description: 'Professional attire for ocean research',
        category: CosmeticCategory.TRAINER_OUTFIT,
        rarity: Rarity.UNCOMMON,
        price: { pawCoins: 750, researchPoints: 50, battleTokens: 0 },
        premiumOnly: false
      },
      {
        id: 'trainer_outfit_champion',
        name: 'Champion\'s Regalia',
        description: 'Exclusive outfit for elite trainers',
        category: CosmeticCategory.TRAINER_OUTFIT,
        rarity: Rarity.LEGENDARY,
        price: { pawCoins: 0, researchPoints: 0, battleTokens: 0 },
        premiumOnly: true,
        unlockRequirement: 'champion_tier'
      },
      {
        id: 'animal_accessory_crown',
        name: 'Golden Crown',
        description: 'A majestic crown for your favorite animal',
        category: CosmeticCategory.ANIMAL_ACCESSORY,
        rarity: Rarity.EPIC,
        price: { pawCoins: 1000, researchPoints: 100, battleTokens: 50 },
        premiumOnly: false
      },
      {
        id: 'habitat_theme_neon',
        name: 'Neon Cyberpunk Theme',
        description: 'Transform habitats with futuristic neon aesthetics',
        category: CosmeticCategory.HABITAT_THEME,
        rarity: Rarity.RARE,
        price: { pawCoins: 1500, researchPoints: 0, battleTokens: 0 },
        premiumOnly: true
      },
      {
        id: 'battle_effect_lightning',
        name: 'Lightning Strike Effects',
        description: 'Electrifying battle animations',
        category: CosmeticCategory.BATTLE_EFFECT,
        rarity: Rarity.EPIC,
        price: { pawCoins: 800, researchPoints: 0, battleTokens: 25 },
        premiumOnly: false
      }
    ];
  }

  purchaseCosmetic(profile: TrainerProfile, cosmeticId: string): boolean {
    const cosmetic = this.getCosmeticStore().find(c => c.id === cosmeticId);
    if (!cosmetic) {
      return false;
    }

    // Check premium requirement
    if (cosmetic.premiumOnly && !this.isPremiumActive(profile)) {
      return false;
    }

    // Check unlock requirement
    if (cosmetic.unlockRequirement && !this.checkUnlockRequirement(profile, cosmetic.unlockRequirement)) {
      return false;
    }

    // Check if already owned
    if (profile.unlockedCosmetics?.includes(cosmeticId)) {
      return false;
    }

    // Check currency
    if (!this.economyManager.canAfford(profile, cosmetic.price)) {
      return false;
    }

    // Purchase
    this.economyManager.deductCurrency(profile, cosmetic.price);
    
    if (!profile.unlockedCosmetics) {
      profile.unlockedCosmetics = [];
    }
    profile.unlockedCosmetics.push(cosmeticId);

    return true;
  }

  // Tournament passes
  getTournamentPasses(): TournamentPass[] {
    return [
      {
        id: 'weekly_tournament_pass',
        name: 'Weekly Tournament Pass',
        description: 'Access to weekly competitive tournaments',
        tournamentId: 'weekly_competitive',
        price: { pawCoins: 0, researchPoints: 0, battleTokens: 10 },
        benefits: [
          'Entry to weekly tournaments',
          'Exclusive tournament rewards',
          'Priority matchmaking'
        ],
        validUntil: this.getNextWeekEnd()
      },
      {
        id: 'championship_pass',
        name: 'Championship Pass',
        description: 'Premium access to championship events',
        tournamentId: 'monthly_championship',
        price: { pawCoins: 2000, researchPoints: 200, battleTokens: 50 },
        benefits: [
          'Entry to championship tournaments',
          'Legendary animal rewards',
          'Exclusive cosmetic unlocks',
          'Champion title eligibility'
        ],
        validUntil: this.getNextMonthEnd()
      }
    ];
  }

  purchaseTournamentPass(profile: TrainerProfile, passId: string): boolean {
    const pass = this.getTournamentPasses().find(p => p.id === passId);
    if (!pass) {
      return false;
    }

    if (!this.economyManager.canAfford(profile, pass.price)) {
      return false;
    }

    // Check if already owned
    if (profile.tournamentPasses?.some(p => p.id === passId && new Date() < p.validUntil)) {
      return false;
    }

    this.economyManager.deductCurrency(profile, pass.price);
    
    if (!profile.tournamentPasses) {
      profile.tournamentPasses = [];
    }
    profile.tournamentPasses.push(pass);

    return true;
  }

  // Helper methods
  private getSubscriptionCost(tier: PremiumTier, duration: number): Currency {
    const baseCosts: Record<PremiumTier, Currency> = {
      [PremiumTier.FREE]: { pawCoins: 0, researchPoints: 0, battleTokens: 0 },
      [PremiumTier.TRAINER]: { pawCoins: 500, researchPoints: 0, battleTokens: 0 },
      [PremiumTier.ELITE]: { pawCoins: 1000, researchPoints: 0, battleTokens: 0 },
      [PremiumTier.CHAMPION]: { pawCoins: 2000, researchPoints: 0, battleTokens: 0 }
    };

    const baseCost = baseCosts[tier];
    const durationMultiplier = duration / 30; // Base price is for 30 days

    return {
      pawCoins: Math.floor(baseCost.pawCoins * durationMultiplier),
      researchPoints: Math.floor(baseCost.researchPoints * durationMultiplier),
      battleTokens: Math.floor(baseCost.battleTokens * durationMultiplier)
    };
  }

  private checkUnlockRequirement(profile: TrainerProfile, requirement: string): boolean {
    switch (requirement) {
      case 'champion_tier':
        return this.getPremiumTier(profile) === PremiumTier.CHAMPION;
      case 'level_50':
        return profile.level >= 50;
      case 'gym_leader_defeated':
        return profile.badges.length >= 8;
      default:
        return false;
    }
  }

  private getAllCosmeticIds(): string[] {
    return this.getCosmeticStore().map(c => c.id);
  }

  private getNextWeekEnd(): Date {
    const date = new Date();
    const daysUntilSunday = 7 - date.getDay();
    date.setDate(date.getDate() + daysUntilSunday);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private getNextMonthEnd(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0);
    date.setHours(23, 59, 59, 999);
    return date;
  }
}

// Extend TrainerProfile interface to include premium features
declare module '../types/trainer.js' {
  interface TrainerProfile {
    premiumSubscription?: PremiumSubscription;
    unlockedCosmetics?: string[];
    tournamentPasses?: TournamentPass[];
    maxCollectionSize?: number;
  }
}

declare module '../types/trainer.js' {
  interface SocialData {
    lastLoginDate?: string;
    consecutiveDays?: number;
    totalLogins?: number;
  }
}