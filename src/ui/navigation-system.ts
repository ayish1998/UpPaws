/**
 * Tab-based navigation system with clear sections
 * Provides adaptive navigation that works across all device types
 */

export interface NavigationTab {
  id: string;
  label: string;
  icon?: string;
  content: HTMLElement | (() => HTMLElement);
  badge?: string | number;
  disabled?: boolean;
}

export interface NavigationOptions {
  position: 'top' | 'bottom' | 'left' | 'right';
  style: 'tabs' | 'pills' | 'underline';
  showLabels: boolean;
  showIcons: boolean;
  adaptive: boolean; // Automatically adjust based on viewport
}

export class NavigationSystem {
  private container: HTMLElement;
  private tabsContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private tabs: Map<string, NavigationTab> = new Map();
  private activeTabId: string | null = null;
  private options: NavigationOptions;
  private changeListeners: Set<(tabId: string) => void> = new Set();

  constructor(container: HTMLElement, options: Partial<NavigationOptions> = {}) {
    this.container = container;
    this.options = {
      position: 'bottom',
      style: 'tabs',
      showLabels: true,
      showIcons: true,
      adaptive: true,
      ...options
    };

    this.initializeNavigation();
  }

  /**
   * Add a new tab to the navigation
   */
  addTab(tab: NavigationTab): void {
    this.tabs.set(tab.id, tab);
    this.renderTabs();
    
    // Set as active if it's the first tab
    if (this.tabs.size === 1) {
      this.setActiveTab(tab.id);
    }
  }

  /**
   * Remove a tab from the navigation
   */
  removeTab(tabId: string): void {
    if (this.tabs.has(tabId)) {
      this.tabs.delete(tabId);
      
      // If removing active tab, switch to first available tab
      if (this.activeTabId === tabId) {
        const firstTab = this.tabs.keys().next().value;
        if (firstTab) {
          this.setActiveTab(firstTab);
        } else {
          this.activeTabId = null;
        }
      }
      
      this.renderTabs();
    }
  }

  /**
   * Set the active tab
   */
  setActiveTab(tabId: string): void {
    if (!this.tabs.has(tabId)) {
      console.warn(`Tab ${tabId} not found`);
      return;
    }

    const previousTab = this.activeTabId;
    this.activeTabId = tabId;
    
    this.updateTabStates();
    this.showTabContent(tabId);
    
    // Notify listeners
    if (previousTab !== tabId) {
      this.changeListeners.forEach(callback => {
        try {
          callback(tabId);
        } catch (error) {
          console.error('Error in tab change listener:', error);
        }
      });
    }
  }

  /**
   * Get the currently active tab ID
   */
  getActiveTab(): string | null {
    return this.activeTabId;
  }

