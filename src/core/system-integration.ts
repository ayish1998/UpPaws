/**
 * System Integration for UpPaws Animal Trainer
 * Integrates offline mode, accessibility, internationalization, and testing systems
 */

import { offlineSystem } from './offline-system.js';
import { accessibilitySystem } from '../ui/accessibility-system.js';
import { i18nSystem } from '../ui/internationalization-system.js';
import { testRunner } from '../testing/test-suite.js';
import { performanceMonitor } from '../performance/performance-monitor.js';

export interface SystemStatus {
  offline: {
    isOnline: boolean;
    cachedPuzzles: number;
    pendingSync: number;
    lastSync: Date | null;
  };
  accessibility: {
    screenReaderEnabled: boolean;
    keyboardNavigationEnabled: boolean;
    colorScheme: string;
    fontSize: string;
  };
  internationalization: {
    currentLocale: string;
    availableLocales: number;
    isRTL: boolean;
  };
  performance: {
    fps: number;
    memoryUsage: number;
    deviceTier: string;
    networkSpeed: string;
  };
  testing: {
    lastTestRun: Date | null;
    testsPassed: number;
    testsFailed: number;
    passRate: number;
  };
}

export class SystemIntegration {
  private initialized = false;
  private statusListeners: Set<(status: SystemStatus) => void> = new Set();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize all systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing UpPaws systems...');

      // Initialize performance monitoring first
      performanceMonitor.startMonitoring();

      // Initialize offline system
      await this.initializeOfflineSystem();

      // Initialize accessibility system
      await this.initializeAccessibilitySystem();

      // Initialize internationalization
      await this.initializeI18nSystem();

      // Set up system integrations
      this.setupSystemIntegrations();

      // Run initial system health check
      await this.runSystemHealthCheck();

