/**
 * Memory Profiling and Performance Tests
 */

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface MemoryProfile {
  snapshots: MemorySnapshot[];
  peakUsage: number;
  averageUsage: number;
  memoryLeaks: MemoryLeak[];
  gcEvents: GCEvent[];
}

export interface MemoryLeak {
  type: string;
  size: number;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface GCEvent {
  timestamp: number;
  type: 'minor' | 'major';
  duration: number;
  freedMemory: number;
}

export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  private gcEvents: GCEvent[] = [];
  private isProfileActive = false;
  private profileInterval?: NodeJS.Timeout;

  startProfiling(intervalMs: number = 100): void {
    if (this.isProfileActive) {
      throw new Error('Profiling is already active');
    }

    this.isProfileActive = true;
    this.snapshots = [];
    this.gcEvents = [];

    this.profileInterval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);

    // Monitor GC events if available
    if (global.gc) {
      this.monitorGC();
    }
  }

  stopProfiling(): MemoryProfile {
    if (!this.isProfileActive) {
      throw new Error('Profiling is not active');
    }

    this.isProfileActive = false;
    if (this.profileInterval) {
      clearInterval(this.profileInterval);
    }

    return this.generateProfile();
  }

  private takeSnapshot(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.snapshots.push({
        timestamp: performance.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });
    }
  }

  private monitorGC(): void {
    // This is a simplified GC monitoring - in real implementation,
    // you'd use more sophisticated tools like Chrome DevTools Protocol
    const originalGC = global.gc;
    if (originalGC) {
      (global as any).gc = () => {
        const beforeMemory = this.getCurrentMemoryUsage();
        const startTime = performance.now();
        
        originalGC();
        
        const endTime = performance.now();
        const afterMemory = this.getCurrentMemoryUsage();
        
        this.gcEvents.push({
          timestamp: startTime,
          type: 'major', // Simplified - would need more detection logic
          duration: endTime - startTime,
          freedMemory: beforeMemory - afterMemory
        });
      };
    }
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private generateProfile(): MemoryProfile {
    const usages = this.snapshots.map(s => s.usedJSHeapSize);
    const peakUsage = Math.max(...usages);
    const averageUsage = usages.reduce((sum, usage) => sum + usage, 0) / usages.length;

    const memoryLeaks = this.detectMemoryLeaks();

    return {
      snapshots: this.snapshots,
      peakUsage,
      averageUsage,
      memoryLeaks,
      gcEvents: this.gcEvents
    };
  }

  private detectMemoryLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    
    if (this.snapshots.length < 10) {
      return leaks; // Not enough data
    }

    // Check for consistent memory growth
    const firstHalf = this.snapshots.slice(0, Math.floor(this.snapshots.length / 2));
    const secondHalf = this.snapshots.slice(Math.floor(this.snapshots.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / secondHalf.length;
    
    const growthRate = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
    
    if (growthRate > 0.2) { // 20% growth indicates potential leak
      leaks.push({
        type: 'Memory Growth',
        size: secondHalfAvg - firstHalfAvg,
        location: 'General heap',
        severity: growthRate > 0.5 ? 'critical' : growthRate > 0.3 ? 'high' : 'medium'
      });
    }

    // Check for memory not being freed after operations
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const firstSnapshot = this.snapshots[0];
    const totalGrowth = lastSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize;
    
    if (totalGrowth > 10 * 1024 * 1024) { // 10MB growth
      leaks.push({
        type: 'Persistent Memory Growth',
        size: totalGrowth,
        location: 'Application lifecycle',
        severity: totalGrowth > 50 * 1024 * 1024 ? 'critical' : 'high'
      });
    }

    return leaks;
  }
}

describe('Memory Profiling and Performance', () => {
  let memoryProfiler: MemoryProfiler;

  beforeEach(() => {
    memoryProfiler = new MemoryProfiler();
  });

  afterEach(() => {
    if (memoryProfiler) {
      try {
        memoryProfiler.stopProfiling();
      } catch (error) {
        // Profiling might not be active
      }
    }
  });

  describe('Memory Usage Tests', () => {
    test('should not leak memory during puzzle generation', async () => {
      memoryProfiler.startProfiling(50); // Take snapshot every 50ms

      // Generate many puzzles to test for memory leaks
      for (let i = 0; i < 100; i++) {
        const puzzle = generateLargePuzzle();
        await solvePuzzleWithComplexLogic(puzzle);
        
        // Simulate cleanup
        if (i % 10 === 0) {
          await forceGarbageCollection();
        }
      }

      const profile = memoryProfiler.stopProfiling();

      expect(profile.memoryLeaks.length).toBe(0);
      expect(profile.peakUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB peak
    }, 30000);

    test('should efficiently manage animal collection data', async () => {
      memoryProfiler.startProfiling(100);

      // Create and manipulate large animal collections
      const collections = [];
      for (let i = 0; i < 50; i++) {
        const collection = createLargeAnimalCollection(1000); // 1000 animals each
        collections.push(collection);
        
        // Perform operations on collection
        await performCollectionOperations(collection);
        
        // Periodically clear old collections
        if (collections.length > 10) {
          collections.shift(); // Remove oldest collection
        }
      }

      const profile = memoryProfiler.stopProfiling();

      expect(profile.averageUsage).toBeLessThan(200 * 1024 * 1024); // Less than 200MB average
      expect(profile.memoryLeaks.filter(leak => leak.severity === 'critical').length).toBe(0);
    }, 45000);

    test('should handle battle system memory efficiently', async () => {
      memoryProfiler.startProfiling(75);

      // Run multiple concurrent battles
      const battles = [];
      for (let i = 0; i < 20; i++) {
        const battle = createComplexBattle();
        battles.push(simulateIntenseBattle(battle));
      }

      await Promise.all(battles);

      const profile = memoryProfiler.stopProfiling();

      expect(profile.peakUsage).toBeLessThan(150 * 1024 * 1024); // Less than 150MB peak
      expect(profile.gcEvents.length).toBeGreaterThan(0); // GC should have run
    }, 60000);
  });

  describe('Performance Benchmarks', () => {
    test('should maintain 60fps during intensive operations', async () => {
      const frameTargetTime = 16.67; // 60fps = 16.67ms per frame
      const frameTimes: number[] = [];

      memoryProfiler.startProfiling(16); // Profile at 60fps

      // Simulate 60fps rendering for 2 seconds
      for (let frame = 0; frame < 120; frame++) {
        const frameStart = performance.now();
        
        // Simulate frame operations
        await simulateFrameOperations();
        
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        frameTimes.push(frameTime);
        
        // Wait for next frame
        const remainingTime = Math.max(0, frameTargetTime - frameTime);
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      }

      const profile = memoryProfiler.stopProfiling();
      const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      const droppedFrames = frameTimes.filter(time => time > frameTargetTime).length;

      expect(averageFrameTime).toBeLessThan(frameTargetTime);
      expect(droppedFrames / frameTimes.length).toBeLessThan(0.05); // Less than 5% dropped frames
      expect(profile.peakUsage).toBeLessThan(80 * 1024 * 1024); // Efficient memory usage
    }, 10000);

    test('should optimize data structure performance', async () => {
      memoryProfiler.startProfiling(200);

      const performanceTests = [
        () => testArrayOperations(),
        () => testMapOperations(),
        () => testSetOperations(),
        () => testObjectOperations()
      ];

      const results = [];
      for (const test of performanceTests) {
        const startTime = performance.now();
        await test();
        const endTime = performance.now();
        results.push(endTime - startTime);
      }

      const profile = memoryProfiler.stopProfiling();

      // All operations should complete in reasonable time
      expect(Math.max(...results)).toBeLessThan(1000); // Less than 1 second
      expect(profile.memoryLeaks.length).toBe(0);
    }, 15000);
  });

  describe('Resource Cleanup Tests', () => {
    test('should properly cleanup event listeners', async () => {
      memoryProfiler.startProfiling(100);

      const elements = [];
      const listeners = [];

      // Create many elements with event listeners
      for (let i = 0; i < 1000; i++) {
        const element = createMockElement();
        const listener = createMockEventListener();
        
        element.addEventListener('click', listener);
        elements.push(element);
        listeners.push(listener);
      }

      // Cleanup half of them
      for (let i = 0; i < 500; i++) {
        elements[i].removeEventListener('click', listeners[i]);
        elements[i] = null;
        listeners[i] = null;
      }

      await forceGarbageCollection();

      const profile = memoryProfiler.stopProfiling();

      // Should not have significant memory leaks from event listeners
      const eventListenerLeaks = profile.memoryLeaks.filter(leak => 
        leak.type.includes('Event') || leak.location.includes('listener')
      );
      expect(eventListenerLeaks.length).toBe(0);
    }, 20000);

    test('should cleanup timers and intervals', async () => {
      memoryProfiler.startProfiling(150);

      const timers: NodeJS.Timeout[] = [];
      const intervals: NodeJS.Timeout[] = [];

      // Create many timers and intervals
      for (let i = 0; i < 100; i++) {
        const timer = setTimeout(() => {
          // Timer callback
        }, Math.random() * 1000 + 100);
        timers.push(timer);

        const interval = setInterval(() => {
          // Interval callback
        }, Math.random() * 500 + 50);
        intervals.push(interval);
      }

      // Let them run for a bit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cleanup all timers and intervals
      timers.forEach(timer => clearTimeout(timer));
      intervals.forEach(interval => clearInterval(interval));

      await forceGarbageCollection();

      const profile = memoryProfiler.stopProfiling();

      // Should not have timer-related memory leaks
      const timerLeaks = profile.memoryLeaks.filter(leak => 
        leak.type.includes('Timer') || leak.location.includes('timer')
      );
      expect(timerLeaks.length).toBe(0);
    }, 25000);
  });

  describe('Large Dataset Handling', () => {
    test('should handle large animal databases efficiently', async () => {
      memoryProfiler.startProfiling(200);

      // Create large animal database
      const animalDatabase = createLargeAnimalDatabase(10000); // 10,000 animals
      
      // Perform various database operations
      const operations = [
        () => searchAnimals(animalDatabase, 'forest'),
        () => filterAnimalsByRarity(animalDatabase, 'legendary'),
        () => sortAnimalsByLevel(animalDatabase),
        () => groupAnimalsByHabitat(animalDatabase),
        () => calculateDatabaseStats(animalDatabase)
      ];

      for (const operation of operations) {
        const startTime = performance.now();
        await operation();
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(500); // Each operation under 500ms
      }

      const profile = memoryProfiler.stopProfiling();

      expect(profile.peakUsage).toBeLessThan(300 * 1024 * 1024); // Less than 300MB for large dataset
    }, 30000);

    test('should efficiently paginate large collections', async () => {
      memoryProfiler.startProfiling(100);

      const largeCollection = createLargeAnimalCollection(50000); // 50,000 animals
      const pageSize = 50;
      const totalPages = Math.ceil(largeCollection.length / pageSize);

      // Test pagination performance
      for (let page = 0; page < Math.min(totalPages, 100); page++) {
        const startTime = performance.now();
        const pageData = paginateCollection(largeCollection, page, pageSize);
        const endTime = performance.now();

        expect(pageData.length).toBeLessThanOrEqual(pageSize);
        expect(endTime - startTime).toBeLessThan(10); // Pagination should be very fast
      }

      const profile = memoryProfiler.stopProfiling();

      // Memory usage should remain stable during pagination
      const memoryGrowth = profile.snapshots[profile.snapshots.length - 1].usedJSHeapSize - 
                          profile.snapshots[0].usedJSHeapSize;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    }, 20000);
  });
});

// Mock functions and utilities
function generateLargePuzzle(): any {
  return {
    answer: 'HIPPOPOTAMUS',
    letters: 'HIPPOPOTAMUS'.split('').sort(() => Math.random() - 0.5),
    emoji: '🦛',
    difficulty: 5,
    hints: Array.from({ length: 10 }, (_, i) => `Hint ${i}`),
    metadata: {
      category: 'large_mammals',
      habitat: 'water',
      facts: Array.from({ length: 20 }, (_, i) => `Fact ${i}`)
    }
  };
}

async function solvePuzzleWithComplexLogic(puzzle: any): Promise<any> {
  // Simulate complex puzzle solving with multiple algorithms
  const algorithms = ['backtrack', 'heuristic', 'brute_force'];
  const results = [];

  for (const algorithm of algorithms) {
    const result = await simulateAlgorithm(algorithm, puzzle);
    results.push(result);
  }

  return {
    solutions: results,
    bestSolution: results.reduce((best, current) => 
      current.score > best.score ? current : best
    ),
    processingTime: results.reduce((sum, r) => sum + r.time, 0)
  };
}

async function simulateAlgorithm(algorithm: string, puzzle: any): Promise<any> {
  const complexity = {
    backtrack: 100,
    heuristic: 50,
    brute_force: 200
  };

  const time = complexity[algorithm as keyof typeof complexity] || 100;
  await new Promise(resolve => setTimeout(resolve, time));

  return {
    algorithm,
    score: Math.random() * 100,
    time,
    memoryUsed: Math.random() * 1024 * 1024 // Random memory usage
  };
}

function createLargeAnimalCollection(size: number): any[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `Animal_${i}`,
    level: Math.floor(Math.random() * 50) + 1,
    rarity: ['common', 'uncommon', 'rare', 'legendary'][Math.floor(Math.random() * 4)],
    habitat: ['forest', 'ocean', 'desert', 'mountain'][Math.floor(Math.random() * 4)],
    stats: {
      health: Math.floor(Math.random() * 200) + 50,
      attack: Math.floor(Math.random() * 150) + 30,
      defense: Math.floor(Math.random() * 120) + 25
    },
    moves: Array.from({ length: 4 }, (_, j) => `Move_${j}`),
    metadata: {
      captureDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      experience: Math.floor(Math.random() * 10000),
      friendship: Math.floor(Math.random() * 100)
    }
  }));
}

