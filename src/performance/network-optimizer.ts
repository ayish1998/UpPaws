/**
 * Network Optimizer - Efficient network usage for mobile users
 * Implements caching, compression, and smart loading strategies
 */

export interface NetworkConfig {
  enableCompression: boolean;
  enableCaching: boolean;
  maxConcurrentRequests: number;
  retryAttempts: number;
  timeoutMs: number;
  prefetchEnabled: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
  maxAge: number;
}

export interface NetworkStats {
  requestCount: number;
  cacheHits: number;
  cacheMisses: number;
  bytesTransferred: number;
  averageLatency: number;
}

export class NetworkOptimizer {
  private config: NetworkConfig = {
    enableCompression: true,
    enableCaching: true,
    maxConcurrentRequests: 6,
    retryAttempts: 3,
    timeoutMs: 10000,
    prefetchEnabled: true
  };

  private cache = new Map<string, CacheEntry<any>>();
  private activeRequests = new Map<string, Promise<any>>();
  private requestQueue: Array<() => Promise<any>> = [];
  private stats: NetworkStats = {
    requestCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    bytesTransferred: 0,
    averageLatency: 0
  };
  private latencyHistory: number[] = [];

  constructor(config?: Partial<NetworkConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeNetworkOptimizer();
  }

  /**
   * Optimized fetch with caching and compression
   */
  async fetch<T>(url: string, options: RequestInit & {
    cacheMaxAge?: number;
    priority?: 'low' | 'normal' | 'high';
    compress?: boolean;
  } = {}): Promise<T> {
    const {
      cacheMaxAge = 300000, // 5 minutes default
      priority = 'normal',
      compress = this.config.enableCompression,
      ...fetchOptions
    } = options;

    const cacheKey = this.getCacheKey(url, fetchOptions);
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
      this.stats.cacheMisses++;
    }

    // Check if request is already in progress
    if (this.activeRequests.has(cacheKey)) {
      return this.activeRequests.get(cacheKey);
    }

    // Create request promise
    const requestPromise = this.executeRequest<T>(url, {
      ...fetchOptions,
      compress,
      cacheKey,
      cacheMaxAge
    });

    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  /**
   * Batch multiple requests efficiently
   */
  async batchFetch<T>(requests: Array<{
    url: string;
    options?: RequestInit;
    priority?: 'low' | 'normal' | 'high';
  }>): Promise<T[]> {
    // Group by priority
    const priorityGroups = {
      high: requests.filter(r => r.priority === 'high'),
      normal: requests.filter(r => r.priority === 'normal' || !r.priority),
      low: requests.filter(r => r.priority === 'low')
    };

    const results: T[] = [];

    // Process high priority first
    for (const group of [priorityGroups.high, priorityGroups.normal, priorityGroups.low]) {
      if (group.length === 0) continue;

      // Process in chunks to respect concurrent request limit
      const chunks = this.chunkArray(group, this.config.maxConcurrentRequests);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(req => 
          this.fetch<T>(req.url, { ...req.options, priority: req.priority })
        );
        
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
    }

    return results;
  }

  /**
   * Prefetch resources for better performance
   */
  prefetch(urls: string[], options: {
    priority?: 'low' | 'normal' | 'high';
    delay?: number;
  } = {}): void {
    if (!this.config.prefetchEnabled) return;

    const { priority = 'low', delay = 0 } = options;

    setTimeout(() => {
      urls.forEach(url => {
        // Only prefetch if not already cached
        const cacheKey = this.getCacheKey(url, {});
        if (!this.cache.has(cacheKey)) {
          this.fetch(url, { priority }).catch(() => {
            // Ignore prefetch errors
          });
        }
      });
    }, delay);
  }

