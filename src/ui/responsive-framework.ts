/**
 * Responsive UI Framework for UpPaws Animal Trainer
 * Provides adaptive layouts, touch optimization, and viewport management
 */

export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
}

export interface TouchCapabilities {
  hasTouch: boolean;
  maxTouchPoints: number;
  supportsHover: boolean;
}

export class ResponsiveFramework {
  private viewport: ViewportInfo;
  private touchCapabilities: TouchCapabilities;
  private resizeObserver: ResizeObserver | null = null;
  private listeners: Set<(viewport: ViewportInfo) => void> = new Set();

  constructor() {
    this.viewport = this.calculateViewport();
    this.touchCapabilities = this.detectTouchCapabilities();
    this.initializeFramework();
  }

  /**
   * Get current viewport information
   */
  getViewport(): ViewportInfo {
    return { ...this.viewport };
  }

  /**
   * Get touch capabilities
   */
  getTouchCapabilities(): TouchCapabilities {
    return { ...this.touchCapabilities };
  }

  /**
   * Subscribe to viewport changes
   */
  onViewportChange(callback: (viewport: ViewportInfo) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Apply responsive classes to an element
   */
  applyResponsiveClasses(element: HTMLElement): void {
    element.classList.remove('mobile', 'tablet', 'desktop', 'portrait', 'landscape', 'touch', 'no-touch');
    
    if (this.viewport.isMobile) element.classList.add('mobile');
    if (this.viewport.isTablet) element.classList.add('tablet');
    if (this.viewport.isDesktop) element.classList.add('desktop');
    
    element.classList.add(this.viewport.orientation);
    
    if (this.touchCapabilities.hasTouch) {
      element.classList.add('touch');
    } else {
      element.classList.add('no-touch');
    }
  }

  /**
   * Ensure element fits within viewport
   */
  constrainToViewport(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const maxWidth = this.viewport.width - 32; // 16px margin on each side
    const maxHeight = this.viewport.height - 32;

    if (rect.width > maxWidth) {
      element.style.maxWidth = `${maxWidth}px`;
    }
    
    if (rect.height > maxHeight) {
      element.style.maxHeight = `${maxHeight}px`;
      element.style.overflowY = 'auto';
    }
  }

  /**
   * Get optimal layout configuration for current viewport
   */
  getLayoutConfig(): {
    columns: number;
    cardSize: 'small' | 'medium' | 'large';
    spacing: 'tight' | 'normal' | 'loose';
    navigationStyle: 'tabs' | 'sidebar' | 'drawer';
  } {
    if (this.viewport.isMobile) {
      return {
        columns: 1,
        cardSize: 'small',
        spacing: 'tight',
        navigationStyle: 'tabs'
      };
    }
    
    if (this.viewport.isTablet) {
      return {
        columns: this.viewport.orientation === 'portrait' ? 2 : 3,
        cardSize: 'medium',
        spacing: 'normal',
        navigationStyle: this.viewport.orientation === 'portrait' ? 'tabs' : 'sidebar'
      };
    }
    
    return {
      columns: 3,
      cardSize: 'large',
      spacing: 'loose',
      navigationStyle: 'sidebar'
    };
  }

  private calculateViewport(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      orientation: width > height ? 'landscape' : 'portrait',
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }

  private detectTouchCapabilities(): TouchCapabilities {
    return {
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      supportsHover: window.matchMedia('(hover: hover)').matches
    };
  }

  private initializeFramework(): void {
    // Listen for viewport changes
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Set up ResizeObserver for more precise tracking
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateViewport();
      });
      this.resizeObserver.observe(document.documentElement);
    }

    // Apply initial responsive classes to body
    this.applyResponsiveClasses(document.body);
  }

  private handleResize(): void {
    this.updateViewport();
  }

  private handleOrientationChange(): void {
    // Delay to allow for orientation change to complete
    setTimeout(() => {
      this.updateViewport();
    }, 100);
  }

  private updateViewport(): void {
    const newViewport = this.calculateViewport();
    const changed = JSON.stringify(newViewport) !== JSON.stringify(this.viewport);
    
    if (changed) {
      this.viewport = newViewport;
      this.applyResponsiveClasses(document.body);
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.viewport);
      } catch (error) {
        console.error('Error in viewport change listener:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    this.listeners.clear();
  }
}

// Singleton instance
export const responsiveFramework = new ResponsiveFramework();