async function performCollectionOperations(collection: any[]): Promise<void> {
  // Simulate various collection operations
  const operations = [
    () => collection.filter(animal => animal.level > 25),
    () => collection.sort((a, b) => b.level - a.level),
    () => collection.reduce((acc, animal) => acc + animal.level, 0),
    () => collection.map(animal => ({ ...animal, boosted: true })),
    () => collection.find(animal => animal.rarity === 'legendary')
  ];

  for (const operation of operations) {
    operation();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
  }
}

function createComplexBattle(): any {
  return {
    id: `battle_${Date.now()}_${Math.random()}`,
    participants: Array.from({ length: 2 }, (_, i) => ({
      id: `trainer_${i}`,
      team: createLargeAnimalCollection(6) // 6 animals per team
    })),
    environment: {
      weather: 'sunny',
      terrain: 'grass',
      effects: Array.from({ length: 5 }, (_, i) => `effect_${i}`)
    },
    rules: {
      turnLimit: 100,
      itemsAllowed: true,
      substitutionsAllowed: true
    }
  };
}

async function simulateIntenseBattle(battle: any): Promise<any> {
  const turns = Math.floor(Math.random() * 50) + 20; // 20-70 turns
  const battleLog = [];

  for (let turn = 0; turn < turns; turn++) {
    // Simulate turn processing
    const turnData = {
      turn,
      action: ['attack', 'defend', 'item', 'switch'][Math.floor(Math.random() * 4)],
      damage: Math.floor(Math.random() * 100),
      effects: Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => `effect_${i}`)
    };
    
    battleLog.push(turnData);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));
  }

  return {
    battleId: battle.id,
    winner: battle.participants[Math.floor(Math.random() * 2)].id,
    turns: battleLog.length,
    duration: battleLog.length * 25, // Approximate duration
    log: battleLog
  };
}

