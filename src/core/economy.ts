import { Currency, Item, ItemType, Rarity, ItemEffect } from '../types/common.js';
import { TrainerProfile } from '../types/trainer.js';

export interface EconomyConfig {
  dailyRewards: {
    pawCoins: number;
    researchPoints: number;
    battleTokens: number;
  };
  currencyRates: {
    pawCoinsToResearchPoints: number;
    pawCoinsToBattleTokens: number;
    researchPointsToBattleTokens: number;
  };
  itemPrices: Record<string, Currency>;
}

export interface DailyReward {
  day: number;
  currency: Currency;
  items: Item[];
  bonusMultiplier: number;
}

export interface LoginBonus {
  consecutiveDays: number;
  lastLoginDate: string;
  totalLogins: number;
  streakRewards: DailyReward[];
}

export class EconomyManager {
  private config: EconomyConfig;

  constructor(config: EconomyConfig) {
    this.config = config;
  }

  // Currency management
  addCurrency(profile: TrainerProfile, currency: Partial<Currency>): void {
    if (currency.pawCoins) {
      profile.currency.pawCoins += currency.pawCoins;
    }
    if (currency.researchPoints) {
      profile.currency.researchPoints += currency.researchPoints;
    }
    if (currency.battleTokens) {
      profile.currency.battleTokens += currency.battleTokens;
    }
  }

  canAfford(profile: TrainerProfile, cost: Currency): boolean {
    return (
      profile.currency.pawCoins >= cost.pawCoins &&
      profile.currency.researchPoints >= cost.researchPoints &&
      profile.currency.battleTokens >= cost.battleTokens
    );
  }

  deductCurrency(profile: TrainerProfile, cost: Currency): boolean {
    if (!this.canAfford(profile, cost)) {
      return false;
    }

    profile.currency.pawCoins -= cost.pawCoins;
    profile.currency.researchPoints -= cost.researchPoints;
    profile.currency.battleTokens -= cost.battleTokens;
    return true;
  }

  // Currency conversion
  convertCurrency(
    profile: TrainerProfile,
    fromType: keyof Currency,
    toType: keyof Currency,
    amount: number
  ): boolean {
    const rates = this.config.currencyRates;
    let rate = 1;

    // Determine conversion rate
    if (fromType === 'pawCoins' && toType === 'researchPoints') {
      rate = rates.pawCoinsToResearchPoints;
    } else if (fromType === 'pawCoins' && toType === 'battleTokens') {
      rate = rates.pawCoinsToBattleTokens;
    } else if (fromType === 'researchPoints' && toType === 'battleTokens') {
      rate = rates.researchPointsToBattleTokens;
    } else {
      return false; // Invalid conversion
    }

    const cost = Math.ceil(amount / rate);
    if (profile.currency[fromType] < cost) {
      return false;
    }

    profile.currency[fromType] -= cost;
    profile.currency[toType] += amount;
    return true;
  }

  // Daily rewards and login bonuses
  calculateDailyReward(consecutiveDays: number): DailyReward {
    const baseReward = this.config.dailyRewards;
    const multiplier = Math.min(2.0, 1 + (consecutiveDays - 1) * 0.1);

    const reward: DailyReward = {
      day: consecutiveDays,
      currency: {
        pawCoins: Math.floor(baseReward.pawCoins * multiplier),
        researchPoints: Math.floor(baseReward.researchPoints * multiplier),
        battleTokens: Math.floor(baseReward.battleTokens * multiplier)
      },
      items: [],
      bonusMultiplier: multiplier
    };

    // Add bonus items for milestone days
    if (consecutiveDays % 7 === 0) {
      reward.items.push(this.createItem('weekly_bonus_pack', ItemType.CAPTURE, Rarity.RARE, 1));
    }
    if (consecutiveDays % 30 === 0) {
      reward.items.push(this.createItem('monthly_legendary_pack', ItemType.CAPTURE, Rarity.LEGENDARY, 1));
    }

    return reward;
  }

