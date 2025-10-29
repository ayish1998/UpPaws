/**
 * Performance Monitor - Tracks and optimizes game performance
 * Monitors FPS, memory usage, and device capabilities
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  deviceScore: number;
  batteryLevel?: number;
  networkSpeed: 'slow' | 'medium' | 'fast';
}

export interface PerformanceSettings {
  targetFPS: number;
  enableAnimations: boolean;
  enableParticles: boolean;
  enableShadows: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  renderScale: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private settings: PerformanceSettings;
  private frameCount = 0;
  private lastFrameTime = 0;
  private frameTimes: number[] = [];
  private monitoringInterval: number | null = null;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  constructor() {
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      deviceScore: this.calculateDeviceScore(),
      networkSpeed: 'medium'
    };

    this.settings = this.getOptimalSettings();
    this.initializeMonitoring();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current performance settings
   */
  getSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  /**
   * Update performance settings
   */
  updateSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = window.setInterval(() => {
      this.updateMetrics();
      this.optimizePerformance();
      this.notifyListeners();
    }, 1000); // Update every second

    // Start frame monitoring
    this.monitorFrames();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Listen for performance updates
   */
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get device performance tier
   */
  getDeviceTier(): 'low' | 'medium' | 'high' {
    if (this.metrics.deviceScore < 30) return 'low';
    if (this.metrics.deviceScore < 70) return 'medium';
    return 'high';
  }

  /**
   * Check if device is on battery power
   */
  async getBatteryInfo(): Promise<{ level: number; charging: boolean } | null> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level * 100,
          charging: battery.charging
        };
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
    return null;
  }

  /**
   * Measure network speed
   */
  async measureNetworkSpeed(): Promise<'slow' | 'medium' | 'fast'> {
    try {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
        if (effectiveType === '3g') return 'medium';
        return 'fast';
      }

      // Fallback: measure actual speed with a small request
      const startTime = performance.now();
      await fetch('data:text/plain;base64,SGVsbG8gV29ybGQ='); // Small data URL
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 100) return 'slow';
      if (duration > 50) return 'medium';
      return 'fast';
    } catch (error) {
      console.warn('Network speed measurement failed:', error);
      return 'medium';
    }
  }

  private calculateDeviceScore(): number {
    let score = 50; // Base score

    // CPU cores
    const cores = navigator.hardwareConcurrency || 2;
    score += Math.min(cores * 5, 20);

    // Memory
    const memory = (navigator as any).deviceMemory || 4;
    score += Math.min(memory * 2, 20);

    // Screen resolution
    const pixelRatio = window.devicePixelRatio || 1;
    const screenArea = window.screen.width * window.screen.height;
    if (screenArea > 2000000) score += 10; // High resolution
    if (pixelRatio > 2) score += 5; // Retina display

    // WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      score += 10;
      const renderer = gl.getParameter(gl.RENDERER);
      if (renderer && renderer.includes('NVIDIA')) score += 5;
      if (renderer && renderer.includes('AMD')) score += 3;
    }

    // Touch support (mobile devices typically have lower performance)
    if ('ontouchstart' in window) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private getOptimalSettings(): PerformanceSettings {
    const deviceTier = this.getDeviceTier();

    switch (deviceTier) {
      case 'low':
        return {
          targetFPS: 30,
          enableAnimations: false,
          enableParticles: false,
          enableShadows: false,
          textureQuality: 'low',
          renderScale: 0.75
        };
      case 'medium':
        return {
          targetFPS: 45,
          enableAnimations: true,
          enableParticles: false,
          enableShadows: false,
          textureQuality: 'medium',
          renderScale: 0.9
        };
      case 'high':
        return {
          targetFPS: 60,
          enableAnimations: true,
          enableParticles: true,
          enableShadows: true,
          textureQuality: 'high',
          renderScale: 1.0
        };
    }
  }

  private initializeMonitoring(): void {
    // Monitor network changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', () => {
        this.measureNetworkSpeed().then(speed => {
          this.metrics.networkSpeed = speed;
        });
      });
    }

    // Monitor battery changes
    this.getBatteryInfo().then(battery => {
      if (battery) {
        this.metrics.batteryLevel = battery.level;
      }
    });

    // Initial network speed measurement
    this.measureNetworkSpeed().then(speed => {
      this.metrics.networkSpeed = speed;
    });
  }

  private monitorFrames(): void {
    const measureFrame = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const frameTime = timestamp - this.lastFrameTime;
        this.frameTimes.push(frameTime);

        // Keep only last 60 frames
        if (this.frameTimes.length > 60) {
          this.frameTimes.shift();
        }

        // Calculate average FPS
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.metrics.fps = Math.round(1000 / avgFrameTime);
        this.metrics.frameTime = avgFrameTime;
      }

      this.lastFrameTime = timestamp;
      this.frameCount++;

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  private updateMetrics(): void {
    // Update memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }

    // Update battery level
    this.getBatteryInfo().then(battery => {
      if (battery) {
        this.metrics.batteryLevel = battery.level;
      }
    });
  }

  private optimizePerformance(): void {
    const currentFPS = this.metrics.fps;
    const targetFPS = this.settings.targetFPS;

    // If FPS is significantly below target, reduce quality
    if (currentFPS < targetFPS * 0.8) {
      this.reduceQuality();
    }
    // If FPS is consistently above target, we can increase quality
    else if (currentFPS > targetFPS * 1.2 && this.getDeviceTier() !== 'low') {
      this.increaseQuality();
    }

    // Battery optimization
    if (this.metrics.batteryLevel && this.metrics.batteryLevel < 20) {
      this.enableBatterySaver();
    }
  }

  private reduceQuality(): void {
    const newSettings = { ...this.settings };

    if (newSettings.enableParticles) {
      newSettings.enableParticles = false;
    } else if (newSettings.enableShadows) {
      newSettings.enableShadows = false;
    } else if (newSettings.textureQuality === 'high') {
      newSettings.textureQuality = 'medium';
    } else if (newSettings.textureQuality === 'medium') {
      newSettings.textureQuality = 'low';
    } else if (newSettings.renderScale > 0.5) {
      newSettings.renderScale = Math.max(0.5, newSettings.renderScale - 0.1);
    }

    this.updateSettings(newSettings);
  }

  private increaseQuality(): void {
    const newSettings = { ...this.settings };
    const deviceTier = this.getDeviceTier();

    if (deviceTier === 'high') {
      if (newSettings.renderScale < 1.0) {
        newSettings.renderScale = Math.min(1.0, newSettings.renderScale + 0.1);
      } else if (newSettings.textureQuality === 'low') {
        newSettings.textureQuality = 'medium';
      } else if (newSettings.textureQuality === 'medium') {
        newSettings.textureQuality = 'high';
      } else if (!newSettings.enableShadows) {
        newSettings.enableShadows = true;
      } else if (!newSettings.enableParticles) {
        newSettings.enableParticles = true;
      }
    }

    this.updateSettings(newSettings);
  }

  private enableBatterySaver(): void {
    this.updateSettings({
      targetFPS: 30,
      enableAnimations: false,
      enableParticles: false,
      enableShadows: false,
      textureQuality: 'low',
      renderScale: 0.75
    });
  }

  private applySettings(): void {
    // Apply settings to DOM elements
    document.body.classList.toggle('low-performance', this.getDeviceTier() === 'low');
    document.body.classList.toggle('medium-performance', this.getDeviceTier() === 'medium');
    document.body.classList.toggle('high-performance', this.getDeviceTier() === 'high');

    // Apply animation settings
    if (!this.settings.enableAnimations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }

    // Apply particle settings
    if (!this.settings.enableParticles) {
      document.body.classList.add('no-particles');
    } else {
      document.body.classList.remove('no-particles');
    }

    // Apply render scale
    if (this.settings.renderScale !== 1.0) {
      document.documentElement.style.transform = `scale(${this.settings.renderScale})`;
      document.documentElement.style.transformOrigin = 'top left';
    } else {
      document.documentElement.style.transform = '';
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Error in performance metrics listener:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();