  /**
   * Update tab badge
   */
  updateTabBadge(tabId: string, badge?: string | number): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.badge = badge;
      this.renderTabs();
    }
  }

  /**
   * Enable or disable a tab
   */
  setTabDisabled(tabId: string, disabled: boolean): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.disabled = disabled;
      this.renderTabs();
    }
  }

  /**
   * Listen for tab changes
   */
  onTabChange(callback: (tabId: string) => void): () => void {
    this.changeListeners.add(callback);
    return () => this.changeListeners.delete(callback);
  }

  /**
   * Update navigation style based on viewport
   */
  updateForViewport(viewport: { isMobile: boolean; isTablet: boolean; orientation: string }): void {
    if (!this.options.adaptive) return;

    // Adjust position and style based on device
    if (viewport.isMobile) {
      this.options.position = 'bottom';
      this.options.showLabels = false; // Icons only on mobile to save space
    } else if (viewport.isTablet) {
      this.options.position = viewport.orientation === 'portrait' ? 'bottom' : 'left';
      this.options.showLabels = true;
    } else {
      this.options.position = 'left';
      this.options.showLabels = true;
    }

    this.applyNavigationStyles();
    this.renderTabs();
  }

  private initializeNavigation(): void {
    this.container.classList.add('navigation-container');
    
    // Create tabs container
    this.tabsContainer = document.createElement('div');
    this.tabsContainer.className = 'navigation-tabs';
    
    // Create content container
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'navigation-content';
    
    // Arrange containers based on position
    this.arrangeContainers();
    this.applyNavigationStyles();
  }

  private arrangeContainers(): void {
    this.container.innerHTML = '';
    
    if (this.options.position === 'top' || this.options.position === 'left') {
      this.container.appendChild(this.tabsContainer);
      this.container.appendChild(this.contentContainer);
    } else {
      this.container.appendChild(this.contentContainer);
      this.container.appendChild(this.tabsContainer);
    }
  }

  private applyNavigationStyles(): void {
    // Container styles
    this.container.style.display = 'flex';
    this.container.style.height = '100%';
    this.container.style.width = '100%';
    
    if (this.options.position === 'top' || this.options.position === 'bottom') {
      this.container.style.flexDirection = 'column';
      this.tabsContainer.style.flexShrink = '0';
      this.contentContainer.style.flex = '1';
      this.contentContainer.style.overflow = 'hidden';
    } else {
      this.container.style.flexDirection = 'row';
      this.tabsContainer.style.flexShrink = '0';
      this.contentContainer.style.flex = '1';
      this.contentContainer.style.overflow = 'hidden';
    }

    // Tabs container styles
    this.tabsContainer.style.display = 'flex';
    this.tabsContainer.style.backgroundColor = '#f8f9fa';
    this.tabsContainer.style.borderRadius = '8px';
    this.tabsContainer.style.padding = '4px';
    
    if (this.options.position === 'top' || this.options.position === 'bottom') {
      this.tabsContainer.style.flexDirection = 'row';
      this.tabsContainer.style.justifyContent = 'space-around';
      this.tabsContainer.style.borderBottom = this.options.position === 'top' ? '1px solid #e9ecef' : 'none';
      this.tabsContainer.style.borderTop = this.options.position === 'bottom' ? '1px solid #e9ecef' : 'none';
    } else {
      this.tabsContainer.style.flexDirection = 'column';
      this.tabsContainer.style.width = '200px';
      this.tabsContainer.style.borderRight = this.options.position === 'left' ? '1px solid #e9ecef' : 'none';
      this.tabsContainer.style.borderLeft = this.options.position === 'right' ? '1px solid #e9ecef' : 'none';
    }

    // Content container styles
    this.contentContainer.style.position = 'relative';
    this.contentContainer.style.backgroundColor = '#ffffff';
  }

  private renderTabs(): void {
    this.tabsContainer.innerHTML = '';
    
    this.tabs.forEach((tab, tabId) => {
      const tabElement = this.createTabElement(tab, tabId);
      this.tabsContainer.appendChild(tabElement);
    });
  }

  private createTabElement(tab: NavigationTab, tabId: string): HTMLElement {
    const tabElement = document.createElement('button');
    tabElement.className = 'navigation-tab';
    tabElement.dataset.tabId = tabId;
    
    // Apply base styles
    Object.assign(tabElement.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      color: '#6c757d',
      fontSize: '14px',
      fontWeight: '500',
      cursor: tab.disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      opacity: tab.disabled ? '0.5' : '1',
      flex: this.options.position === 'top' || this.options.position === 'bottom' ? '1' : 'none',
      minHeight: '44px' // Touch-friendly minimum height
    });

    // Create content
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.gap = '6px';
    
    // Add icon if available and enabled
    if (this.options.showIcons && tab.icon) {
      const icon = document.createElement('span');
      icon.textContent = tab.icon;
      icon.style.fontSize = '18px';
      content.appendChild(icon);
    }
    
    // Add label if enabled
    if (this.options.showLabels) {
      const label = document.createElement('span');
      label.textContent = tab.label;
      content.appendChild(label);
    }
    
    // Add badge if present
    if (tab.badge !== undefined) {
      const badge = document.createElement('span');
      badge.className = 'navigation-badge';
      badge.textContent = String(tab.badge);
      Object.assign(badge.style, {
        backgroundColor: '#dc3545',
        color: 'white',
        borderRadius: '10px',
        padding: '2px 6px',
        fontSize: '11px',
        fontWeight: '600',
        minWidth: '18px',
        textAlign: 'center'
      });
      content.appendChild(badge);
    }
    
    tabElement.appendChild(content);
    
    // Add click handler
    if (!tab.disabled) {
      tabElement.addEventListener('click', () => {
        this.setActiveTab(tabId);
      });
      
      // Add hover effects for non-touch devices
      tabElement.addEventListener('mouseenter', () => {
        if (tabId !== this.activeTabId) {
          tabElement.style.backgroundColor = '#e9ecef';
        }
      });
      
      tabElement.addEventListener('mouseleave', () => {
        if (tabId !== this.activeTabId) {
          tabElement.style.backgroundColor = 'transparent';
        }
      });
    }
    
    return tabElement;
  }

  private updateTabStates(): void {
    const tabElements = this.tabsContainer.querySelectorAll('.navigation-tab');
    
    tabElements.forEach(element => {
      const tabId = (element as HTMLElement).dataset.tabId;
      const isActive = tabId === this.activeTabId;
      
      if (isActive) {
        element.classList.add('active');
        (element as HTMLElement).style.backgroundColor = '#007bff';
        (element as HTMLElement).style.color = 'white';
      } else {
        element.classList.remove('active');
        (element as HTMLElement).style.backgroundColor = 'transparent';
        (element as HTMLElement).style.color = '#6c757d';
      }
    });
  }

  private showTabContent(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    
    // Clear current content
    this.contentContainer.innerHTML = '';
    
    // Get content element
    let contentElement: HTMLElement;
    if (typeof tab.content === 'function') {
      contentElement = tab.content();
    } else {
      contentElement = tab.content;
    }
    
    // Ensure content fits viewport
    contentElement.style.width = '100%';
    contentElement.style.height = '100%';
    contentElement.style.overflow = 'auto';
    
    this.contentContainer.appendChild(contentElement);
  }
}

/**
 * Create a responsive navigation system
 */
export function createNavigation(
  container: HTMLElement, 
  tabs: NavigationTab[], 
  options?: Partial<NavigationOptions>
): NavigationSystem {
  const navigation = new NavigationSystem(container, options);
  
  // Add all tabs
  tabs.forEach(tab => navigation.addTab(tab));
  
  return navigation;
}