  processLoginBonus(profile: TrainerProfile): DailyReward | null {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = profile.socialData.lastLoginDate || '';
    
    if (lastLogin === today) {
      return null; // Already claimed today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let consecutiveDays = 1;
    if (lastLogin === yesterdayStr) {
      consecutiveDays = (profile.socialData.consecutiveDays || 0) + 1;
    }

    const reward = this.calculateDailyReward(consecutiveDays);
    
    // Apply reward
    this.addCurrency(profile, reward.currency);
    reward.items.forEach(item => this.addItemToInventory(profile, item));

    // Update profile
    profile.socialData.lastLoginDate = today;
    profile.socialData.consecutiveDays = consecutiveDays;
    profile.socialData.totalLogins = (profile.socialData.totalLogins || 0) + 1;

    return reward;
  }

  // Item management
  createItem(id: string, type: ItemType, rarity: Rarity, quantity: number, effects?: ItemEffect[]): Item {
    const itemData = this.getItemData(id);
    return {
      id,
      name: itemData.name,
      description: itemData.description,
      type,
      rarity,
      quantity,
      effects: effects || itemData.effects || []
    };
  }

  addItemToInventory(profile: TrainerProfile, item: Item): void {
    const existingItem = profile.inventory.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      profile.inventory.push({ ...item });
    }
  }

  removeItemFromInventory(profile: TrainerProfile, itemId: string, quantity: number): boolean {
    const item = profile.inventory.find(i => i.id === itemId);
    if (!item || item.quantity < quantity) {
      return false;
    }

    item.quantity -= quantity;
    if (item.quantity === 0) {
      profile.inventory = profile.inventory.filter(i => i.id !== itemId);
    }
    return true;
  }

  // Item crafting system
  craftItem(profile: TrainerProfile, recipeId: string): boolean {
    const recipe = this.getCraftingRecipe(recipeId);
    if (!recipe) {
      return false;
    }

    // Check if player has required materials
    for (const material of recipe.materials) {
      const item = profile.inventory.find(i => i.id === material.itemId);
      if (!item || item.quantity < material.quantity) {
        return false;
      }
    }

    // Check currency cost
    if (!this.canAfford(profile, recipe.cost)) {
      return false;
    }

    // Consume materials and currency
    for (const material of recipe.materials) {
      this.removeItemFromInventory(profile, material.itemId, material.quantity);
    }
    this.deductCurrency(profile, recipe.cost);

    // Create crafted item
    const craftedItem = this.createItem(
      recipe.resultItemId,
      recipe.resultType,
      recipe.resultRarity,
      recipe.resultQuantity
    );
    this.addItemToInventory(profile, craftedItem);

    return true;
  }

  // Item upgrade system
  upgradeItem(profile: TrainerProfile, itemId: string): boolean {
    const item = profile.inventory.find(i => i.id === itemId);
    if (!item) {
      return false;
    }

    const upgradeData = this.getItemUpgradeData(itemId);
    if (!upgradeData) {
      return false;
    }

    // Check requirements
    if (!this.canAfford(profile, upgradeData.cost)) {
      return false;
    }

    for (const material of upgradeData.materials) {
      const materialItem = profile.inventory.find(i => i.id === material.itemId);
      if (!materialItem || materialItem.quantity < material.quantity) {
        return false;
      }
    }

    // Consume resources
    this.deductCurrency(profile, upgradeData.cost);
    for (const material of upgradeData.materials) {
      this.removeItemFromInventory(profile, material.itemId, material.quantity);
    }

    // Apply upgrade
    item.effects = upgradeData.newEffects;
    if (upgradeData.newRarity) {
      item.rarity = upgradeData.newRarity;
    }

    return true;
  }

