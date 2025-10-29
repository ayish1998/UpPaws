/**
 * Resource Manager - Battery-efficient resource management
 * Manages CPU, memory, and network resources to optimize battery life
 */

export interface ResourceUsage {
  cpu: number; // Percentage
  memory: number; // MB
  network: number; // KB/s
  battery: number; // Percentage remaining
}

export interface ResourceLimits {
  maxCPU: number;
  maxMemory: number;
  maxNetworkRequests: number;
  batteryThreshold: number;
}

export class ResourceManager {
  private usage: ResourceUsage = {
    cpu: 0,
    memory: 0,
    network: 0,
    battery: 100
  };

  private limits: ResourceLimits = {
    maxCPU: 80,
    maxMemory: 100,
    maxNetworkRequests: 10,
    batteryThreshold: 20
  };

  private activeTimers: Set<number> = new Set();
  private activeIntervals: Set<number> = new Set();
  private networkQueue: Array<() => Promise<any>> = [];
  private isProcessingNetwork = false;
  private resourceMonitorInterval: number | null = null;
  private listeners: Set<(usage: ResourceUsage) => void> = new Set();

  constructor() {
    this.initializeResourceMonitoring();
  }

  /**
   * Get current resource usage
   */
  getUsage(): ResourceUsage {
    return { ...this.usage };
  }

