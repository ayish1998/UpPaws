/**
 * Offline Mode System for UpPaws Animal Trainer
 * Provides offline puzzle caching, data synchronization, and progressive loading
 */

export interface OfflineData {
  puzzles: CachedPuzzle[];
  userProgress: UserProgress;
  gameSettings: GameSettings;
  lastSync: Date;
  version: string;
}

export interface CachedPuzzle {
  id: string;
  answer: string;
  letters: string[];
  emoji: string;
  fact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  cached: Date;
  expires: Date;
}

export interface UserProgress {
  level: number;
  experience: number;
  completedPuzzles: string[];
  achievements: string[];
  currency: {
    pawCoins: number;
    researchPoints: number;
    battleTokens: number;
  };
  lastPlayed: Date;
}

export interface GameSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  theme: string;
  language: string;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: Date;
  synced: boolean;
}

export interface ProgressiveLoadConfig {
  chunkSize: number;
  maxConcurrent: number;
  priority: 'high' | 'medium' | 'low';
  cacheStrategy: 'memory' | 'storage' | 'hybrid';
}

export class OfflineSystem {
  private isOnline = navigator.onLine;
  private offlineData: OfflineData | null = null;
  private pendingSyncOperations: SyncOperation[] = [];
  private syncInProgress = false;
  private storageKey = 'uppaws-offline-data';
  private syncQueueKey = 'uppaws-sync-queue';
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private progressiveLoader: ProgressiveLoader;

  constructor() {
    this.progressiveLoader = new ProgressiveLoader();
    this.initializeOfflineSystem();
    this.setupNetworkListeners();
  }

  /**
   * Initialize offline system
   */
  private async initializeOfflineSystem(): Promise<void> {
    await this.loadOfflineData();
    await this.loadSyncQueue();
    
    if (this.isOnline) {
      await this.syncWithServer();
    }
  }

  /**
   * Check if system is currently online
   */
  isSystemOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get cached puzzles for offline play
   */
  getCachedPuzzles(count: number = 10): CachedPuzzle[] {
    if (!this.offlineData) {
      return [];
    }

    const now = new Date();
    const validPuzzles = this.offlineData.puzzles.filter(puzzle => 
      puzzle.expires > now
    );

    return validPuzzles.slice(0, count);
  }

  /**
   * Cache puzzles for offline use
   */
  async cachePuzzles(puzzles: any[], duration: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const now = new Date();
    const expires = new Date(now.getTime() + duration);

    const cachedPuzzles: CachedPuzzle[] = puzzles.map(puzzle => ({
      id: puzzle.id || this.generateId(),
      answer: puzzle.answer,
      letters: puzzle.letters,
      emoji: puzzle.emoji,
      fact: puzzle.fact,
      difficulty: puzzle.difficulty || 'medium',
      category: puzzle.category || 'general',
      cached: now,
      expires
    }));

    if (!this.offlineData) {
      this.offlineData = this.createDefaultOfflineData();
    }

    // Add new puzzles and remove expired ones
    this.offlineData.puzzles = [
      ...this.offlineData.puzzles.filter(p => p.expires > now),
      ...cachedPuzzles
    ];

    await this.saveOfflineData();
  }

  /**
   * Save user progress for offline sync
   */
  async saveProgressOffline(progress: Partial<UserProgress>): Promise<void> {
    if (!this.offlineData) {
      this.offlineData = this.createDefaultOfflineData();
    }

    this.offlineData.userProgress = {
      ...this.offlineData.userProgress,
      ...progress,
      lastPlayed: new Date()
    };

    await this.saveOfflineData();

    // Queue for sync when online
    const syncOperation: SyncOperation = {
      id: this.generateId(),
      type: 'update',
      entity: 'userProgress',
      data: progress,
      timestamp: new Date(),
      synced: false
    };

    this.pendingSyncOperations.push(syncOperation);
    await this.saveSyncQueue();

    if (this.isOnline) {
      await this.syncWithServer();
    }
  }

