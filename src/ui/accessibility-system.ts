/**
 * Accessibility System for UpPaws Animal Trainer
 * Provides screen reader support, keyboard navigation, and colorblind-friendly design
 */

export interface AccessibilityOptions {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableColorblindSupport: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'default' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
}

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export class AccessibilitySystem {
  private options: AccessibilityOptions;
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex = -1;
  private announcements: HTMLElement | null = null;
  private keyboardListeners: Map<string, (event: KeyboardEvent) => void> = new Map();

  constructor(options: Partial<AccessibilityOptions> = {}) {
    this.options = {
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      enableColorblindSupport: false,
      enableHighContrast: false,
      enableReducedMotion: false,
      fontSize: 'medium',
      colorScheme: 'default',
      ...options
    };

    this.initialize();
  }

  /**
   * Initialize accessibility features
   */
  private initialize(): void {
    this.createAriaLiveRegion();
    this.setupKeyboardNavigation();
    this.applyAccessibilitySettings();
    this.detectUserPreferences();
  }

  /**
   * Update accessibility options
   */
  updateOptions(newOptions: Partial<AccessibilityOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.applyAccessibilitySettings();
    this.savePreferences();
  }

  /**
   * Make an element accessible with proper ARIA attributes
   */
  makeAccessible(element: HTMLElement, options: {
    role?: string;
    label?: string;
    description?: string;
    focusable?: boolean;
    keyboardHandler?: (event: KeyboardEvent) => void;
  } = {}): void {
    // Set ARIA role
    if (options.role) {
      element.setAttribute('role', options.role);
    }

    // Set accessible name
    if (options.label) {
      element.setAttribute('aria-label', options.label);
    }

    // Set description
    if (options.description) {
      const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const descElement = document.createElement('div');
      descElement.id = descId;
      descElement.className = 'sr-only';
      descElement.textContent = options.description;
      document.body.appendChild(descElement);
      element.setAttribute('aria-describedby', descId);
    }

    // Make focusable if needed
    if (options.focusable !== false) {
      this.makeFocusable(element, options.keyboardHandler);
    }

    // Add accessibility classes
    element.classList.add('accessible-element');
  }

  /**
   * Make an element focusable and add to tab order
   */
  makeFocusable(element: HTMLElement, keyboardHandler?: (event: KeyboardEvent) => void): void {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }

    const focusableElement: FocusableElement = {
      element,
      tabIndex: parseInt(element.getAttribute('tabindex') || '0'),
      role: element.getAttribute('role') || undefined,
      ariaLabel: element.getAttribute('aria-label') || undefined,
      ariaDescribedBy: element.getAttribute('aria-describedby') || undefined
    };

    this.focusableElements.push(focusableElement);
    this.focusableElements.sort((a, b) => a.tabIndex - b.tabIndex);

    // Add keyboard event listener
    if (keyboardHandler) {
      element.addEventListener('keydown', keyboardHandler);
    }

    // Add focus/blur handlers for visual feedback
    element.addEventListener('focus', this.handleFocus.bind(this));
    element.addEventListener('blur', this.handleBlur.bind(this));
  }

  /**
   * Announce text to screen readers
   */
  announce(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.options.enableScreenReader || !this.announcements) return;

    this.announcements.setAttribute('aria-live', priority);
    this.announcements.textContent = text;

    // Clear after announcement to allow repeated announcements
    setTimeout(() => {
      if (this.announcements) {
        this.announcements.textContent = '';
      }
    }, 1000);
  }

  /**
   * Create accessible button with proper ARIA attributes
   */
  createAccessibleButton(text: string, onClick: () => void, options: {
    description?: string;
    disabled?: boolean;
    pressed?: boolean;
  } = {}): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'accessible-button';

    // Set ARIA attributes
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', text);

    if (options.description) {
      const descId = `btn-desc-${Date.now()}`;
      const desc = document.createElement('span');
      desc.id = descId;
      desc.className = 'sr-only';
      desc.textContent = options.description;
      button.appendChild(desc);
      button.setAttribute('aria-describedby', descId);
    }

    if (options.disabled) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }

    if (options.pressed !== undefined) {
      button.setAttribute('aria-pressed', options.pressed.toString());
    }

    // Add click handler
    button.addEventListener('click', onClick);

    // Add keyboard handler
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    });

    this.makeFocusable(button);
    return button;
  }

  /**
   * Create accessible form input with proper labeling
   */
  createAccessibleInput(type: string, label: string, options: {
    placeholder?: string;
    required?: boolean;
    description?: string;
    value?: string;
  } = {}): { container: HTMLElement; input: HTMLInputElement; label: HTMLLabelElement } {
    const container = document.createElement('div');
    container.className = 'accessible-input-group';

    const inputId = `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const labelElement = document.createElement('label');
    labelElement.htmlFor = inputId;
    labelElement.textContent = label;
    labelElement.className = 'accessible-label';

    const input = document.createElement('input');
    input.type = type;
    input.id = inputId;
    input.className = 'accessible-input';

    if (options.placeholder) {
      input.placeholder = options.placeholder;
    }

    if (options.required) {
      input.required = true;
      input.setAttribute('aria-required', 'true');
      labelElement.textContent += ' *';
    }

    if (options.value) {
      input.value = options.value;
    }

    if (options.description) {
      const descId = `${inputId}-desc`;
      const desc = document.createElement('div');
      desc.id = descId;
      desc.className = 'accessible-description';
      desc.textContent = options.description;
      input.setAttribute('aria-describedby', descId);
      container.appendChild(desc);
    }

    container.appendChild(labelElement);
    container.appendChild(input);

    this.makeFocusable(input);
    return { container, input, label: labelElement };
  }

  /**
   * Apply colorblind-friendly color scheme
   */
  applyColorScheme(scheme: AccessibilityOptions['colorScheme']): void {
    document.documentElement.classList.remove(
      'color-default', 'color-protanopia', 'color-deuteranopia', 
      'color-tritanopia', 'color-monochrome'
    );
    
    document.documentElement.classList.add(`color-${scheme}`);
    this.options.colorScheme = scheme;
  }

  /**
   * Apply font size setting
   */
  applyFontSize(size: AccessibilityOptions['fontSize']): void {
    document.documentElement.classList.remove(
      'font-small', 'font-medium', 'font-large', 'font-extra-large'
    );
    
    document.documentElement.classList.add(`font-${size}`);
    this.options.fontSize = size;
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(enabled: boolean): void {
    document.documentElement.classList.toggle('high-contrast', enabled);
    this.options.enableHighContrast = enabled;
  }

  /**
   * Toggle reduced motion
   */
  toggleReducedMotion(enabled: boolean): void {
    document.documentElement.classList.toggle('reduced-motion', enabled);
    this.options.enableReducedMotion = enabled;
  }

  /**
   * Get current accessibility options
   */
  getOptions(): AccessibilityOptions {
    return { ...this.options };
  }

  /**
   * Focus next element in tab order
   */
  focusNext(): void {
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentFocusIndex].element.focus();
  }

  /**
   * Focus previous element in tab order
   */
  focusPrevious(): void {
    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = this.currentFocusIndex <= 0 
      ? this.focusableElements.length - 1 
      : this.currentFocusIndex - 1;
    this.focusableElements[this.currentFocusIndex].element.focus();
  }

  private createAriaLiveRegion(): void {
    this.announcements = document.createElement('div');
    this.announcements.setAttribute('aria-live', 'polite');
    this.announcements.setAttribute('aria-atomic', 'true');
    this.announcements.className = 'sr-only';
    document.body.appendChild(this.announcements);
  }

  private setupKeyboardNavigation(): void {
    if (!this.options.enableKeyboardNavigation) return;

    // Global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Skip if typing in input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'Tab':
          // Let browser handle tab navigation
          break;
        case 'Escape':
          this.handleEscape(event);
          break;
        case 'h':
        case 'H':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.showKeyboardShortcuts();
          }
          break;
        case '?':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            this.showKeyboardShortcuts();
          }
          break;
      }
    });
  }

  private handleFocus(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    element.classList.add('keyboard-focus');
    
    // Announce focused element to screen reader
    const label = element.getAttribute('aria-label') || element.textContent || 'Interactive element';
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    this.announce(`${label}, ${role}`, 'polite');
  }

  private handleBlur(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    element.classList.remove('keyboard-focus');
  }

  private handleEscape(event: KeyboardEvent): void {
    // Close any open modals or panels
    const modals = document.querySelectorAll('[role="dialog"], .modal, .panel');
    modals.forEach(modal => {
      if (modal instanceof HTMLElement && modal.style.display !== 'none') {
        const closeButton = modal.querySelector('[aria-label*="close"], .close-button');
        if (closeButton instanceof HTMLElement) {
          closeButton.click();
        }
      }
    });
  }

  private showKeyboardShortcuts(): void {
    const shortcuts = [
      'Tab - Navigate between elements',
      'Enter/Space - Activate buttons and links',
      'Escape - Close modals and panels',
      'Ctrl+H or ? - Show this help',
      'Arrow keys - Navigate within components'
    ];

    this.announce(`Keyboard shortcuts: ${shortcuts.join('. ')}`, 'assertive');
  }

  private applyAccessibilitySettings(): void {
    // Apply color scheme
    this.applyColorScheme(this.options.colorScheme);
    
    // Apply font size
    this.applyFontSize(this.options.fontSize);
    
    // Apply high contrast
    this.toggleHighContrast(this.options.enableHighContrast);
    
    // Apply reduced motion
    this.toggleReducedMotion(this.options.enableReducedMotion);

    // Add accessibility classes to body
    document.body.classList.toggle('screen-reader-enabled', this.options.enableScreenReader);
    document.body.classList.toggle('keyboard-navigation-enabled', this.options.enableKeyboardNavigation);
    document.body.classList.toggle('colorblind-support-enabled', this.options.enableColorblindSupport);
  }

  private detectUserPreferences(): void {
    // Detect system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.options.enableReducedMotion = true;
    }

    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.options.enableHighContrast = true;
    }

    // Load saved preferences
    this.loadPreferences();
    
    // Apply detected/loaded preferences
    this.applyAccessibilitySettings();
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('uppaws-accessibility', JSON.stringify(this.options));
    } catch (error) {
      console.warn('Could not save accessibility preferences:', error);
    }
  }

  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('uppaws-accessibility');
      if (saved) {
        const preferences = JSON.parse(saved);
        this.options = { ...this.options, ...preferences };
      }
    } catch (error) {
      console.warn('Could not load accessibility preferences:', error);
    }
  }
}

// Global instance
export const accessibilitySystem = new AccessibilitySystem();