  /**
   * Update resource limits
   */
  setLimits(limits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  /**
   * Create a battery-efficient timer
   */
  createTimer(callback: () => void, delay: number, options: {
    priority?: 'low' | 'normal' | 'high';
    batterySaver?: boolean;
  } = {}): number {
    const { priority = 'normal', batterySaver = true } = options;
    
    // Adjust delay based on battery level and priority
    let adjustedDelay = delay;
    
    if (batterySaver && this.usage.battery < this.limits.batteryThreshold) {
      switch (priority) {
        case 'low':
          adjustedDelay *= 2; // Double delay for low priority
          break;
        case 'normal':
          adjustedDelay *= 1.5; // 50% longer delay
          break;
        case 'high':
          // No adjustment for high priority
          break;
      }
    }

    const timerId = window.setTimeout(() => {
      this.activeTimers.delete(timerId);
      callback();
    }, adjustedDelay);

    this.activeTimers.add(timerId);
    return timerId;
  }

  /**
   * Create a battery-efficient interval
   */
  createInterval(callback: () => void, interval: number, options: {
    priority?: 'low' | 'normal' | 'high';
    batterySaver?: boolean;
    adaptive?: boolean;
  } = {}): number {
    const { priority = 'normal', batterySaver = true, adaptive = true } = options;
    
    let currentInterval = interval;
    let intervalId: number;

    const executeCallback = () => {
      // Adjust interval based on current conditions
      if (adaptive) {
        if (this.usage.cpu > this.limits.maxCPU) {
          currentInterval = Math.min(currentInterval * 1.2, interval * 3);
        } else if (this.usage.cpu < this.limits.maxCPU * 0.5) {
          currentInterval = Math.max(currentInterval * 0.9, interval);
        }
      }

      // Battery saver adjustments
      if (batterySaver && this.usage.battery < this.limits.batteryThreshold) {
        switch (priority) {
          case 'low':
            currentInterval = interval * 3;
            break;
          case 'normal':
            currentInterval = interval * 2;
            break;
          case 'high':
            currentInterval = interval * 1.2;
            break;
        }
      }

      callback();
      
      // Schedule next execution
      this.activeTimers.delete(intervalId);
      intervalId = window.setTimeout(executeCallback, currentInterval);
      this.activeTimers.add(intervalId);
    };

    intervalId = window.setTimeout(executeCallback, currentInterval);
    this.activeTimers.add(intervalId);
    this.activeIntervals.add(intervalId);

    return intervalId;
  }

  /**
   * Clear timer or interval
   */
  clearTimer(id: number): void {
    if (this.activeTimers.has(id)) {
      clearTimeout(id);
      this.activeTimers.delete(id);
      this.activeIntervals.delete(id);
    }
  }

  /**
   * Queue network request for efficient processing
   */
  queueNetworkRequest<T>(request: () => Promise<T>, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueItem = async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      // Insert based on priority
      if (priority === 'high') {
        this.networkQueue.unshift(queueItem);
      } else {
        this.networkQueue.push(queueItem);
      }

      this.processNetworkQueue();
    });
  }

  /**
   * Batch multiple network requests
   */
  batchNetworkRequests<T>(requests: Array<() => Promise<T>>, options: {
    batchSize?: number;
    delay?: number;
  } = {}): Promise<T[]> {
    const { batchSize = 3, delay = 100 } = options;
    
    return new Promise(async (resolve, reject) => {
      const results: T[] = [];
      const batches: Array<Array<() => Promise<T>>> = [];
      
      // Split requests into batches
      for (let i = 0; i < requests.length; i += batchSize) {
        batches.push(requests.slice(i, i + batchSize));
      }

      try {
        for (const batch of batches) {
          // Process batch concurrently
          const batchPromises = batch.map(request => this.queueNetworkRequest(request));
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
          
          // Delay between batches to prevent overwhelming
          if (batch !== batches[batches.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create memory-efficient cache
   */
  createCache<K, V>(maxSize: number = 100): Map<K, V> & { cleanup: () => void } {
    const cache = new Map<K, V>();
    const accessOrder = new Map<K, number>();
    let accessCounter = 0;

    const originalSet = cache.set.bind(cache);
    const originalGet = cache.get.bind(cache);

    // Override set method
    cache.set = (key: K, value: V) => {
      // Remove oldest entries if cache is full
      if (cache.size >= maxSize && !cache.has(key)) {
        const oldestKey = Array.from(accessOrder.entries())
          .sort(([, a], [, b]) => a - b)[0][0];
        cache.delete(oldestKey);
        accessOrder.delete(oldestKey);
      }

      accessOrder.set(key, ++accessCounter);
      return originalSet(key, value);
    };

    // Override get method to track access
    cache.get = (key: K) => {
      if (cache.has(key)) {
        accessOrder.set(key, ++accessCounter);
      }
      return originalGet(key);
    };

    // Add cleanup method
    (cache as any).cleanup = () => {
      cache.clear();
      accessOrder.clear();
    };

    return cache as Map<K, V> & { cleanup: () => void };
  }

  /**
   * Throttle function execution based on resource usage
   */
  throttleExecution<T extends (...args: any[]) => any>(
    func: T,
    options: {
      maxCalls?: number;
      timeWindow?: number;
      skipOnHighCPU?: boolean;
    } = {}
  ): T {
    const { maxCalls = 10, timeWindow = 1000, skipOnHighCPU = true } = options;
    
    let callCount = 0;
    let windowStart = Date.now();

    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      // Reset window if needed
      if (now - windowStart >= timeWindow) {
        callCount = 0;
        windowStart = now;
      }

      // Skip if too many calls in window
      if (callCount >= maxCalls) {
        return;
      }

      // Skip if CPU usage is too high
      if (skipOnHighCPU && this.usage.cpu > this.limits.maxCPU) {
        return;
      }

      callCount++;
      return func(...args);
    }) as T;
  }

  /**
   * Monitor resource usage changes
   */
  onResourceChange(callback: (usage: ResourceUsage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Enable battery saver mode
   */
  enableBatterySaver(): void {
    // Reduce all active intervals
    this.activeIntervals.forEach(intervalId => {
      // Note: This is a simplified approach
      // In practice, you'd need to track and modify existing intervals
    });

    // Update limits for battery saving
    this.setLimits({
      maxCPU: 50,
      maxMemory: 50,
      maxNetworkRequests: 5
    });
  }

  /**
   * Disable battery saver mode
   */
  disableBatterySaver(): void {
    // Restore normal limits
    this.setLimits({
      maxCPU: 80,
      maxMemory: 100,
      maxNetworkRequests: 10
    });
  }

  private async initializeResourceMonitoring(): Promise<void> {
    // Monitor battery level
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        this.usage.battery = battery.level * 100;
        
        battery.addEventListener('levelchange', () => {
          this.usage.battery = battery.level * 100;
          this.notifyListeners();
        });
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }

    // Start resource monitoring
    this.resourceMonitorInterval = window.setInterval(() => {
      this.updateResourceUsage();
      this.notifyListeners();
    }, 5000); // Update every 5 seconds
  }

  private updateResourceUsage(): void {
    // Update memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.usage.memory = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }

    // Estimate CPU usage based on active timers and performance
    this.usage.cpu = Math.min(100, (this.activeTimers.size * 2) + (this.networkQueue.length * 5));

    // Estimate network usage (simplified)
    this.usage.network = this.networkQueue.length * 10; // Rough estimate
  }

  private async processNetworkQueue(): Promise<void> {
    if (this.isProcessingNetwork || this.networkQueue.length === 0) {
      return;
    }

    this.isProcessingNetwork = true;

    while (this.networkQueue.length > 0) {
      // Respect network request limits
      if (this.networkQueue.length > this.limits.maxNetworkRequests) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const request = this.networkQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Network request failed:', error);
        }
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessingNetwork = false;
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.usage);
      } catch (error) {
        console.error('Error in resource usage listener:', error);
      }
    });
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    // Clear all active timers
    this.activeTimers.forEach(id => clearTimeout(id));
    this.activeTimers.clear();
    this.activeIntervals.clear();

    // Clear monitoring interval
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
      this.resourceMonitorInterval = null;
    }

    // Clear network queue
    this.networkQueue = [];
    this.listeners.clear();
  }
}

// Global instance
export const resourceManager = new ResourceManager();