async function simulateFrameOperations(): Promise<void> {
  // Simulate typical frame operations
  const operations = [
    () => updateAnimations(),
    () => processInput(),
    () => updateGameState(),
    () => renderFrame()
  ];

  for (const operation of operations) {
    await operation();
  }
}

async function updateAnimations(): Promise<void> {
  // Simulate animation updates
  const animations = Array.from({ length: 10 }, () => ({
    progress: Math.random(),
    duration: Math.random() * 1000
  }));
  
  animations.forEach(anim => {
    anim.progress += 0.016; // 60fps increment
  });
  
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
}

async function processInput(): Promise<void> {
  // Simulate input processing
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1));
}

async function updateGameState(): Promise<void> {
  // Simulate game state updates
  await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
}

async function renderFrame(): Promise<void> {
  // Simulate frame rendering
  await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
}

async function testArrayOperations(): Promise<void> {
  const largeArray = Array.from({ length: 100000 }, (_, i) => i);
  
  // Test various array operations
  largeArray.push(100000);
  largeArray.pop();
  largeArray.slice(0, 1000);
  largeArray.filter(x => x % 2 === 0);
  largeArray.map(x => x * 2);
  largeArray.reduce((sum, x) => sum + x, 0);
}

async function testMapOperations(): Promise<void> {
  const largeMap = new Map();
  
  // Fill map
  for (let i = 0; i < 50000; i++) {
    largeMap.set(`key_${i}`, { value: i, data: `data_${i}` });
  }
  
  // Test operations
  largeMap.get('key_25000');
  largeMap.has('key_30000');
  largeMap.delete('key_10000');
  largeMap.set('new_key', { value: 999999 });
}

