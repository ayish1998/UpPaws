/**
 * Viewport Manager - Ensures all content fits within viewport boundaries
 * Prevents scrolling and manages content overflow intelligently
 */

export interface ViewportConstraints {
  maxWidth?: number;
  maxHeight?: number;
  padding?: number;
  allowHorizontalScroll?: boolean;
  allowVerticalScroll?: boolean;
}

export interface ContentArea {
  element: HTMLElement;
  priority: number; // Higher priority content gets more space
  minHeight?: number;
  maxHeight?: number;
  flexible: boolean; // Can shrink/grow as needed
}

export class ViewportManager {
  private viewport: { width: number; height: number };
  private contentAreas: Map<string, ContentArea> = new Map();
  private constraints: ViewportConstraints;
  private resizeObserver: ResizeObserver | null = null;

  constructor(constraints: ViewportConstraints = {}) {
    this.constraints = {
      padding: 16,
      allowHorizontalScroll: false,
      allowVerticalScroll: false,
      ...constraints
    };
    
    this.viewport = this.getViewportSize();
    this.initializeViewportManager();
  }

  /**
   * Register a content area for viewport management
   */
  registerContentArea(id: string, area: ContentArea): void {
    this.contentAreas.set(id, area);
    this.applyViewportConstraints(area.element);
    this.redistributeSpace();
  }

  /**
   * Unregister a content area
   */
  unregisterContentArea(id: string): void {
    this.contentAreas.delete(id);
    this.redistributeSpace();
  }

  /**
   * Fit element to viewport without scrolling
   */
  fitToViewport(element: HTMLElement, options: {
    maintainAspectRatio?: boolean;
    centerContent?: boolean;
    allowShrinking?: boolean;
  } = {}): void {
    const { maintainAspectRatio = false, centerContent = true, allowShrinking = true } = options;
    
    const availableWidth = this.viewport.width - (this.constraints.padding! * 2);
    const availableHeight = this.viewport.height - (this.constraints.padding! * 2);
    
    const rect = element.getBoundingClientRect();
    let newWidth = rect.width;
    let newHeight = rect.height;
    
    // Scale down if too large
    if (allowShrinking) {
      if (newWidth > availableWidth) {
        const scale = availableWidth / newWidth;
        newWidth = availableWidth;
        if (maintainAspectRatio) {
          newHeight = newHeight * scale;
        }
      }
      
      if (newHeight > availableHeight) {
        const scale = availableHeight / newHeight;
        newHeight = availableHeight;
        if (maintainAspectRatio) {
          newWidth = newWidth * scale;
        }
      }
    }
    
    // Apply dimensions
    element.style.width = `${newWidth}px`;
    element.style.height = `${newHeight}px`;
    element.style.maxWidth = `${availableWidth}px`;
    element.style.maxHeight = `${availableHeight}px`;
    
    // Center if requested
    if (centerContent) {
      element.style.margin = '0 auto';
      element.style.display = 'block';
    }
    
    // Prevent scrolling
    if (!this.constraints.allowHorizontalScroll) {
      element.style.overflowX = 'hidden';
    }
    if (!this.constraints.allowVerticalScroll) {
      element.style.overflowY = 'hidden';
    }
  }

  /**
   * Create a scrollable container that fits within viewport
   */
  createScrollableContainer(content: HTMLElement, maxHeight?: number): HTMLElement {
    const container = document.createElement('div');
    container.className = 'viewport-scrollable';
    
    const availableHeight = maxHeight || (this.viewport.height - (this.constraints.padding! * 2));
    
    Object.assign(container.style, {
      maxHeight: `${availableHeight}px`,
      overflowY: 'auto',
      overflowX: 'hidden',
      width: '100%',
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e0 #f7fafc'
    });
    
    // Custom scrollbar styles for webkit browsers
    const style = document.createElement('style');
    style.textContent = `
      .viewport-scrollable::-webkit-scrollbar {
        width: 6px;
      }
      .viewport-scrollable::-webkit-scrollbar-track {
        background: #f7fafc;
        border-radius: 3px;
      }
      .viewport-scrollable::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 3px;
      }
      .viewport-scrollable::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
      }
    `;
    document.head.appendChild(style);
    
    container.appendChild(content);
    return container;
  }

  /**
   * Optimize layout for current viewport
   */
  optimizeLayout(): void {
    this.redistributeSpace();
    
    // Apply global viewport constraints
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.width = '100vw';
    
    // Prevent zoom on mobile
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }

