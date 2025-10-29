/**
 * Render Optimizer - Efficient rendering pipeline for smooth 60fps gameplay
 * Manages frame scheduling, batching, and visual optimizations
 */

export interface RenderJob {
  id: string;
  priority: number;
  execute: () => void;
  canSkip?: boolean;
  estimatedTime?: number;
}

export interface RenderStats {
  frameTime: number;
  renderTime: number;
  jobsExecuted: number;
  jobsSkipped: number;
  batchesProcessed: number;
}

export class RenderOptimizer {
  private renderJobs: Map<string, RenderJob> = new Map();
  private frameQueue: RenderJob[] = [];
  private isRendering = false;
  private frameId: number | null = null;
  private stats: RenderStats = {
    frameTime: 0,
    renderTime: 0,
    jobsExecuted: 0,
    jobsSkipped: 0,
    batchesProcessed: 0
  };
  private targetFrameTime = 16.67; // 60fps
  private frameTimeBuffer = 2; // 2ms buffer for safety

  constructor() {
    this.startRenderLoop();
  }

  /**
   * Add a render job to the queue
   */
  addRenderJob(job: RenderJob): void {
    this.renderJobs.set(job.id, job);
    this.scheduleJob(job);
  }

  /**
   * Remove a render job
   */
  removeRenderJob(jobId: string): void {
    this.renderJobs.delete(jobId);
    this.frameQueue = this.frameQueue.filter(job => job.id !== jobId);
  }

  /**
   * Update render job priority
   */
  updateJobPriority(jobId: string, priority: number): void {
    const job = this.renderJobs.get(jobId);
    if (job) {
      job.priority = priority;
      this.rescheduleJobs();
    }
  }

  /**
   * Get current render statistics
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Set target frame rate
   */
  setTargetFPS(fps: number): void {
    this.targetFrameTime = 1000 / fps;
  }

  /**
   * Batch DOM operations for efficiency
   */
  batchDOMOperations(operations: (() => void)[]): void {
    const batchJob: RenderJob = {
      id: `batch-${Date.now()}`,
      priority: 5,
      execute: () => {
        // Use DocumentFragment for efficient DOM manipulation
        const fragment = document.createDocumentFragment();
        const tempContainer = document.createElement('div');
        
        operations.forEach(operation => {
          try {
            operation();
          } catch (error) {
            console.error('Error in batched DOM operation:', error);
          }
        });
        
        this.stats.batchesProcessed++;
      },
      estimatedTime: operations.length * 0.5 // Estimate 0.5ms per operation
    };

    this.addRenderJob(batchJob);
  }

  /**
   * Optimize element animations
   */
  optimizeAnimation(element: HTMLElement, properties: {
    transform?: string;
    opacity?: number;
    filter?: string;
  }): void {
    // Use transform and opacity for GPU acceleration
    const animationJob: RenderJob = {
      id: `anim-${element.id || Date.now()}`,
      priority: 8,
      execute: () => {
        // Promote to composite layer
        element.style.willChange = 'transform, opacity';
        
        if (properties.transform) {
          element.style.transform = properties.transform;
        }
        if (properties.opacity !== undefined) {
          element.style.opacity = properties.opacity.toString();
        }
        if (properties.filter) {
          element.style.filter = properties.filter;
        }
        
        // Clean up will-change after animation
        setTimeout(() => {
          element.style.willChange = 'auto';
        }, 100);
      },
      estimatedTime: 1
    };

    this.addRenderJob(animationJob);
  }