async function testSetOperations(): Promise<void> {
  const largeSet = new Set();
  
  // Fill set
  for (let i = 0; i < 50000; i++) {
    largeSet.add(`item_${i}`);
  }
  
  // Test operations
  largeSet.has('item_25000');
  largeSet.add('new_item');
  largeSet.delete('item_10000');
}

async function testObjectOperations(): Promise<void> {
  const largeObject: Record<string, any> = {};
  
  // Fill object
  for (let i = 0; i < 50000; i++) {
    largeObject[`prop_${i}`] = { value: i, nested: { data: `data_${i}` } };
  }
  
  // Test operations
  const keys = Object.keys(largeObject);
  const values = Object.values(largeObject);
  const entries = Object.entries(largeObject);
  
  delete largeObject.prop_10000;
  largeObject.new_prop = { value: 999999 };
}

function createMockElement(): any {
  const listeners = new Map();
  
  return {
    addEventListener: (event: string, listener: Function) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(listener);
    },
    removeEventListener: (event: string, listener: Function) => {
      if (listeners.has(event)) {
        listeners.get(event).delete(listener);
      }
    },
    listeners
  };
}

function createMockEventListener(): Function {
  return function eventListener(event: any) {
    // Mock event listener logic
    const data = {
      timestamp: Date.now(),
      type: event?.type || 'click',
      processed: true
    };
    return data;
  };
}

