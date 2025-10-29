/**
 * UpPaws UI Framework - Responsive, Touch-Optimized Interface System
 * Main entry point for all UI components and utilities
 */

export { ResponsiveFramework, responsiveFramework, type ViewportInfo, type TouchCapabilities } from './responsive-framework';
export { TouchControls, touchControls, type TouchControlOptions, type TouchGesture } from './touch-controls';
export { NavigationSystem, createNavigation, type NavigationTab, type NavigationOptions } from './navigation-system';
export { ViewportManager, viewportManager, type ViewportConstraints, type ContentArea } from './viewport-manager';
export { SplashScreen, createSplashScreen, type TrainerOption, type SplashScreenOptions } from './splash-screen';
export { OnboardingSystem, createDefaultOnboardingSteps, startDefaultOnboarding, type OnboardingStep, type OnboardingOptions } from './onboarding-system';
export { HelpSystem, helpSystem, type HelpTopic, type TooltipOptions } from './help-system';
export { SupportInterface, supportInterface, type SupportInterfaceOptions } from './support-interface';

import { responsiveFramework } from './responsive-framework';
import { touchControls } from './touch-controls';
import { viewportManager } from './viewport-manager';
import { helpSystem } from './help-system';
import { supportInterface } from './support-interface';

/**
 * Initialize the complete UI framework
 */
export function initializeUIFramework(): void {
  // Apply responsive framework to document
  responsiveFramework.applyResponsiveClasses(document.body);
  
  // Optimize viewport for no-scroll experience
  viewportManager.optimizeLayout();
  
  // Listen for viewport changes and update navigation accordingly
  responsiveFramework.onViewportChange((viewport) => {
    // Update any existing navigation systems
    const navigationContainers = document.querySelectorAll('.navigation-container');
    navigationContainers.forEach(container => {
      const navigation = (container as any).__navigationSystem;
      if (navigation && navigation.updateForViewport) {
        navigation.updateForViewport(viewport);
      }
    });
  });
  
  // Initialize contextual help
  helpSystem.enhanceWithContextualHelp();
  
  // Initialize support interface
  supportInterface.initialize();
  
  console.log('UpPaws UI Framework initialized');
}

/**
 * Create a complete responsive page layout
 */
export function createResponsivePage(options: {
  title: string;
  navigation?: { tabs: any[]; options?: any };
  content: HTMLElement;
  footer?: HTMLElement;
}): HTMLElement {
  const { title, navigation, content, footer } = options;
  
  // Create main container
  const container = document.createElement('div');
  container.className = 'responsive-page';
  
  // Apply responsive framework
  responsiveFramework.applyResponsiveClasses(container);
  
  // Create header
  const header = document.createElement('header');
  header.className = 'page-header';
  header.innerHTML = `<h1>${title}</h1>`;
  
  // Style header
  Object.assign(header.style, {
    padding: '16px',
    backgroundColor: '#FF6B35',
    color: 'white',
    textAlign: 'center',
    flexShrink: '0'
  });
  
  // Register header as content area
  viewportManager.registerContentArea('header', {
    element: header,
    priority: 10,
    minHeight: 60,
    flexible: false
  });
  
  // Create main content area
  const main = document.createElement('main');
  main.className = 'page-main';
  main.style.flex = '1';
  main.style.overflow = 'hidden';
  
  if (navigation) {
    // Create navigation system
    const navContainer = document.createElement('div');
    navContainer.className = 'navigation-wrapper';
    navContainer.style.height = '100%';
    
    const navSystem = createNavigation(navContainer, navigation.tabs, navigation.options);
    (navContainer as any).__navigationSystem = navSystem;
    
    main.appendChild(navContainer);
  } else {
    // Direct content
    viewportManager.fitToViewport(content);
    main.appendChild(content);
  }
  
  // Register main as flexible content area
  viewportManager.registerContentArea('main', {
    element: main,
    priority: 5,
    flexible: true
  });
  
  // Assemble page
  container.appendChild(header);
  container.appendChild(main);
  
  if (footer) {
    footer.className = 'page-footer';
    Object.assign(footer.style, {
      padding: '12px 16px',
      backgroundColor: '#f8f9fa',
      textAlign: 'center',
      fontSize: '14px',
      color: '#6c757d',
      flexShrink: '0'
    });
    
    viewportManager.registerContentArea('footer', {
      element: footer,
      priority: 8,
      minHeight: 40,
      flexible: false
    });
    
    container.appendChild(footer);
  }
  
  // Apply container styles
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden'
  });
  
  return container;
}

