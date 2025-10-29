/**
 * Contextual Help System - Tooltips and guidance
 * Provides just-in-time help and progressive disclosure
 */

export interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: 'gameplay' | 'features' | 'tips' | 'troubleshooting';
  keywords: string[];
  relatedTopics?: string[];
}

export interface TooltipOptions {
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger: 'hover' | 'click' | 'focus';
  delay: number;
  maxWidth: number;
  showArrow: boolean;
}

export class HelpSystem {
  private helpTopics: Map<string, HelpTopic> = new Map();
  private activeTooltips: Map<HTMLElement, HTMLElement> = new Map();
  private helpPanel: HTMLElement | null = null;
  private searchIndex: Map<string, string[]> = new Map();

  constructor() {
    this.initializeHelpTopics();
    this.buildSearchIndex();
  }

  /**
   * Add a tooltip to an element
   */
  addTooltip(element: HTMLElement, content: string, options: Partial<TooltipOptions> = {}): void {
    const opts: TooltipOptions = {
      position: 'auto',
      trigger: 'hover',
      delay: 500,
      maxWidth: 250,
      showArrow: true,
      ...options
    };

    // Remove existing tooltip if present
    this.removeTooltip(element);

    // Add event listeners based on trigger
    switch (opts.trigger) {
      case 'hover':
        this.addHoverTooltip(element, content, opts);
        break;
      case 'click':
        this.addClickTooltip(element, content, opts);
        break;
      case 'focus':
        this.addFocusTooltip(element, content, opts);
        break;
    }
  }

  /**
   * Remove tooltip from an element
   */
  removeTooltip(element: HTMLElement): void {
    const tooltip = this.activeTooltips.get(element);
    if (tooltip) {
      tooltip.remove();
      this.activeTooltips.delete(element);
    }

    // Remove event listeners
    element.removeEventListener('mouseenter', this.handleMouseEnter);
    element.removeEventListener('mouseleave', this.handleMouseLeave);
    element.removeEventListener('click', this.handleClick);
    element.removeEventListener('focus', this.handleFocus);
    element.removeEventListener('blur', this.handleBlur);
  }

  /**
   * Show contextual help panel
   */
  showHelpPanel(topic?: string): void {
    if (this.helpPanel) {
      this.hideHelpPanel();
    }

    this.createHelpPanel();
    
    if (topic) {
      this.showHelpTopic(topic);
    } else {
      this.showHelpOverview();
    }
  }

  /**
   * Hide help panel
   */
  hideHelpPanel(): void {
    if (this.helpPanel) {
      this.helpPanel.remove();
      this.helpPanel = null;
    }
  }