async function forceGarbageCollection(): Promise<void> {
  if (global.gc) {
    global.gc();
  }
  // Give GC time to run
  await new Promise(resolve => setTimeout(resolve, 100));
}

function createLargeAnimalDatabase(size: number): any[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `Species_${i}`,
    scientificName: `Genus_${Math.floor(i / 100)} species_${i % 100}`,
    habitat: ['forest', 'ocean', 'desert', 'mountain', 'grassland'][i % 5],
    rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][Math.floor(i / (size / 5))],
    level: Math.floor(Math.random() * 50) + 1,
    stats: {
      health: Math.floor(Math.random() * 200) + 50,
      attack: Math.floor(Math.random() * 150) + 30,
      defense: Math.floor(Math.random() * 120) + 25,
      speed: Math.floor(Math.random() * 180) + 40,
      intelligence: Math.floor(Math.random() * 160) + 20
    },
    description: `Description for species ${i}`,
    facts: Array.from({ length: 5 }, (_, j) => `Fact ${j} about species ${i}`),
    conservationStatus: ['LC', 'NT', 'VU', 'EN', 'CR'][Math.floor(Math.random() * 5)]
  }));
}

async function searchAnimals(database: any[], habitat: string): Promise<any[]> {
  return database.filter(animal => animal.habitat === habitat);
}

async function filterAnimalsByRarity(database: any[], rarity: string): Promise<any[]> {
  return database.filter(animal => animal.rarity === rarity);
}

async function sortAnimalsByLevel(database: any[]): Promise<any[]> {
  return [...database].sort((a, b) => b.level - a.level);
}

async function groupAnimalsByHabitat(database: any[]): Promise<Record<string, any[]>> {
  return database.reduce((groups, animal) => {
    if (!groups[animal.habitat]) {
      groups[animal.habitat] = [];
    }
    groups[animal.habitat].push(animal);
    return groups;
  }, {} as Record<string, any[]>);
}

async function calculateDatabaseStats(database: any[]): Promise<any> {
  return {
    totalAnimals: database.length,
    averageLevel: database.reduce((sum, animal) => sum + animal.level, 0) / database.length,
    rarityDistribution: database.reduce((dist, animal) => {
      dist[animal.rarity] = (dist[animal.rarity] || 0) + 1;
      return dist;
    }, {} as Record<string, number>),
    habitatDistribution: database.reduce((dist, animal) => {
      dist[animal.habitat] = (dist[animal.habitat] || 0) + 1;
      return dist;
    }, {} as Record<string, number>)
  };
}

function paginateCollection(collection: any[], page: number, pageSize: number): any[] {
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  return collection.slice(startIndex, endIndex);
}