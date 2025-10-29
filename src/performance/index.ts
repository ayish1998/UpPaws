/**
 * Performance Optimization System - Main Entry Point
 * Coordinates all performance optimization components
 */

export { PerformanceMonitor, performanceMonitor, type PerformanceMetrics, type PerformanceSettings } from './performance-monitor';
export { RenderOptimizer, renderOptimizer, type RenderJob, type RenderStats } from './render-optimizer';
export { ResourceManager, resourceManager, type ResourceUsage, type ResourceLimits } from './resource-manager';
export { NetworkOptimizer, networkOptimizer, type NetworkConfig, type NetworkStats } from './network-optimizer';

import { performanceMonitor } from './performance-monitor';
import { renderOptimizer } from './render-optimizer';
import { resourceManager } from './resource-manager';
import { networkOptimizer } from './network-optimizer';

/**
 * Initialize the complete performance optimization system
 */
export function initializePerformanceSystem(): void {
  // Start performance monitoring
  performanceMonitor.startMonitoring();
  
  // Set up adaptive performance based on device capabilities
  const deviceTier = performanceMonitor.getDeviceTier();
  const settings = performanceMonitor.getSettings();
  
  // Configure render optimizer based on device
  renderOptimizer.setTargetFPS(settings.targetFPS);
  
  // Configure resource manager limits
  resourceManager.setLimits({
    maxCPU: deviceTier === 'low' ? 60 : deviceTier === 'medium' ? 75 : 85,
    maxMemory: deviceTier === 'low' ? 50 : deviceTier === 'medium' ? 75 : 100,
    maxNetworkRequests: deviceTier === 'low' ? 3 : deviceTier === 'medium' ? 6 : 10,
    batteryThreshold: 20
  });
  
  // Configure network optimizer
  networkOptimizer.updateConfig({
    enableCompression: deviceTier === 'low',
    maxConcurrentRequests: deviceTier === 'low' ? 2 : deviceTier === 'medium' ? 4 : 6,
    prefetchEnabled: deviceTier !== 'low'
  });
  
  // Set up performance monitoring callbacks
  performanceMonitor.onMetricsUpdate((metrics) => {
    // Adjust render target based on actual performance
    if (metrics.fps < settings.targetFPS * 0.8) {
      renderOptimizer.setTargetFPS(Math.max(30, settings.targetFPS - 15));
    } else if (metrics.fps > settings.targetFPS * 1.2) {
      renderOptimizer.setTargetFPS(Math.min(60, settings.targetFPS + 15));
    }
    
    // Enable battery saver if battery is low
    if (metrics.batteryLevel && metrics.batteryLevel < 20) {
      resourceManager.enableBatterySaver();
    } else if (metrics.batteryLevel && metrics.batteryLevel > 50) {
      resourceManager.disableBatterySaver();
    }
  });
  
  // Set up resource monitoring callbacks
  resourceManager.onResourceChange((usage) => {
    // Adjust performance settings based on resource usage
    if (usage.cpu > 80) {
      performanceMonitor.updateSettings({
        enableAnimations: false,
        enableParticles: false
      });
    } else if (usage.cpu < 40) {
      const deviceTier = performanceMonitor.getDeviceTier();
      if (deviceTier !== 'low') {
        performanceMonitor.updateSettings({
          enableAnimations: true,
          enableParticles: deviceTier === 'high'
        });
      }
    }
  });
  
  console.log('Performance optimization system initialized');
}

/**
 * Create a performance-optimized animation
 */
export function createOptimizedAnimation(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
): Animation {
  return renderOptimizer.createOptimizedAnimation(element, keyframes, options);
}

/**
 * Create a performance-optimized timer
 */
export function createOptimizedTimer(
  callback: () => void,
  delay: number,
  options?: {
    priority?: 'low' | 'normal' | 'high';
    batterySaver?: boolean;
  }
): number {
  return resourceManager.createTimer(callback, delay, options);
}

/**
 * Create a performance-optimized interval
 */
export function createOptimizedInterval(
  callback: () => void,
  interval: number,
  options?: {
    priority?: 'low' | 'normal' | 'high';
    batterySaver?: boolean;
    adaptive?: boolean;
  }
): number {
  return resourceManager.createInterval(callback, interval, options);
}

/**
 * Optimized fetch with caching and compression
 */
export function optimizedFetch<T>(
  url: string,
  options?: RequestInit & {
    cacheMaxAge?: number;
    priority?: 'low' | 'normal' | 'high';
    compress?: boolean;
  }
): Promise<T> {
  return networkOptimizer.fetch<T>(url, options);
}

/**
 * Batch DOM operations for better performance
 */
export function batchDOMOperations(operations: (() => void)[]): void {
  renderOptimizer.batchDOMOperations(operations);
}

/**
 * Create a virtualized list for large datasets
 */
export function createVirtualizedList(
  container: HTMLElement,
  items: any[],
  renderItem: (item: any, index: number) => HTMLElement
): void {
  renderOptimizer.createVirtualList(container, items, renderItem);
}

/**
 * Throttle function execution based on performance
 */
export function throttleForPerformance<T extends (...args: any[]) => any>(
  func: T,
  options?: {
    maxCalls?: number;
    timeWindow?: number;
    skipOnHighCPU?: boolean;
  }
): T {
  return resourceManager.throttleExecution(func, options);
}

/**
 * Get comprehensive performance statistics
 */
export function getPerformanceStats(): {
  performance: ReturnType<typeof performanceMonitor.getMetrics>;
  render: ReturnType<typeof renderOptimizer.getStats>;
  resources: ReturnType<typeof resourceManager.getUsage>;
  network: ReturnType<typeof networkOptimizer.getStats>;
} {
  return {
    performance: performanceMonitor.getMetrics(),
    render: renderOptimizer.getStats(),
    resources: resourceManager.getUsage(),
    network: networkOptimizer.getStats()
  };
}

/**
 * Clean up all performance optimization resources
 */
export function destroyPerformanceSystem(): void {
  performanceMonitor.stopMonitoring();
  renderOptimizer.destroy();
  resourceManager.destroy();
  
  console.log('Performance optimization system destroyed');
}