/**
 * Create touch-optimized button with responsive sizing
 */
export function createResponsiveButton(text: string, onClick: () => void, options: {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
} = {}): HTMLButtonElement {
  const { variant = 'primary', size = 'medium', icon } = options;
  
  const button = touchControls.createTouchButton(text, onClick);
  
  // Apply variant styles
  const variants = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    secondary: { backgroundColor: '#6c757d', color: 'white' },
    success: { backgroundColor: '#28a745', color: 'white' },
    danger: { backgroundColor: '#dc3545', color: 'white' }
  };
  
  Object.assign(button.style, variants[variant]);
  
  // Apply size styles
  const sizes = {
    small: { padding: '8px 12px', fontSize: '14px' },
    medium: { padding: '12px 16px', fontSize: '16px' },
    large: { padding: '16px 24px', fontSize: '18px' }
  };
  
  Object.assign(button.style, sizes[size]);
  
  // Add icon if provided
  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.style.marginRight = '8px';
    button.insertBefore(iconSpan, button.firstChild);
  }
  
  // Make responsive
  responsiveFramework.applyResponsiveClasses(button);
  
  return button;
}

/**
 * Create a responsive card component
 */
export function createResponsiveCard(options: {
  title?: string;
  content: HTMLElement | string;
  actions?: HTMLElement[];
  image?: string;
}): HTMLElement {
  const { title, content, actions, image } = options;
  
  const card = document.createElement('div');
  card.className = 'responsive-card';
  
  // Apply card styles
  Object.assign(card.style, {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  });
  
  // Add image if provided
  if (image) {
    const imageEl = document.createElement('img');
    imageEl.src = image;
    imageEl.style.width = '100%';
    imageEl.style.height = '200px';
    imageEl.style.objectFit = 'cover';
    card.appendChild(imageEl);
  }
  
  // Add content area
  const contentArea = document.createElement('div');
  contentArea.style.padding = '16px';
  contentArea.style.flex = '1';
  
  if (title) {
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.margin = '0 0 12px 0';
    titleEl.style.color = '#1a202c';
    contentArea.appendChild(titleEl);
  }
  
  if (typeof content === 'string') {
    const contentEl = document.createElement('p');
    contentEl.textContent = content;
    contentEl.style.margin = '0';
    contentEl.style.color = '#4a5568';
    contentArea.appendChild(contentEl);
  } else {
    contentArea.appendChild(content);
  }
  
  card.appendChild(contentArea);
  
  // Add actions if provided
  if (actions && actions.length > 0) {
    const actionsArea = document.createElement('div');
    actionsArea.style.padding = '12px 16px';
    actionsArea.style.borderTop = '1px solid #e2e8f0';
    actionsArea.style.display = 'flex';
    actionsArea.style.gap = '8px';
    actionsArea.style.justifyContent = 'flex-end';
    
    actions.forEach(action => {
      actionsArea.appendChild(action);
    });
    
    card.appendChild(actionsArea);
  }
  
  // Make responsive
  responsiveFramework.applyResponsiveClasses(card);
  viewportManager.fitToViewport(card, { allowShrinking: true });
  
  return card;
}

/**
 * Utility to make any element responsive and touch-friendly
 */
export function makeResponsive(element: HTMLElement, options: {
  touchOptimized?: boolean;
  fitToViewport?: boolean;
  constrainHeight?: boolean;
} = {}): void {
  const { touchOptimized = true, fitToViewport = true, constrainHeight = true } = options;
  
  // Apply responsive framework
  responsiveFramework.applyResponsiveClasses(element);
  
  // Optimize for touch if requested
  if (touchOptimized) {
    touchControls.enhanceElement(element);
  }
  
  // Fit to viewport if requested
  if (fitToViewport) {
    viewportManager.fitToViewport(element, { allowShrinking: true });
  }
  
  // Constrain height if requested
  if (constrainHeight) {
    const viewport = responsiveFramework.getViewport();
    element.style.maxHeight = `${viewport.height - 32}px`;
    element.style.overflowY = 'auto';
  }
}