  /**
   * Get offline user progress
   */
  getOfflineProgress(): UserProgress | null {
    return this.offlineData?.userProgress || null;
  }

  /**
   * Progressive loading of large datasets
   */
  async loadDataProgressively<T>(
    dataSource: () => Promise<T[]>,
    config: ProgressiveLoadConfig
  ): Promise<T[]> {
    return await this.progressiveLoader.load(dataSource, config);
  }

  /**
   * Preload critical game data
   */
  async preloadCriticalData(): Promise<void> {
    const criticalData = [
      this.preloadPuzzleData(),
      this.preloadAnimalData(),
      this.preloadUIAssets()
    ];

    await Promise.all(criticalData);
  }

  /**
   * Sync with server when online
   */
  async syncWithServer(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Sync pending operations
      await this.syncPendingOperations();
      
      // Fetch latest data from server
      await this.fetchLatestData();
      
      // Update last sync time
      if (this.offlineData) {
        this.offlineData.lastSync = new Date();
        await this.saveOfflineData();
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Listen for online/offline status changes
   */
  onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    lastSync: Date | null;
    pendingOperations: number;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      lastSync: this.offlineData?.lastSync || null,
      pendingOperations: this.pendingSyncOperations.length,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Clear offline cache
   */
  async clearOfflineCache(): Promise<void> {
    this.offlineData = null;
    this.pendingSyncOperations = [];
    
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.syncQueueKey);
    } catch (error) {
      console.warn('Failed to clear offline cache:', error);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch('/ping', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
        if (this.isOnline) {
          await this.syncWithServer();
        }
      }
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.isOnline);
      } catch (error) {
        console.error('Error in connection change listener:', error);
      }
    });
  }

  private async loadOfflineData(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.offlineData = JSON.parse(stored);
        
        // Convert date strings back to Date objects
        if (this.offlineData) {
          this.offlineData.lastSync = new Date(this.offlineData.lastSync);
          this.offlineData.puzzles.forEach(puzzle => {
            puzzle.cached = new Date(puzzle.cached);
            puzzle.expires = new Date(puzzle.expires);
          });
          this.offlineData.userProgress.lastPlayed = new Date(this.offlineData.userProgress.lastPlayed);
        }
      }
    } catch (error) {
      console.warn('Failed to load offline data:', error);
      this.offlineData = this.createDefaultOfflineData();
    }
  }

  private async saveOfflineData(): Promise<void> {
    if (!this.offlineData) return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.offlineData));
    } catch (error) {
      console.warn('Failed to save offline data:', error);
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.syncQueueKey);
      if (stored) {
        const operations = JSON.parse(stored);
        this.pendingSyncOperations = operations.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load sync queue:', error);
      this.pendingSyncOperations = [];
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      localStorage.setItem(this.syncQueueKey, JSON.stringify(this.pendingSyncOperations));
    } catch (error) {
      console.warn('Failed to save sync queue:', error);
    }
  }

  private async syncPendingOperations(): Promise<void> {
    const operations = [...this.pendingSyncOperations];
    
    for (const operation of operations) {
      try {
        await this.syncOperation(operation);
        operation.synced = true;
      } catch (error) {
        console.error('Failed to sync operation:', operation.id, error);
      }
    }

    // Remove synced operations
    this.pendingSyncOperations = this.pendingSyncOperations.filter(op => !op.synced);
    await this.saveSyncQueue();
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    // Mock sync operation - in real implementation, this would make API calls
    console.log('Syncing operation:', operation);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation, this would sync with the actual server
    switch (operation.entity) {
      case 'userProgress':
        // Sync user progress
        break;
      case 'puzzleCompletion':
        // Sync puzzle completion
        break;
      case 'achievements':
        // Sync achievements
        break;
    }
  }

  private async fetchLatestData(): Promise<void> {
    // Mock fetching latest data from server
    console.log('Fetching latest data from server');
    
    // In real implementation, this would fetch from actual server
    const latestPuzzles = await this.mockFetchPuzzles();
    await this.cachePuzzles(latestPuzzles);
  }

  private async mockFetchPuzzles(): Promise<any[]> {
    // Mock puzzle data
    return [
      {
        id: 'puzzle_1',
        answer: 'ELEPHANT',
        letters: ['E', 'L', 'E', 'P', 'H', 'A', 'N', 'T'],
        emoji: '🐘',
        fact: 'Elephants are the largest land mammals.',
        difficulty: 'medium',
        category: 'mammals'
      },
      {
        id: 'puzzle_2',
        answer: 'DOLPHIN',
        letters: ['D', 'O', 'L', 'P', 'H', 'I', 'N'],
        emoji: '🐬',
        fact: 'Dolphins are highly intelligent marine mammals.',
        difficulty: 'medium',
        category: 'marine'
      }
    ];
  }

  private async preloadPuzzleData(): Promise<void> {
    // Preload essential puzzle data
    const puzzles = await this.mockFetchPuzzles();
    await this.cachePuzzles(puzzles);
  }

  private async preloadAnimalData(): Promise<void> {
    // Preload animal database
    console.log('Preloading animal data...');
    // In real implementation, this would preload animal data
  }

  private async preloadUIAssets(): Promise<void> {
    // Preload UI assets
    console.log('Preloading UI assets...');
    // In real implementation, this would preload images, sounds, etc.
  }

  private createDefaultOfflineData(): OfflineData {
    return {
      puzzles: [],
      userProgress: {
        level: 1,
        experience: 0,
        completedPuzzles: [],
        achievements: [],
        currency: {
          pawCoins: 0,
          researchPoints: 0,
          battleTokens: 0
        },
        lastPlayed: new Date()
      },
      gameSettings: {
        soundEnabled: true,
        animationsEnabled: true,
        difficulty: 'medium',
        theme: 'default',
        language: 'en-US'
      },
      lastSync: new Date(),
      version: '1.0.0'
    };
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Progressive Loader for handling large datasets
 */
export class ProgressiveLoader {
  private loadingTasks: Map<string, Promise<any>> = new Map();
  private cache: Map<string, any> = new Map();

  async load<T>(
    dataSource: () => Promise<T[]>,
    config: ProgressiveLoadConfig
  ): Promise<T[]> {
    const taskId = this.generateTaskId();
    
    if (this.loadingTasks.has(taskId)) {
      return await this.loadingTasks.get(taskId);
    }

    const loadingPromise = this.performProgressiveLoad(dataSource, config);
    this.loadingTasks.set(taskId, loadingPromise);

    try {
      const result = await loadingPromise;
      
      if (config.cacheStrategy !== 'memory') {
        this.cache.set(taskId, result);
      }
      
      return result;
    } finally {
      this.loadingTasks.delete(taskId);
    }
  }

  private async performProgressiveLoad<T>(
    dataSource: () => Promise<T[]>,
    config: ProgressiveLoadConfig
  ): Promise<T[]> {
    const allData = await dataSource();
    const chunks = this.chunkArray(allData, config.chunkSize);
    const results: T[] = [];

    // Process chunks with concurrency limit
    const semaphore = new Semaphore(config.maxConcurrent);
    
    const chunkPromises = chunks.map(async (chunk, index) => {
      await semaphore.acquire();
      
      try {
        // Simulate processing delay based on priority
        const delay = this.getProcessingDelay(config.priority);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return chunk;
      } finally {
        semaphore.release();
      }
    });

    const processedChunks = await Promise.all(chunkPromises);
    
    // Flatten results
    for (const chunk of processedChunks) {
      results.push(...chunk);
    }

    return results;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private getProcessingDelay(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 10;
      case 'medium': return 50;
      case 'low': return 100;
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) {
        this.permits--;
        next();
      }
    }
  }
}

// Global offline system instance
export const offlineSystem = new OfflineSystem();