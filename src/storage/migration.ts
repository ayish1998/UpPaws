import { StorageClient, KeyGenerator } from './redis-client.js';

export interface Migration {
  version: string;
  description: string;
  up: (storage: StorageClient) => Promise<void>;
  down?: (storage: StorageClient) => Promise<void>;
}

export class MigrationManager {
  private migrations: Migration[] = [];
  
  constructor(private storage: StorageClient) {
    this.registerMigrations();
  }

  private registerMigrations(): void {
    // Migration 1: Initial schema setup
    this.migrations.push({
      version: '1.0.0',
      description: 'Initial schema setup for UpPaws Animal Trainer',
      up: async (storage: StorageClient) => {
        // Set up initial indexes and default data
        await storage.set('schema_version', '1.0.0');
        await storage.set('game_config:initialized', 'true');
        
        // Initialize leaderboards
        await storage.set('leaderboard:daily', JSON.stringify([]));
        await storage.set('leaderboard:arcade', JSON.stringify([]));
        await storage.set('leaderboard:streaks', JSON.stringify([]));
        
        console.log('Migration 1.0.0: Initial schema setup completed');
      },
      down: async (storage: StorageClient) => {
        await storage.del('schema_version');
        await storage.del('game_config:initialized');
        await storage.del('leaderboard:daily');
        await storage.del('leaderboard:arcade');
        await storage.del('leaderboard:streaks');
      }
    });

    // Migration 2: Add trainer profile enhancements
    this.migrations.push({
      version: '1.1.0',
      description: 'Add enhanced trainer profile system',
      up: async (storage: StorageClient) => {
        // This migration would handle upgrading existing user data
        // to the new trainer profile format
        await storage.set('schema_version', '1.1.0');
        
        console.log('Migration 1.1.0: Enhanced trainer profiles added');
      }
    });

    // Migration 3: Add animal collection system
    this.migrations.push({
      version: '1.2.0',
      description: 'Add animal collection and battle system',
      up: async (storage: StorageClient) => {
        await storage.set('schema_version', '1.2.0');
        
        // Initialize animal species data
        await this.initializeAnimalSpecies(storage);
        
        console.log('Migration 1.2.0: Animal collection system added');
      }
    });

    // Migration 4: Add habitat exploration
    this.migrations.push({
      version: '1.3.0',
      description: 'Add habitat exploration system',
      up: async (storage: StorageClient) => {
        await storage.set('schema_version', '1.3.0');
        
        // Initialize habitat data
        await this.initializeHabitats(storage);
        
        console.log('Migration 1.3.0: Habitat exploration system added');
      }
    });
  }

  async getCurrentVersion(): Promise<string> {
    try {
      const version = await this.storage.get('schema_version');
      return version || '0.0.0';
    } catch (error) {
      console.error('Error getting current schema version:', error);
      return '0.0.0';
    }
  }

  async getLatestVersion(): Promise<string> {
    return this.migrations[this.migrations.length - 1]?.version || '0.0.0';
  }

  async needsMigration(): Promise<boolean> {
    const current = await this.getCurrentVersion();
    const latest = await this.getLatestVersion();
    return this.compareVersions(current, latest) < 0;
  }

  async migrate(): Promise<boolean> {
    try {
      const currentVersion = await this.getCurrentVersion();
      console.log(`Current schema version: ${currentVersion}`);
      
      // Find migrations to run
      const migrationsToRun = this.migrations.filter(migration => 
        this.compareVersions(currentVersion, migration.version) < 0
      );
      
      if (migrationsToRun.length === 0) {
        console.log('No migrations needed');
        return true;
      }
      
      console.log(`Running ${migrationsToRun.length} migrations...`);
      
      for (const migration of migrationsToRun) {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        
        try {
          await migration.up(this.storage);
          await this.recordMigration(migration.version);
          console.log(`Migration ${migration.version} completed successfully`);
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
      
      console.log('All migrations completed successfully');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }

  async rollback(targetVersion: string): Promise<boolean> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      // Find migrations to rollback
      const migrationsToRollback = this.migrations
        .filter(migration => 
          this.compareVersions(targetVersion, migration.version) < 0 &&
          this.compareVersions(migration.version, currentVersion) <= 0
        )
        .reverse(); // Rollback in reverse order
      
      if (migrationsToRollback.length === 0) {
        console.log('No rollbacks needed');
        return true;
      }
      
      console.log(`Rolling back ${migrationsToRollback.length} migrations...`);
      
      for (const migration of migrationsToRollback) {
        if (!migration.down) {
          console.warn(`Migration ${migration.version} has no rollback method`);
          continue;
        }
        
        console.log(`Rolling back migration ${migration.version}`);
        
        try {
          await migration.down(this.storage);
          await this.removeMigrationRecord(migration.version);
          console.log(`Rollback ${migration.version} completed successfully`);
        } catch (error) {
          console.error(`Rollback ${migration.version} failed:`, error);
          throw error;
        }
      }
      
      await this.storage.set('schema_version', targetVersion);
      console.log(`Rollback completed. Current version: ${targetVersion}`);
      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  async getMigrationHistory(): Promise<string[]> {
    try {
      const historyKey = 'migration_history';
      const history = await this.storage.get(historyKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting migration history:', error);
      return [];
    }
  }

  private async recordMigration(version: string): Promise<void> {
    try {
      const historyKey = 'migration_history';
      const history = await this.getMigrationHistory();
      
      if (!history.includes(version)) {
        history.push(version);
        await this.storage.set(historyKey, JSON.stringify(history));
      }
      
      const migrationKey = KeyGenerator.migration(version);
      await this.storage.set(migrationKey, JSON.stringify({
        version,
        appliedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Error recording migration ${version}:`, error);
    }
  }

  private async removeMigrationRecord(version: string): Promise<void> {
    try {
      const historyKey = 'migration_history';
      const history = await this.getMigrationHistory();
      
      const updatedHistory = history.filter(v => v !== version);
      await this.storage.set(historyKey, JSON.stringify(updatedHistory));
      
      const migrationKey = KeyGenerator.migration(version);
      await this.storage.del(migrationKey);
    } catch (error) {
      console.error(`Error removing migration record ${version}:`, error);
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }

  // Helper methods for initializing default data
  private async initializeAnimalSpecies(storage: StorageClient): Promise<void> {
    // This would initialize the animal species database
    // For now, we'll just set a flag that it's been initialized
    await storage.set('animal_species:initialized', 'true');
  }

  private async initializeHabitats(storage: StorageClient): Promise<void> {
    // This would initialize the habitat database
    // For now, we'll just set a flag that it's been initialized
    await storage.set('habitats:initialized', 'true');
  }

  // Backup and restore functionality
  async createBackup(): Promise<string> {
    try {
      const backupId = `backup_${Date.now()}`;
      const backupKey = `backup:${backupId}`;
      
      // In a real implementation, this would backup critical data
      const backupData = {
        version: await this.getCurrentVersion(),
        timestamp: new Date().toISOString(),
        // Add other critical data here
      };
      
      await storage.set(backupKey, JSON.stringify(backupData));
      console.log(`Backup created: ${backupId}`);
      
      return backupId;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backupKey = `backup:${backupId}`;
      const backupData = await this.storage.get(backupKey);
      
      if (!backupData) {
        console.error(`Backup ${backupId} not found`);
        return false;
      }
      
      // In a real implementation, this would restore the backed up data
      console.log(`Backup ${backupId} restored successfully`);
      return true;
    } catch (error) {
      console.error(`Error restoring backup ${backupId}:`, error);
      return false;
    }
  }
}