  /**
   * Handle dynamic content that might overflow
   */
  handleDynamicContent(element: HTMLElement, onOverflow?: () => void): void {
    const checkOverflow = () => {
      const rect = element.getBoundingClientRect();
      const isOverflowing = rect.bottom > this.viewport.height || rect.right > this.viewport.width;
      
      if (isOverflowing) {
        this.fitToViewport(element, { allowShrinking: true });
        if (onOverflow) {
          onOverflow();
        }
      }
    };
    
    // Check immediately
    checkOverflow();
    
    // Set up observer for future changes
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(checkOverflow);
      observer.observe(element);
    }
    
    // Also check on content changes
    const mutationObserver = new MutationObserver(checkOverflow);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  /**
   * Create a responsive grid that fits viewport
   */
  createResponsiveGrid(items: HTMLElement[], options: {
    minItemWidth?: number;
    maxColumns?: number;
    gap?: number;
  } = {}): HTMLElement {
    const { minItemWidth = 200, maxColumns = 4, gap = 16 } = options;
    
    const container = document.createElement('div');
    container.className = 'viewport-grid';
    
    const availableWidth = this.viewport.width - (this.constraints.padding! * 2);
    const columnsFromWidth = Math.floor((availableWidth + gap) / (minItemWidth + gap));
    const columns = Math.min(columnsFromWidth, maxColumns, items.length);
    
    Object.assign(container.style, {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: `${gap}px`,
      width: '100%',
      maxWidth: `${availableWidth}px`,
      margin: '0 auto'
    });
    
    items.forEach(item => {
      container.appendChild(item);
    });
    
    return container;
  }

  private getViewportSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  private initializeViewportManager(): void {
    // Listen for viewport changes
    window.addEventListener('resize', this.handleViewportChange.bind(this));
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(() => {
        this.handleViewportChange();
      }, 100);
    });
    
    // Set up ResizeObserver for more precise tracking
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleViewportChange();
      });
      this.resizeObserver.observe(document.documentElement);
    }
    
    // Initial optimization
    this.optimizeLayout();
  }

  private handleViewportChange(): void {
    const newViewport = this.getViewportSize();
    const changed = newViewport.width !== this.viewport.width || newViewport.height !== this.viewport.height;
    
    if (changed) {
      this.viewport = newViewport;
      this.redistributeSpace();
    }
  }

  private redistributeSpace(): void {
    if (this.contentAreas.size === 0) return;
    
    const availableHeight = this.viewport.height - (this.constraints.padding! * 2);
    const areas = Array.from(this.contentAreas.values()).sort((a, b) => b.priority - a.priority);
    
    let remainingHeight = availableHeight;
    const flexibleAreas: ContentArea[] = [];
    
    // First pass: allocate space to fixed-size areas
    areas.forEach(area => {
      if (!area.flexible && area.minHeight) {
        const height = Math.min(area.minHeight, remainingHeight);
        area.element.style.height = `${height}px`;
        area.element.style.flexShrink = '0';
        remainingHeight -= height;
      } else if (area.flexible) {
        flexibleAreas.push(area);
      }
    });
    
    // Second pass: distribute remaining space among flexible areas
    if (flexibleAreas.length > 0 && remainingHeight > 0) {
      const spacePerArea = remainingHeight / flexibleAreas.length;
      
      flexibleAreas.forEach(area => {
        let height = spacePerArea;
        
        if (area.minHeight) {
          height = Math.max(height, area.minHeight);
        }
        if (area.maxHeight) {
          height = Math.min(height, area.maxHeight);
        }
        
        area.element.style.height = `${height}px`;
        area.element.style.flexGrow = '1';
      });
    }
  }

  private applyViewportConstraints(element: HTMLElement): void {
    const availableWidth = this.viewport.width - (this.constraints.padding! * 2);
    
    element.style.maxWidth = `${availableWidth}px`;
    element.style.boxSizing = 'border-box';
    
    if (!this.constraints.allowHorizontalScroll) {
      element.style.overflowX = 'hidden';
    }
    if (!this.constraints.allowVerticalScroll) {
      element.style.overflowY = 'auto';
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleViewportChange);
    window.removeEventListener('orientationchange', this.handleViewportChange);
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    this.contentAreas.clear();
  }
}

// Global instance
export const viewportManager = new ViewportManager();