  /**
   * Smart image loading with progressive enhancement
   */
  loadImage(src: string, options: {
    placeholder?: string;
    sizes?: string[];
    lazy?: boolean;
    priority?: 'low' | 'normal' | 'high';
  } = {}): Promise<HTMLImageElement> {
    const { placeholder, sizes = [], lazy = true, priority = 'normal' } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set up progressive loading
      if (placeholder) {
        img.src = placeholder;
      }

      // Choose optimal size based on device
      const optimalSrc = this.selectOptimalImageSize(src, sizes);
      
      const loadOptimalImage = () => {
        const startTime = performance.now();
        
        img.onload = () => {
          const loadTime = performance.now() - startTime;
          this.updateLatencyStats(loadTime);
          resolve(img);
        };
        
        img.onerror = () => {
          reject(new Error(`Failed to load image: ${optimalSrc}`));
        };
        
        img.src = optimalSrc;
      };

      if (lazy) {
        // Use Intersection Observer for lazy loading
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                loadOptimalImage();
                observer.unobserve(img);
              }
            });
          }, { rootMargin: '50px' });
          
          observer.observe(img);
        } else {
          // Fallback for browsers without Intersection Observer
          loadOptimalImage();
        }
      } else {
        loadOptimalImage();
      }
    });
  }

  /**
   * Compress request data
   */
  async compressData(data: any): Promise<ArrayBuffer> {
    if (!('CompressionStream' in window)) {
      // Fallback: return JSON string as ArrayBuffer
      const jsonString = JSON.stringify(data);
      return new TextEncoder().encode(jsonString).buffer;
    }

    const jsonString = JSON.stringify(data);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(jsonString));
        controller.close();
      }
    });

    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    const reader = compressedStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  }

  /**
   * Get network statistics
   */
  getStats(): NetworkStats {
    return { ...this.stats };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private async executeRequest<T>(url: string, options: RequestInit & {
    compress?: boolean;
    cacheKey: string;
    cacheMaxAge: number;
  }): Promise<T> {
    const { compress, cacheKey, cacheMaxAge, ...fetchOptions } = options;
    const startTime = performance.now();

    // Add compression headers if enabled
    if (compress) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Accept-Encoding': 'gzip, deflate, br'
      };
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    
    fetchOptions.signal = controller.signal;

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Update stats
        const endTime = performance.now();
        const latency = endTime - startTime;
        this.updateLatencyStats(latency);
        this.stats.requestCount++;

        // Estimate bytes transferred
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          this.stats.bytesTransferred += parseInt(contentLength, 10);
        }

        // Parse response
        const contentType = response.headers.get('content-type') || '';
        let data: T;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else if (contentType.includes('text/')) {
          data = await response.text() as unknown as T;
        } else {
          data = await response.arrayBuffer() as unknown as T;
        }

        // Cache the result
        if (this.config.enableCaching) {
          this.setCache(cacheKey, data, {
            etag: response.headers.get('etag') || undefined,
            maxAge: cacheMaxAge
          });
        }

        return data;

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort or certain errors
        if (error instanceof Error && error.name === 'AbortError') {
          break;
        }

        // Exponential backoff for retries
        if (attempt < this.config.retryAttempts) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error('Request failed after all retry attempts');
  }

  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body ? JSON.stringify(options.body) : '';
    
    return `${method}:${url}:${headers}:${body}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, options: {
    etag?: string;
    maxAge: number;
  }): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag: options.etag,
      maxAge: options.maxAge
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  private selectOptimalImageSize(baseSrc: string, sizes: string[]): string {
    if (sizes.length === 0) return baseSrc;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width * devicePixelRatio;

    // Find the smallest size that's larger than screen width
    const optimalSize = sizes
      .map(size => parseInt(size.replace(/\D/g, ''), 10))
      .sort((a, b) => a - b)
      .find(size => size >= screenWidth) || sizes[sizes.length - 1];

    return baseSrc.replace(/\.(jpg|jpeg|png|webp)$/i, `_${optimalSize}w.$1`);
  }

  private updateLatencyStats(latency: number): void {
    this.latencyHistory.push(latency);
    
    // Keep only last 100 measurements
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift();
    }

    // Calculate average
    this.stats.averageLatency = this.latencyHistory.reduce((sum, l) => sum + l, 0) / this.latencyHistory.length;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private initializeNetworkOptimizer(): void {
    // Monitor network conditions
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConfig = () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.updateConfig({
            maxConcurrentRequests: 2,
            enableCompression: true,
            prefetchEnabled: false
          });
        } else if (effectiveType === '3g') {
          this.updateConfig({
            maxConcurrentRequests: 4,
            enableCompression: true,
            prefetchEnabled: true
          });
        } else {
          this.updateConfig({
            maxConcurrentRequests: 6,
            enableCompression: false,
            prefetchEnabled: true
          });
        }
      };

      connection.addEventListener('change', updateConfig);
      updateConfig(); // Initial setup
    }
  }
}

// Global instance
export const networkOptimizer = new NetworkOptimizer();