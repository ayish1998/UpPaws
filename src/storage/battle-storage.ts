import { Battle, BattleResult, validateBattle } from '../types/battle.js';
import { StorageClient, KeyGenerator } from './redis-client.js';

export class BattleStorage {
  constructor(private storage: StorageClient) {}

  async getBattle(battleId: string): Promise<Battle | null> {
    try {
      const key = KeyGenerator.battle(battleId);
      const data = await this.storage.get(key);
      
      if (!data) {
        return null;
      }
      
      const battle = JSON.parse(data) as Battle;
      
      // Validate the loaded battle
      const errors = validateBattle(battle);
      if (errors.length > 0) {
        console.warn(`Invalid battle data for ${battleId}:`, errors);
        return null;
      }
      
      return battle;
    } catch (error) {
      console.error(`Error loading battle ${battleId}:`, error);
      return null;
    }
  }

  async saveBattle(battle: Battle): Promise<boolean> {
    try {
      // Validate before saving
      const errors = validateBattle(battle);
      if (errors.length > 0) {
        console.error(`Cannot save invalid battle:`, errors);
        return false;
      }
      
      const key = KeyGenerator.battle(battle.battleId);
      const data = JSON.stringify(battle);
      
      await this.storage.set(key, data);
      
      // Update battle indexes
      await this.updateBattleIndexes(battle);
      
      return true;
    } catch (error) {
      console.error(`Error saving battle ${battle.battleId}:`, error);
      return false;
    }
  }

  async createBattle(battle: Omit<Battle, 'createdAt'>): Promise<Battle | null> {
    try {
      const fullBattle: Battle = {
        ...battle,
        createdAt: new Date()
      };
      
      const success = await this.saveBattle(fullBattle);
      return success ? fullBattle : null;
    } catch (error) {
      console.error(`Error creating battle:`, error);
      return null;
    }
  }

  async updateBattleState(battleId: string, updates: Partial<Battle>): Promise<boolean> {
    try {
      const battle = await this.getBattle(battleId);
      if (!battle) {
        return false;
      }
      
      // Apply updates
      Object.assign(battle, updates);
      
      return await this.saveBattle(battle);
    } catch (error) {
      console.error(`Error updating battle state for ${battleId}:`, error);
      return false;
    }
  }

  async completeBattle(battleId: string, result: BattleResult): Promise<boolean> {
    try {
      const battle = await this.getBattle(battleId);
      if (!battle) {
        return false;
      }
      
      battle.result = result;
      battle.battleState = 'completed' as any;
      battle.endedAt = new Date();
      
      const success = await this.saveBattle(battle);
      
      if (success) {
        // Update trainer battle statistics
        await this.updateTrainerBattleStats(battle, result);
      }
      
      return success;
    } catch (error) {
      console.error(`Error completing battle ${battleId}:`, error);
      return false;
    }
  }

  async getTrainerBattles(trainerId: string, limit: number = 10): Promise<Battle[]> {
    try {
      const indexKey = `trainer:battles:${trainerId}`;
      const battleIds = await this.storage.zrevrange(indexKey, 0, limit - 1);
      
      const battles: Battle[] = [];
      
      for (const battleId of battleIds) {
        const battle = await this.getBattle(battleId);
        if (battle) {
          battles.push(battle);
        }
      }
      
      return battles;
    } catch (error) {
      console.error(`Error getting trainer battles for ${trainerId}:`, error);
      return [];
    }
  }

  async getActiveBattles(trainerId?: string): Promise<Battle[]> {
    try {
      if (trainerId) {
        const battles = await this.getTrainerBattles(trainerId, 50);
        return battles.filter(battle => 
          battle.battleState === 'in_progress' || battle.battleState === 'waiting'
        );
      }
      
      // Getting all active battles would require a global index
      return [];
    } catch (error) {
      console.error(`Error getting active battles:`, error);
      return [];
    }
  }