  /**
   * Search help topics
   */
  searchHelp(query: string): HelpTopic[] {
    const results: HelpTopic[] = [];
    const queryLower = query.toLowerCase();

    // Search in titles and keywords
    this.helpTopics.forEach(topic => {
      const titleMatch = topic.title.toLowerCase().includes(queryLower);
      const keywordMatch = topic.keywords.some(keyword => 
        keyword.toLowerCase().includes(queryLower)
      );
      const contentMatch = topic.content.toLowerCase().includes(queryLower);

      if (titleMatch || keywordMatch || contentMatch) {
        results.push(topic);
      }
    });

    // Sort by relevance (title matches first, then keyword matches)
    return results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(queryLower);
      const bTitle = b.title.toLowerCase().includes(queryLower);
      
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      
      return a.title.localeCompare(b.title);
    });
  }

  /**
   * Get help topic by ID
   */
  getHelpTopic(id: string): HelpTopic | undefined {
    return this.helpTopics.get(id);
  }

  /**
   * Add contextual help to common UI elements
   */
  enhanceWithContextualHelp(): void {
    // Add tooltips to common game elements
    const helpMappings = [
      { selector: '#btn-hint', content: 'Get a hint about the current puzzle (costs 2 points)' },
      { selector: '#btn-submit', content: 'Submit your answer when you think you have the correct animal name' },
      { selector: '#btn-clear', content: 'Clear all letters from your answer to start over' },
      { selector: '.letter-bank .tile', content: 'Click to add this letter to your answer' },
      { selector: '.answer-slots .slot', content: 'Click to remove this letter from your answer' },
      { selector: '#btn-leaderboard', content: 'View rankings and compete with other players' },
      { selector: '#muteToggle', content: 'Toggle sound effects on/off' },
      { selector: '.badge', content: 'Your current stats and progress' }
    ];

    helpMappings.forEach(mapping => {
      const elements = document.querySelectorAll(mapping.selector);
      elements.forEach(element => {
        this.addTooltip(element as HTMLElement, mapping.content, {
          trigger: 'hover',
          delay: 300
        });
      });
    });
  }

  private initializeHelpTopics(): void {
    const topics: HelpTopic[] = [
      {
        id: 'getting-started',
        title: 'Getting Started',
        content: 'Welcome to UpPaws! Your goal is to discover and collect animals by solving word puzzles. Each day brings a new animal to discover.',
        category: 'gameplay',
        keywords: ['start', 'begin', 'new', 'first time', 'tutorial']
      },
      {
        id: 'daily-puzzle',
        title: 'Daily Puzzles',
        content: 'Every day at midnight UTC, a new animal puzzle becomes available. You can only earn points from the daily puzzle once per day, but you can still play for fun!',
        category: 'gameplay',
        keywords: ['daily', 'puzzle', 'new', 'midnight', 'once']
      },
      {
        id: 'scoring-system',
        title: 'How Scoring Works',
        content: 'You earn 5 base points for solving the daily puzzle, plus time bonuses up to 5 extra points for quick solutions. Using hints costs 2 points.',
        category: 'gameplay',
        keywords: ['points', 'score', 'time', 'bonus', 'hint', 'penalty']
      },
      {
        id: 'arcade-mode',
        title: 'Arcade Mode',
        content: 'Play unlimited puzzles with increasing difficulty! You have 3 lives, and each correct answer increases your combo multiplier. Perfect for practice!',
        category: 'features',
        keywords: ['arcade', 'unlimited', 'practice', 'lives', 'combo', 'difficulty']
      },
      {
        id: 'streaks',
        title: 'Daily Streaks',
        content: 'Play consecutive days to build your streak! Longer streaks show your dedication and unlock special recognition.',
        category: 'features',
        keywords: ['streak', 'consecutive', 'daily', 'dedication']
      },
      {
        id: 'leaderboards',
        title: 'Leaderboards',
        content: 'Compete with other players across three categories: Daily scores, Arcade high scores, and Longest streaks. Check back regularly to see your ranking!',
        category: 'features',
        keywords: ['leaderboard', 'ranking', 'compete', 'daily', 'arcade', 'streak']
      },
      {
        id: 'hints-tips',
        title: 'Puzzle Solving Tips',
        content: 'Look at the emoji for clues about the animal. Think about common animals first, then consider more exotic ones. The number of letters is shown by the answer slots.',
        category: 'tips',
        keywords: ['tips', 'hints', 'emoji', 'clues', 'solve', 'strategy']
      },
      {
        id: 'mobile-controls',
        title: 'Mobile Controls',
        content: 'On mobile devices, tap letters to select them and tap answer slots to remove letters. All buttons are optimized for touch interaction.',
        category: 'tips',
        keywords: ['mobile', 'touch', 'tap', 'controls', 'phone', 'tablet']
      },
      {
        id: 'sound-effects',
        title: 'Sound Effects',
        content: 'Toggle sound effects using the speaker button in the top right. Sounds include feedback for correct/incorrect answers and UI interactions.',
        category: 'features',
        keywords: ['sound', 'audio', 'mute', 'speaker', 'effects']
      },
      {
        id: 'troubleshooting',
        title: 'Common Issues',
        content: 'If the game isn\'t loading properly, try refreshing the page. For persistent issues, check your internet connection and browser compatibility.',
        category: 'troubleshooting',
        keywords: ['problem', 'issue', 'loading', 'refresh', 'browser', 'internet']
      }
    ];

    topics.forEach(topic => {
      this.helpTopics.set(topic.id, topic);
    });
  }

  private buildSearchIndex(): void {
    this.helpTopics.forEach((topic, id) => {
      const words = [
        ...topic.title.toLowerCase().split(' '),
        ...topic.content.toLowerCase().split(' '),
        ...topic.keywords
      ];

      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 2) {
          if (!this.searchIndex.has(cleanWord)) {
            this.searchIndex.set(cleanWord, []);
          }
          this.searchIndex.get(cleanWord)!.push(id);
        }
      });
    });
  }

  private addHoverTooltip(element: HTMLElement, content: string, options: TooltipOptions): void {
    let timeoutId: number | null = null;

    const showTooltip = () => {
      timeoutId = window.setTimeout(() => {
        this.showTooltip(element, content, options);
      }, options.delay);
    };

    const hideTooltip = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      this.hideTooltip(element);
    };

    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
  }

  private addClickTooltip(element: HTMLElement, content: string, options: TooltipOptions): void {
    const toggleTooltip = (event: Event) => {
      event.stopPropagation();
      
      if (this.activeTooltips.has(element)) {
        this.hideTooltip(element);
      } else {
        this.showTooltip(element, content, options);
      }
    };

    element.addEventListener('click', toggleTooltip);

    // Hide on outside click
    document.addEventListener('click', () => {
      this.hideTooltip(element);
    });
  }

  private addFocusTooltip(element: HTMLElement, content: string, options: TooltipOptions): void {
    const showTooltip = () => {
      this.showTooltip(element, content, options);
    };

    const hideTooltip = () => {
      this.hideTooltip(element);
    };

    element.addEventListener('focus', showTooltip);
    element.addEventListener('blur', hideTooltip);
  }

  private showTooltip(element: HTMLElement, content: string, options: TooltipOptions): void {
    // Don't show if already visible
    if (this.activeTooltips.has(element)) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'help-tooltip';
    tooltip.textContent = content;

    Object.assign(tooltip.style, {
      position: 'absolute',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      lineHeight: '1.4',
      maxWidth: `${options.maxWidth}px`,
      zIndex: '10000',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.2s ease'
    });

    // Add arrow if enabled
    if (options.showArrow) {
      const arrow = document.createElement('div');
      arrow.className = 'help-tooltip-arrow';
      Object.assign(arrow.style, {
        position: 'absolute',
        width: '0',
        height: '0',
        borderStyle: 'solid'
      });
      tooltip.appendChild(arrow);
    }

    document.body.appendChild(tooltip);
    this.activeTooltips.set(element, tooltip);

    // Position tooltip
    this.positionTooltip(element, tooltip, options);

    // Fade in
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
    });
  }

  private hideTooltip(element: HTMLElement): void {
    const tooltip = this.activeTooltips.get(element);
    if (tooltip) {
      tooltip.style.opacity = '0';
      setTimeout(() => {
        tooltip.remove();
        this.activeTooltips.delete(element);
      }, 200);
    }
  }

  private positionTooltip(element: HTMLElement, tooltip: HTMLElement, options: TooltipOptions): void {
    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let position = options.position;

    // Auto-position if needed
    if (position === 'auto') {
      const spaceTop = elementRect.top;
      const spaceBottom = viewport.height - elementRect.bottom;
      const spaceLeft = elementRect.left;
      const spaceRight = viewport.width - elementRect.right;

      const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
      
      if (maxSpace === spaceTop) position = 'top';
      else if (maxSpace === spaceBottom) position = 'bottom';
      else if (maxSpace === spaceLeft) position = 'left';
      else position = 'right';
    }

    // Calculate position
    let left = 0;
    let top = 0;

    switch (position) {
      case 'top':
        left = elementRect.left + elementRect.width / 2 - tooltipRect.width / 2;
        top = elementRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        left = elementRect.left + elementRect.width / 2 - tooltipRect.width / 2;
        top = elementRect.bottom + 8;
        break;
      case 'left':
        left = elementRect.left - tooltipRect.width - 8;
        top = elementRect.top + elementRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        left = elementRect.right + 8;
        top = elementRect.top + elementRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Constrain to viewport
    left = Math.max(8, Math.min(left, viewport.width - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, viewport.height - tooltipRect.height - 8));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    // Position arrow
    if (options.showArrow) {
      this.positionArrow(tooltip, elementRect, position);
    }
  }

  private positionArrow(tooltip: HTMLElement, elementRect: DOMRect, position: string): void {
    const arrow = tooltip.querySelector('.help-tooltip-arrow') as HTMLElement;
    if (!arrow) return;

    const arrowSize = 6;

    switch (position) {
      case 'top':
        arrow.style.top = '100%';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.borderWidth = `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`;
        arrow.style.borderColor = '#1a1a1a transparent transparent transparent';
        break;
      case 'bottom':
        arrow.style.bottom = '100%';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.borderWidth = `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`;
        arrow.style.borderColor = 'transparent transparent #1a1a1a transparent';
        break;
      case 'left':
        arrow.style.left = '100%';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        arrow.style.borderWidth = `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`;
        arrow.style.borderColor = 'transparent transparent transparent #1a1a1a';
        break;
      case 'right':
        arrow.style.right = '100%';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        arrow.style.borderWidth = `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`;
        arrow.style.borderColor = 'transparent #1a1a1a transparent transparent';
        break;
    }
  }

  private createHelpPanel(): void {
    this.helpPanel = document.createElement('div');
    this.helpPanel.className = 'help-panel';
    
    Object.assign(this.helpPanel.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(500px, 90vw)',
      maxHeight: '80vh',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: '10001',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    });

    // Create header
    const header = document.createElement('div');
    header.className = 'help-panel-header';
    Object.assign(header.style, {
      padding: '16px 20px',
      borderBottom: '1px solid #e5e5e5',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8f9fa'
    });

    const title = document.createElement('h2');
    title.textContent = 'Help & Tips';
    title.style.margin = '0';
    title.style.fontSize = '18px';
    title.style.fontWeight = '600';

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    Object.assign(closeButton.style, {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px'
    });

    closeButton.addEventListener('click', () => {
      this.hideHelpPanel();
    });

    header.appendChild(title);
    header.appendChild(closeButton);

    // Create content area
    const content = document.createElement('div');
    content.className = 'help-panel-content';
    Object.assign(content.style, {
      flex: '1',
      overflow: 'auto',
      padding: '20px'
    });

    this.helpPanel.appendChild(header);
    this.helpPanel.appendChild(content);
    document.body.appendChild(this.helpPanel);
  }

  private showHelpOverview(): void {
    if (!this.helpPanel) return;

    const content = this.helpPanel.querySelector('.help-panel-content') as HTMLElement;
    content.innerHTML = '';

    // Create search box
    const searchContainer = document.createElement('div');
    searchContainer.style.marginBottom = '20px';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search help topics...';
    Object.assign(searchInput.style, {
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px'
    });

    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (query.length > 2) {
        this.showSearchResults(query);
      } else {
        this.showHelpOverview();
      }
    });

    searchContainer.appendChild(searchInput);
    content.appendChild(searchContainer);

    // Group topics by category
    const categories = new Map<string, HelpTopic[]>();
    this.helpTopics.forEach(topic => {
      if (!categories.has(topic.category)) {
        categories.set(topic.category, []);
      }
      categories.get(topic.category)!.push(topic);
    });

    // Display categories
    categories.forEach((topics, category) => {
      const categorySection = document.createElement('div');
      categorySection.style.marginBottom = '24px';

      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categoryTitle.style.marginBottom = '12px';
      categoryTitle.style.fontSize = '16px';
      categoryTitle.style.fontWeight = '600';
      categoryTitle.style.color = '#FF6B35';

      categorySection.appendChild(categoryTitle);

      topics.forEach(topic => {
        const topicItem = this.createTopicItem(topic);
        categorySection.appendChild(topicItem);
      });

      content.appendChild(categorySection);
    });
  }

  private showSearchResults(query: string): void {
    if (!this.helpPanel) return;

    const content = this.helpPanel.querySelector('.help-panel-content') as HTMLElement;
    const searchContainer = content.querySelector('div'); // Search container
    
    // Clear everything except search
    while (content.children.length > 1) {
      content.removeChild(content.lastChild!);
    }

    const results = this.searchHelp(query);

    if (results.length === 0) {
      const noResults = document.createElement('p');
      noResults.textContent = 'No help topics found for your search.';
      noResults.style.color = '#666';
      noResults.style.textAlign = 'center';
      noResults.style.marginTop = '40px';
      content.appendChild(noResults);
      return;
    }

    const resultsTitle = document.createElement('h3');
    resultsTitle.textContent = `Search Results (${results.length})`;
    resultsTitle.style.marginBottom = '16px';
    resultsTitle.style.fontSize = '16px';
    resultsTitle.style.fontWeight = '600';
    content.appendChild(resultsTitle);

    results.forEach(topic => {
      const topicItem = this.createTopicItem(topic);
      content.appendChild(topicItem);
    });
  }

  private createTopicItem(topic: HelpTopic): HTMLElement {
    const item = document.createElement('div');
    item.className = 'help-topic-item';
    Object.assign(item.style, {
      padding: '12px',
      border: '1px solid #e5e5e5',
      borderRadius: '6px',
      marginBottom: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    });

    const title = document.createElement('div');
    title.textContent = topic.title;
    title.style.fontWeight = '500';
    title.style.marginBottom = '4px';

    const preview = document.createElement('div');
    preview.textContent = topic.content.substring(0, 100) + '...';
    preview.style.fontSize = '13px';
    preview.style.color = '#666';

    item.appendChild(title);
    item.appendChild(preview);

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f8f9fa';
      item.style.borderColor = '#FF6B35';
    });

    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = '';
      item.style.borderColor = '#e5e5e5';
    });

    item.addEventListener('click', () => {
      this.showHelpTopic(topic.id);
    });

    return item;
  }

  private showHelpTopic(topicId: string): void {
    const topic = this.helpTopics.get(topicId);
    if (!topic || !this.helpPanel) return;

    const content = this.helpPanel.querySelector('.help-panel-content') as HTMLElement;
    content.innerHTML = '';

    // Back button
    const backButton = document.createElement('button');
    backButton.textContent = '← Back to Help';
    Object.assign(backButton.style, {
      background: 'none',
      border: 'none',
      color: '#FF6B35',
      fontSize: '14px',
      cursor: 'pointer',
      marginBottom: '20px',
      padding: '4px 0'
    });

    backButton.addEventListener('click', () => {
      this.showHelpOverview();
    });

    // Topic content
    const title = document.createElement('h2');
    title.textContent = topic.title;
    title.style.marginBottom = '16px';
    title.style.fontSize = '20px';
    title.style.fontWeight = '600';

    const topicContent = document.createElement('div');
    topicContent.textContent = topic.content;
    topicContent.style.lineHeight = '1.6';
    topicContent.style.marginBottom = '20px';

    content.appendChild(backButton);
    content.appendChild(title);
    content.appendChild(topicContent);

    // Related topics
    if (topic.relatedTopics && topic.relatedTopics.length > 0) {
      const relatedTitle = document.createElement('h3');
      relatedTitle.textContent = 'Related Topics';
      relatedTitle.style.marginBottom = '12px';
      relatedTitle.style.fontSize = '16px';
      relatedTitle.style.fontWeight = '600';

      content.appendChild(relatedTitle);

      topic.relatedTopics.forEach(relatedId => {
        const relatedTopic = this.helpTopics.get(relatedId);
        if (relatedTopic) {
          const relatedItem = document.createElement('div');
          relatedItem.textContent = relatedTopic.title;
          Object.assign(relatedItem.style, {
            color: '#FF6B35',
            cursor: 'pointer',
            padding: '4px 0',
            textDecoration: 'underline'
          });

          relatedItem.addEventListener('click', () => {
            this.showHelpTopic(relatedId);
          });

          content.appendChild(relatedItem);
        }
      });
    }
  }

  // Event handlers (need to be bound to preserve 'this' context)
  private handleMouseEnter = () => {};
  private handleMouseLeave = () => {};
  private handleClick = () => {};
  private handleFocus = () => {};
  private handleBlur = () => {};
}

// Global instance
export const helpSystem = new HelpSystem();