  // Helper methods for item data (would be loaded from config/database)
  private getItemData(itemId: string): { name: string; description: string; effects?: ItemEffect[] } {
    const itemDatabase: Record<string, any> = {
      'puzzle_hint': {
        name: 'Puzzle Hint',
        description: 'Reveals one letter in the puzzle',
        effects: [{ type: 'hint', value: 1 }]
      },
      'time_extension': {
        name: 'Time Extension',
        description: 'Adds 30 seconds to puzzle timer',
        effects: [{ type: 'time_bonus', value: 30 }]
      },
      'capture_boost': {
        name: 'Capture Boost',
        description: 'Increases animal capture rate by 25%',
        effects: [{ type: 'capture_rate', value: 0.25 }]
      },
      'health_potion': {
        name: 'Health Potion',
        description: 'Restores 50 HP to an animal',
        effects: [{ type: 'heal', value: 50 }]
      },
      'attack_boost': {
        name: 'Attack Boost',
        description: 'Increases attack by 20% for 3 turns',
        effects: [{ type: 'attack_boost', value: 0.2, duration: 3 }]
      },
      'weekly_bonus_pack': {
        name: 'Weekly Bonus Pack',
        description: 'Contains random capture items',
        effects: []
      },
      'monthly_legendary_pack': {
        name: 'Monthly Legendary Pack',
        description: 'Contains rare and legendary items',
        effects: []
      }
    };

    return itemDatabase[itemId] || { name: 'Unknown Item', description: 'Unknown item' };
  }

  private getCraftingRecipe(recipeId: string): CraftingRecipe | null {
    const recipes: Record<string, CraftingRecipe> = {
      'super_capture_boost': {
        materials: [
          { itemId: 'capture_boost', quantity: 3 },
          { itemId: 'rare_essence', quantity: 1 }
        ],
        cost: { pawCoins: 500, researchPoints: 100, battleTokens: 0 },
        resultItemId: 'super_capture_boost',
        resultType: ItemType.CAPTURE,
        resultRarity: Rarity.EPIC,
        resultQuantity: 1
      }
    };

    return recipes[recipeId] || null;
  }

  private getItemUpgradeData(itemId: string): ItemUpgradeData | null {
    const upgrades: Record<string, ItemUpgradeData> = {
      'capture_boost': {
        materials: [
          { itemId: 'upgrade_crystal', quantity: 2 }
        ],
        cost: { pawCoins: 200, researchPoints: 50, battleTokens: 0 },
        newEffects: [{ type: 'capture_rate', value: 0.4 }],
        newRarity: Rarity.RARE
      }
    };

    return upgrades[itemId] || null;
  }
}

export interface CraftingRecipe {
  materials: { itemId: string; quantity: number }[];
  cost: Currency;
  resultItemId: string;
  resultType: ItemType;
  resultRarity: Rarity;
  resultQuantity: number;
}

export interface ItemUpgradeData {
  materials: { itemId: string; quantity: number }[];
  cost: Currency;
  newEffects: ItemEffect[];
  newRarity?: Rarity;
}

// Default economy configuration
export const defaultEconomyConfig: EconomyConfig = {
  dailyRewards: {
    pawCoins: 50,
    researchPoints: 10,
    battleTokens: 5
  },
  currencyRates: {
    pawCoinsToResearchPoints: 5, // 5 pawCoins = 1 researchPoint
    pawCoinsToBattleTokens: 10,  // 10 pawCoins = 1 battleToken
    researchPointsToBattleTokens: 2 // 2 researchPoints = 1 battleToken
  },
  itemPrices: {
    'puzzle_hint': { pawCoins: 10, researchPoints: 0, battleTokens: 0 },
    'time_extension': { pawCoins: 15, researchPoints: 0, battleTokens: 0 },
    'capture_boost': { pawCoins: 25, researchPoints: 5, battleTokens: 0 },
    'health_potion': { pawCoins: 20, researchPoints: 0, battleTokens: 2 },
    'attack_boost': { pawCoins: 30, researchPoints: 0, battleTokens: 3 }
  }
};