  async getBattlesByType(battleType: string, limit: number = 10): Promise<Battle[]> {
    try {
      const indexKey = `battles:type:${battleType}`;
      const battleIds = await this.storage.zrevrange(indexKey, 0, limit - 1);
      
      const battles: Battle[] = [];
      
      for (const battleId of battleIds) {
        const battle = await this.getBattle(battleId);
        if (battle) {
          battles.push(battle);
        }
      }
      
      return battles;
    } catch (error) {
      console.error(`Error getting battles by type ${battleType}:`, error);
      return [];
    }
  }

  async deleteBattle(battleId: string): Promise<boolean> {
    try {
      const battle = await this.getBattle(battleId);
      if (!battle) {
        return true; // Already deleted
      }
      
      // Remove from indexes
      for (const participant of battle.participants) {
        const trainerIndexKey = `trainer:battles:${participant.trainerId}`;
        await this.storage.zrem(trainerIndexKey, battleId);
      }
      
      const typeIndexKey = `battles:type:${battle.type}`;
      await this.storage.zrem(typeIndexKey, battleId);
      
      // Delete main battle data
      const key = KeyGenerator.battle(battleId);
      await this.storage.del(key);
      
      return true;
    } catch (error) {
      console.error(`Error deleting battle ${battleId}:`, error);
      return false;
    }
  }

  private async updateBattleIndexes(battle: Battle): Promise<void> {
    try {
      const timestamp = battle.createdAt.getTime();
      
      // Update trainer battle indexes
      for (const participant of battle.participants) {
        const trainerIndexKey = `trainer:battles:${participant.trainerId}`;
        await this.storage.zadd(trainerIndexKey, timestamp, battle.battleId);
      }
      
      // Update battle type index
      const typeIndexKey = `battles:type:${battle.type}`;
      await this.storage.zadd(typeIndexKey, timestamp, battle.battleId);
      
      // Update battle state index
      const stateIndexKey = `battles:state:${battle.battleState}`;
      await this.storage.zadd(stateIndexKey, timestamp, battle.battleId);
      
    } catch (error) {
      console.error(`Error updating battle indexes for ${battle.battleId}:`, error);
    }
  }

  private async updateTrainerBattleStats(battle: Battle, result: BattleResult): Promise<void> {
    try {
      // This would update trainer statistics
      // Implementation would depend on the trainer storage system
      for (const participant of battle.participants) {
        const isWinner = result.winnerId === participant.trainerId;
        const statsKey = `trainer:battle_stats:${participant.trainerId}`;
        
        if (isWinner) {
          await this.storage.hset(statsKey, 'wins', 
            (parseInt(await this.storage.hget(statsKey, 'wins') || '0') + 1).toString()
          );
        } else if (!result.isDraw) {
          await this.storage.hset(statsKey, 'losses', 
            (parseInt(await this.storage.hget(statsKey, 'losses') || '0') + 1).toString()
          );
        }
        
        await this.storage.hset(statsKey, 'total_battles', 
          (parseInt(await this.storage.hget(statsKey, 'total_battles') || '0') + 1).toString()
        );
      }
    } catch (error) {
      console.error(`Error updating trainer battle stats:`, error);
    }
  }

  // Battle replay management
  async saveBattleReplay(battleId: string, replayData: any): Promise<boolean> {
    try {
      const key = `battle:replay:${battleId}`;
      const data = JSON.stringify(replayData);
      
      // Set TTL for replays (e.g., 30 days)
      await this.storage.set(key, data, { ttl: 30 * 24 * 60 * 60 });
      
      return true;
    } catch (error) {
      console.error(`Error saving battle replay for ${battleId}:`, error);
      return false;
    }
  }

  async getBattleReplay(battleId: string): Promise<any | null> {
    try {
      const key = `battle:replay:${battleId}`;
      const data = await this.storage.get(key);
      
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting battle replay for ${battleId}:`, error);
      return null;
    }
  }
}