/**
 * Touch-optimized controls for mobile users
 * Provides enhanced touch interactions, gestures, and haptic feedback
 */

export interface TouchControlOptions {
  enableHaptics?: boolean;
  touchTargetSize?: number; // Minimum touch target size in pixels
  gestureThreshold?: number; // Minimum distance for gesture recognition
  longPressDelay?: number; // Delay for long press in milliseconds
}

export interface TouchGesture {
  type: 'tap' | 'longpress' | 'swipe' | 'pinch';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  scale?: number;
}

export class TouchControls {
  private options: Required<TouchControlOptions>;
  private activeTouch: Touch | null = null;
  private touchStartTime = 0;
  private longPressTimer: number | null = null;
  private gestureListeners = new Map<HTMLElement, Set<(gesture: TouchGesture) => void>>();

  constructor(options: TouchControlOptions = {}) {
    this.options = {
      enableHaptics: true,
      touchTargetSize: 44, // iOS/Android recommended minimum
      gestureThreshold: 10,
      longPressDelay: 500,
      ...options
    };
  }

  /**
   * Enhance an element with touch-optimized interactions
   */
  enhanceElement(element: HTMLElement): void {
    // Ensure minimum touch target size
    this.ensureTouchTargetSize(element);
    
    // Add touch-friendly classes
    element.classList.add('touch-enhanced');
    
    // Add touch event listeners
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    // Prevent default touch behaviors that might interfere
    element.style.touchAction = 'manipulation';
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
  }

  /**
   * Add gesture listener to an element
   */
  addGestureListener(element: HTMLElement, callback: (gesture: TouchGesture) => void): () => void {
    if (!this.gestureListeners.has(element)) {
      this.gestureListeners.set(element, new Set());
      this.enhanceElement(element);
    }
    
    const listeners = this.gestureListeners.get(element)!;
    listeners.add(callback);
    
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.gestureListeners.delete(element);
      }
    };
  }

  /**
   * Create a touch-optimized button
   */
  createTouchButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'touch-button';
    
    // Apply touch-friendly styling
    Object.assign(button.style, {
      minHeight: `${this.options.touchTargetSize}px`,
      minWidth: `${this.options.touchTargetSize}px`,
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: '#007AFF',
      color: 'white'
    });

    // Add touch feedback
    this.addGestureListener(button, (gesture) => {
      if (gesture.type === 'tap') {
        this.provideTouchFeedback(button);
        onClick();
      }
    });

    return button;
  }

  /**
   * Create a swipeable container
   */
  createSwipeContainer(element: HTMLElement, onSwipe: (direction: string) => void): void {
    this.addGestureListener(element, (gesture) => {
      if (gesture.type === 'swipe' && gesture.direction) {
        onSwipe(gesture.direction);
      }
    });
  }

  /**
   * Provide haptic feedback if available
   */
  vibrate(pattern: number | number[] = 10): void {
    if (this.options.enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  private ensureTouchTargetSize(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const minSize = this.options.touchTargetSize;
    
    if (rect.width < minSize) {
      element.style.minWidth = `${minSize}px`;
    }
    
    if (rect.height < minSize) {
      element.style.minHeight = `${minSize}px`;
    }
    
    // Add padding if element is too small
    if (rect.width < minSize || rect.height < minSize) {
      const currentPadding = parseInt(getComputedStyle(element).padding) || 0;
      const additionalPadding = Math.max(0, (minSize - Math.min(rect.width, rect.height)) / 2);
      element.style.padding = `${currentPadding + additionalPadding}px`;
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.activeTouch = event.touches[0];
      this.touchStartTime = Date.now();
      
      // Start long press timer
      this.longPressTimer = window.setTimeout(() => {
        if (this.activeTouch) {
          this.triggerGesture(event.target as HTMLElement, {
            type: 'longpress',
            startX: this.activeTouch.clientX,
            startY: this.activeTouch.clientY
          });
          this.vibrate(50); // Long press haptic feedback
        }
      }, this.options.longPressDelay);
      
      // Add visual feedback
      (event.target as HTMLElement).classList.add('touch-active');
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.activeTouch && event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.activeTouch.clientX;
      const deltaY = touch.clientY - this.activeTouch.clientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Cancel long press if moved too much
      if (distance > this.options.gestureThreshold && this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      
      // Remove visual feedback if moved too much
      if (distance > this.options.gestureThreshold) {
        (event.target as HTMLElement).classList.remove('touch-active');
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.activeTouch) {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - this.touchStartTime;
      
      // Clear long press timer
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      
      // Remove visual feedback
      (event.target as HTMLElement).classList.remove('touch-active');
      
      // Determine gesture type
      if (event.changedTouches.length === 1) {
        const endTouch = event.changedTouches[0];
        const deltaX = endTouch.clientX - this.activeTouch.clientX;
        const deltaY = endTouch.clientY - this.activeTouch.clientY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < this.options.gestureThreshold && touchDuration < this.options.longPressDelay) {
          // Tap gesture
          this.triggerGesture(event.target as HTMLElement, {
            type: 'tap',
            startX: this.activeTouch.clientX,
            startY: this.activeTouch.clientY,
            endX: endTouch.clientX,
            endY: endTouch.clientY
          });
          this.vibrate(10); // Light tap feedback
        } else if (distance >= this.options.gestureThreshold) {
          // Swipe gesture
          const direction = this.getSwipeDirection(deltaX, deltaY);
          this.triggerGesture(event.target as HTMLElement, {
            type: 'swipe',
            startX: this.activeTouch.clientX,
            startY: this.activeTouch.clientY,
            endX: endTouch.clientX,
            endY: endTouch.clientY,
            direction,
            distance
          });
        }
      }
      
      this.activeTouch = null;
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    (event.target as HTMLElement).classList.remove('touch-active');
    this.activeTouch = null;
  }

  private getSwipeDirection(deltaX: number, deltaY: number): 'up' | 'down' | 'left' | 'right' {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  private triggerGesture(element: HTMLElement, gesture: TouchGesture): void {
    const listeners = this.gestureListeners.get(element);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(gesture);
        } catch (error) {
          console.error('Error in gesture listener:', error);
        }
      });
    }
  }

  private provideTouchFeedback(element: HTMLElement): void {
    // Visual feedback
    element.style.transform = 'scale(0.95)';
    element.style.opacity = '0.8';
    
    setTimeout(() => {
      element.style.transform = '';
      element.style.opacity = '';
    }, 150);
    
    // Haptic feedback
    this.vibrate(10);
  }
}

// Global instance
export const touchControls = new TouchControls();