      this.initialized = true;
      console.log('All systems initialized successfully');

    } catch (error) {
      console.error('System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus(): SystemStatus {
    const offlineStatus = offlineSystem.getSyncStatus();
    const accessibilityOptions = accessibilitySystem.getOptions();
    const performanceMetrics = performanceMonitor.getMetrics();
    const testSummary = testRunner.getTestSummary();

    return {
      offline: {
        isOnline: offlineStatus.isOnline,
        cachedPuzzles: offlineSystem.getCachedPuzzles().length,
        pendingSync: offlineStatus.pendingOperations,
        lastSync: offlineStatus.lastSync
      },
      accessibility: {
        screenReaderEnabled: accessibilityOptions.enableScreenReader,
        keyboardNavigationEnabled: accessibilityOptions.enableKeyboardNavigation,
        colorScheme: accessibilityOptions.colorScheme,
        fontSize: accessibilityOptions.fontSize
      },
      internationalization: {
        currentLocale: i18nSystem.getCurrentLocale(),
        availableLocales: i18nSystem.getAvailableLocales().length,
        isRTL: i18nSystem.isRTL()
      },
      performance: {
        fps: performanceMetrics.fps,
        memoryUsage: performanceMetrics.memoryUsage,
        deviceTier: performanceMonitor.getDeviceTier(),
        networkSpeed: performanceMetrics.networkSpeed
      },
      testing: {
        lastTestRun: null, // Would track this in real implementation
        testsPassed: testSummary.passed,
        testsFailed: testSummary.failed,
        passRate: testSummary.passRate
      }
    };
  }

  /**
   * Run comprehensive system health check
   */
  async runSystemHealthCheck(): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    systems: Record<string, { status: string; issues: string[] }>;
  }> {
    const results = {
      overall: 'healthy' as 'healthy' | 'warning' | 'critical',
      systems: {} as Record<string, { status: string; issues: string[] }>
    };

    // Check offline system
    const offlineCheck = await this.checkOfflineSystem();
    results.systems.offline = offlineCheck;

    // Check accessibility system
    const accessibilityCheck = await this.checkAccessibilitySystem();
    results.systems.accessibility = accessibilityCheck;

    // Check internationalization system
    const i18nCheck = await this.checkI18nSystem();
    results.systems.internationalization = i18nCheck;

    // Check performance system
    const performanceCheck = await this.checkPerformanceSystem();
    results.systems.performance = performanceCheck;

    // Determine overall health
    const allSystems = Object.values(results.systems);
    const criticalIssues = allSystems.filter(s => s.status === 'critical').length;
    const warningIssues = allSystems.filter(s => s.status === 'warning').length;

    if (criticalIssues > 0) {
      results.overall = 'critical';
    } else if (warningIssues > 0) {
      results.overall = 'warning';
    }

    return results;
  }

  /**
   * Run automated tests
   */
  async runAutomatedTests(): Promise<void> {
    console.log('Running automated tests...');
    
    try {
      const testResults = await testRunner.runAllTests();
      console.log(`Tests completed: ${testResults.passed} passed, ${testResults.failed} failed`);
      
      if (testResults.failed > 0) {
        console.warn('Some tests failed. Check test results for details.');
      }

      // Run performance tests
      const performanceResults = await testRunner.runPerformanceTests();
      console.log(`Performance tests completed: ${performanceResults.length} tests run`);

      // Run security tests
      const securityResults = await testRunner.runSecurityTests();
      console.log(`Security tests completed: ${securityResults.length} tests run`);

    } catch (error) {
      console.error('Automated testing failed:', error);
      throw error;
    }
  }

  /**
   * Listen for system status changes
   */
  onStatusChange(callback: (status: SystemStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Optimize system performance
   */
  async optimizePerformance(): Promise<void> {
    console.log('Optimizing system performance...');

    // Get current performance metrics
    const metrics = performanceMonitor.getMetrics();
    const deviceTier = performanceMonitor.getDeviceTier();

    // Adjust settings based on performance
    if (metrics.fps < 30 || deviceTier === 'low') {
      // Reduce quality settings
      accessibilitySystem.updateOptions({
        enableReducedMotion: true
      });

      // Cache more data offline for better performance
      await offlineSystem.preloadCriticalData();
    }

    // Optimize memory usage
    if (metrics.memoryUsage > 0.8) {
      console.log('High memory usage detected, optimizing...');
      // In real implementation, would clear caches, optimize data structures, etc.
    }

    console.log('Performance optimization completed');
  }

  /**
   * Handle system errors gracefully
   */
  handleSystemError(error: Error, system: string): void {
    console.error(`System error in ${system}:`, error);

    // Log error for debugging
    this.logSystemError(error, system);

    // Attempt recovery based on system
    switch (system) {
      case 'offline':
        this.recoverOfflineSystem();
        break;
      case 'accessibility':
        this.recoverAccessibilitySystem();
        break;
      case 'i18n':
        this.recoverI18nSystem();
        break;
      case 'performance':
        this.recoverPerformanceSystem();
        break;
    }
  }

  private async initializeOfflineSystem(): Promise<void> {
    // Set up offline system listeners
    offlineSystem.onConnectionChange((isOnline) => {
      console.log(`Connection status changed: ${isOnline ? 'online' : 'offline'}`);
      this.notifyStatusListeners();
    });

    // Preload critical data
    await offlineSystem.preloadCriticalData();
  }

  private async initializeAccessibilitySystem(): Promise<void> {
    // Apply accessibility enhancements to common elements
    document.addEventListener('DOMContentLoaded', () => {
      this.enhanceAccessibility();
    });

    // Set up accessibility preferences
    const savedPreferences = this.loadAccessibilityPreferences();
    if (savedPreferences) {
      accessibilitySystem.updateOptions(savedPreferences);
    }
  }

  private async initializeI18nSystem(): Promise<void> {
    // Detect and set user's preferred language
    const userLocale = this.detectUserLocale();
    if (userLocale) {
      try {
        await i18nSystem.setLocale(userLocale);
      } catch (error) {
        console.warn('Failed to set user locale, using default:', error);
      }
    }

    // Apply localization to the page
    this.applyLocalization();
  }

  private setupSystemIntegrations(): void {
    // Integrate accessibility with i18n
    this.integrateAccessibilityWithI18n();

    // Integrate performance monitoring with offline system
    this.integratePerformanceWithOffline();

    // Set up cross-system event handling
    this.setupCrossSystemEvents();
  }

  private integrateAccessibilityWithI18n(): void {
    // Update accessibility announcements when language changes
    const originalAnnounce = accessibilitySystem.announce.bind(accessibilitySystem);
    accessibilitySystem.announce = (text: string, priority?: 'polite' | 'assertive') => {
      const translatedText = i18nSystem.translate(text);
      originalAnnounce(translatedText, priority);
    };
  }

  private integratePerformanceWithOffline(): void {
    // Adjust offline caching based on performance
    performanceMonitor.onMetricsUpdate((metrics) => {
      if (metrics.networkSpeed === 'slow') {
        // Cache more data for offline use
        offlineSystem.preloadCriticalData();
      }
    });
  }

  private setupCrossSystemEvents(): void {
    // Handle system-wide events
    window.addEventListener('error', (event) => {
      this.handleSystemError(event.error, 'global');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleSystemError(new Error(event.reason), 'promise');
    });
  }

  private async checkOfflineSystem(): Promise<{ status: string; issues: string[] }> {
    const issues: string[] = [];
    const syncStatus = offlineSystem.getSyncStatus();

    if (!syncStatus.isOnline && syncStatus.pendingOperations > 10) {
      issues.push('High number of pending sync operations');
    }

    if (syncStatus.lastSync && Date.now() - syncStatus.lastSync.getTime() > 24 * 60 * 60 * 1000) {
      issues.push('Last sync was more than 24 hours ago');
    }

    const cachedPuzzles = offlineSystem.getCachedPuzzles();
    if (cachedPuzzles.length < 5) {
      issues.push('Low number of cached puzzles for offline play');
    }

    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'warning' : 'critical',
      issues
    };
  }

  private async checkAccessibilitySystem(): Promise<{ status: string; issues: string[] }> {
    const issues: string[] = [];
    const options = accessibilitySystem.getOptions();

    // Check if accessibility features are properly configured
    if (!options.enableScreenReader && !options.enableKeyboardNavigation) {
      issues.push('No accessibility features enabled');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues
    };
  }

  private async checkI18nSystem(): Promise<{ status: string; issues: string[] }> {
    const issues: string[] = [];
    const currentLocale = i18nSystem.getCurrentLocale();

    if (!currentLocale) {
      issues.push('No locale set');
    }

    const availableLocales = i18nSystem.getAvailableLocales();
    if (availableLocales.length < 2) {
      issues.push('Limited language support');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues
    };
  }

  private async checkPerformanceSystem(): Promise<{ status: string; issues: string[] }> {
    const issues: string[] = [];
    const metrics = performanceMonitor.getMetrics();

    if (metrics.fps < 30) {
      issues.push('Low frame rate detected');
    }

    if (metrics.memoryUsage > 0.9) {
      issues.push('High memory usage');
    }

    if (metrics.networkSpeed === 'slow') {
      issues.push('Slow network connection');
    }

    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 2 ? 'warning' : 'critical',
      issues
    };
  }

  private enhanceAccessibility(): void {
    // Add skip links
    this.addSkipLinks();

    // Enhance form elements
    this.enhanceFormAccessibility();

    // Add ARIA landmarks
    this.addAriaLandmarks();
  }

  private addSkipLinks(): void {
    const skipLink = accessibilitySystem.createAccessibleButton(
      'Skip to main content',
      () => {
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main instanceof HTMLElement) {
          main.focus();
        }
      }
    );
    
    skipLink.className = 'skip-link';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  private enhanceFormAccessibility(): void {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input instanceof HTMLElement) {
          accessibilitySystem.makeAccessible(input, {
            focusable: true
          });
        }
      });
    });
  }

  private addAriaLandmarks(): void {
    // Add main landmark
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('role', 'main');
    }

    // Add navigation landmarks
    const navs = document.querySelectorAll('nav');
    navs.forEach(nav => {
      nav.setAttribute('role', 'navigation');
    });
  }

  private applyLocalization(): void {
    // Localize common UI elements
    const elementsToLocalize = [
      { selector: '[data-i18n]', attribute: 'data-i18n' },
      { selector: '[title]', attribute: 'title' },
      { selector: '[aria-label]', attribute: 'aria-label' }
    ];

    elementsToLocalize.forEach(({ selector, attribute }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const key = element.getAttribute(attribute);
        if (key) {
          const translated = i18nSystem.translate(key);
          if (attribute === 'data-i18n') {
            element.textContent = translated;
          } else {
            element.setAttribute(attribute, translated);
          }
        }
      });
    });
  }

  private detectUserLocale(): string | null {
    // Try to detect user's preferred locale
    const urlParams = new URLSearchParams(window.location.search);
    const urlLocale = urlParams.get('lang');
    if (urlLocale) return urlLocale;

    const savedLocale = localStorage.getItem('uppaws-locale');
    if (savedLocale) return savedLocale;

    return navigator.language || 'en-US';
  }

  private loadAccessibilityPreferences(): any {
    try {
      const saved = localStorage.getItem('uppaws-accessibility');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
      return null;
    }
  }

  private notifyStatusListeners(): void {
    const status = this.getSystemStatus();
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status change listener:', error);
      }
    });
  }

  private logSystemError(error: Error, system: string): void {
    // In real implementation, would send to error tracking service
    console.error(`[${system}] ${error.name}: ${error.message}`, error.stack);
  }

  private recoverOfflineSystem(): void {
    console.log('Attempting to recover offline system...');
    // Clear corrupted cache and reinitialize
    offlineSystem.clearOfflineCache();
  }

  private recoverAccessibilitySystem(): void {
    console.log('Attempting to recover accessibility system...');
    // Reset to default accessibility settings
    accessibilitySystem.updateOptions({
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      colorScheme: 'default',
      fontSize: 'medium'
    });
  }

  private recoverI18nSystem(): void {
    console.log('Attempting to recover i18n system...');
    // Reset to default locale
    i18nSystem.setLocale('en-US');
  }

  private recoverPerformanceSystem(): void {
    console.log('Attempting to recover performance system...');
    // Reset performance monitoring
    performanceMonitor.stopMonitoring();
    performanceMonitor.startMonitoring();
  }
}

// Global system integration instance
export const systemIntegration = new SystemIntegration();