  /**
   * Lazy load images with intersection observer
   */
  setupLazyLoading(images: HTMLImageElement[]): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const loadJob: RenderJob = {
              id: `img-${img.src}`,
              priority: 3,
              execute: () => {
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                }
              },
              canSkip: false,
              estimatedTime: 2
            };
            
            this.addRenderJob(loadJob);
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });

      images.forEach(img => {
        if (img.dataset.src) {
          imageObserver.observe(img);
        }
      });
    }
  }

  /**
   * Optimize CSS animations
   */
  createOptimizedAnimation(element: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation {
    // Ensure we're using GPU-accelerated properties
    const optimizedKeyframes = keyframes.map(frame => {
      const optimized: Keyframe = {};
      
      Object.entries(frame).forEach(([key, value]) => {
        // Convert position changes to transforms
        if (key === 'left' || key === 'top') {
          if (!optimized.transform) optimized.transform = '';
          if (key === 'left') {
            optimized.transform += ` translateX(${value})`;
          } else {
            optimized.transform += ` translateY(${value})`;
          }
        } else {
          optimized[key] = value;
        }
      });
      
      return optimized;
    });

    // Create animation with optimized settings
    const animation = element.animate(optimizedKeyframes, {
      ...options,
      composite: 'replace'
    });

    // Promote element to composite layer during animation
    element.style.willChange = 'transform, opacity';
    
    animation.addEventListener('finish', () => {
      element.style.willChange = 'auto';
    });

    return animation;
  }

  /**
   * Debounce expensive operations
   */
  debounceRender(jobId: string, operation: () => void, delay: number = 16): void {
    // Remove existing job if it exists
    this.removeRenderJob(jobId);
    
    setTimeout(() => {
      const debouncedJob: RenderJob = {
        id: jobId,
        priority: 4,
        execute: operation,
        estimatedTime: 5
      };
      
      this.addRenderJob(debouncedJob);
    }, delay);
  }

  /**
   * Virtualize long lists for performance
   */
  createVirtualList(container: HTMLElement, items: any[], renderItem: (item: any, index: number) => HTMLElement): void {
    const itemHeight = 50; // Estimated item height
    const containerHeight = container.clientHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer items
    
    let scrollTop = 0;
    let startIndex = 0;
    
    const updateVisibleItems = () => {
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(newStartIndex + visibleCount, items.length);
      
      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        
        const virtualJob: RenderJob = {
          id: 'virtual-list-update',
          priority: 7,
          execute: () => {
            // Clear container
            container.innerHTML = '';
            
            // Create spacer for items above viewport
            if (startIndex > 0) {
              const topSpacer = document.createElement('div');
              topSpacer.style.height = `${startIndex * itemHeight}px`;
              container.appendChild(topSpacer);
            }
            
            // Render visible items
            for (let i = startIndex; i < endIndex; i++) {
              const itemElement = renderItem(items[i], i);
              container.appendChild(itemElement);
            }
            
            // Create spacer for items below viewport
            if (endIndex < items.length) {
              const bottomSpacer = document.createElement('div');
              bottomSpacer.style.height = `${(items.length - endIndex) * itemHeight}px`;
              container.appendChild(bottomSpacer);
            }
          },
          estimatedTime: visibleCount * 0.5
        };
        
        this.addRenderJob(virtualJob);
      }
    };
    
    // Set up scroll listener
    container.addEventListener('scroll', () => {
      scrollTop = container.scrollTop;
      this.debounceRender('virtual-scroll', updateVisibleItems, 8);
    });
    
    // Initial render
    updateVisibleItems();
  }

  private startRenderLoop(): void {
    const renderFrame = (timestamp: number) => {
      const frameStart = performance.now();
      
      this.executeFrameJobs(frameStart);
      
      const frameEnd = performance.now();
      this.stats.frameTime = frameEnd - frameStart;
      this.stats.renderTime = frameEnd - timestamp;
      
      this.frameId = requestAnimationFrame(renderFrame);
    };
    
    this.frameId = requestAnimationFrame(renderFrame);
  }

  private executeFrameJobs(frameStart: number): void {
    const maxFrameTime = this.targetFrameTime - this.frameTimeBuffer;
    let currentTime = frameStart;
    
    this.stats.jobsExecuted = 0;
    this.stats.jobsSkipped = 0;
    
    // Sort jobs by priority (higher priority first)
    this.frameQueue.sort((a, b) => b.priority - a.priority);
    
    while (this.frameQueue.length > 0 && (currentTime - frameStart) < maxFrameTime) {
      const job = this.frameQueue.shift()!;
      const estimatedTime = job.estimatedTime || 2;
      
      // Skip job if it would exceed frame budget and can be skipped
      if ((currentTime - frameStart + estimatedTime) > maxFrameTime && job.canSkip) {
        this.stats.jobsSkipped++;
        continue;
      }
      
      try {
        const jobStart = performance.now();
        job.execute();
        const jobEnd = performance.now();
        
        // Update estimated time based on actual execution
        if (this.renderJobs.has(job.id)) {
          const updatedJob = this.renderJobs.get(job.id)!;
          updatedJob.estimatedTime = jobEnd - jobStart;
        }
        
        this.stats.jobsExecuted++;
        currentTime = jobEnd;
      } catch (error) {
        console.error(`Error executing render job ${job.id}:`, error);
        this.stats.jobsSkipped++;
      }
    }
  }

  private scheduleJob(job: RenderJob): void {
    // Add to frame queue if not already present
    if (!this.frameQueue.find(j => j.id === job.id)) {
      this.frameQueue.push(job);
    }
  }

  private rescheduleJobs(): void {
    this.frameQueue = Array.from(this.renderJobs.values());
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    
    this.renderJobs.clear();
    this.frameQueue = [];
  }
}

// Global instance
export const renderOptimizer = new RenderOptimizer();