/**
 * Onboarding System - Interactive tutorial teaching core mechanics
 * Provides progressive disclosure and contextual help
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'input' | 'wait';
  duration?: number; // For 'wait' action
  skippable?: boolean;
  validation?: () => boolean; // Check if step is completed
}

export interface OnboardingOptions {
  showProgress: boolean;
  allowSkip: boolean;
  highlightColor: string;
  overlayOpacity: number;
  autoAdvance: boolean;
}

export class OnboardingSystem {
  private steps: OnboardingStep[] = [];
  private currentStepIndex = 0;
  private isActive = false;
  private overlay: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private options: OnboardingOptions;
  private onComplete: (() => void) | null = null;
  private onSkip: (() => void) | null = null;

  constructor(options: Partial<OnboardingOptions> = {}) {
    this.options = {
      showProgress: true,
      allowSkip: true,
      highlightColor: '#FF6B35',
      overlayOpacity: 0.8,
      autoAdvance: false,
      ...options
    };
  }

  /**
   * Add onboarding steps
   */
  addSteps(steps: OnboardingStep[]): void {
    this.steps.push(...steps);
  }

  /**
   * Start the onboarding process
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isActive) {
        reject(new Error('Onboarding is already active'));
        return;
      }

      if (this.steps.length === 0) {
        reject(new Error('No onboarding steps defined'));
        return;
      }

      this.isActive = true;
      this.currentStepIndex = 0;
      this.onComplete = resolve;

      this.createOverlay();
      this.showCurrentStep();
    });
  }

  /**
   * Skip the onboarding
   */
  skip(): void {
    if (!this.isActive) return;

    this.cleanup();
    if (this.onSkip) {
      this.onSkip();
    }
  }

  /**
   * Go to next step
   */
  nextStep(): void {
    if (!this.isActive) return;

    const currentStep = this.steps[this.currentStepIndex];
    
    // Validate step completion if validation function exists
    if (currentStep.validation && !currentStep.validation()) {
      this.showValidationError();
      return;
    }

    this.currentStepIndex++;
    
    if (this.currentStepIndex >= this.steps.length) {
      this.complete();
    } else {
      this.showCurrentStep();
    }
  }

  /**
   * Go to previous step
   */
  previousStep(): void {
    if (!this.isActive || this.currentStepIndex === 0) return;

    this.currentStepIndex--;
    this.showCurrentStep();
  }

  /**
   * Jump to specific step
   */
  goToStep(stepId: string): void {
    const stepIndex = this.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    this.currentStepIndex = stepIndex;
    this.showCurrentStep();
  }

  /**
   * Set completion callback
   */
  onCompleted(callback: () => void): void {
    this.onComplete = callback;
  }

  /**
   * Set skip callback
   */
  onSkipped(callback: () => void): void {
    this.onSkip = callback;
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'onboarding-overlay';
    
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: `rgba(0, 0, 0, ${this.options.overlayOpacity})`,
      zIndex: '10000',
      pointerEvents: 'auto'
    });

    // Create progress bar if enabled
    if (this.options.showProgress) {
      this.createProgressBar();
    }

    // Create skip button if allowed
    if (this.options.allowSkip) {
      this.createSkipButton();
    }

    document.body.appendChild(this.overlay);
  }

  private createProgressBar(): void {
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'onboarding-progress';
    
    Object.assign(this.progressBar.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '300px',
      height: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '2px',
      zIndex: '10001'
    });

    const progressFill = document.createElement('div');
    progressFill.className = 'onboarding-progress-fill';
    Object.assign(progressFill.style, {
      height: '100%',
      backgroundColor: this.options.highlightColor,
      borderRadius: '2px',
      transition: 'width 0.3s ease',
      width: '0%'
    });

    this.progressBar.appendChild(progressFill);
    this.overlay!.appendChild(this.progressBar);
  }

  private createSkipButton(): void {
    const skipButton = document.createElement('button');
    skipButton.textContent = 'Skip Tutorial';
    skipButton.className = 'onboarding-skip';
    
    Object.assign(skipButton.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '20px',
      padding: '8px 16px',
      fontSize: '14px',
      cursor: 'pointer',
      zIndex: '10001',
      transition: 'all 0.2s ease'
    });

    skipButton.addEventListener('mouseenter', () => {
      skipButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    });

    skipButton.addEventListener('mouseleave', () => {
      skipButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });

    skipButton.addEventListener('click', () => {
      this.skip();
    });

    this.overlay!.appendChild(skipButton);
  }

  private showCurrentStep(): void {
    const step = this.steps[this.currentStepIndex];
    
    // Update progress bar
    this.updateProgress();
    
    // Clear previous highlights
    this.clearHighlights();
    
    // Highlight target element if specified
    if (step.target) {
      this.highlightElement(step.target);
    }
    
    // Show tooltip
    this.showTooltip(step);
    
    // Handle step action
    this.handleStepAction(step);
  }

  private updateProgress(): void {
    if (!this.progressBar) return;
    
    const progressFill = this.progressBar.querySelector('.onboarding-progress-fill') as HTMLElement;
    if (progressFill) {
      const progress = ((this.currentStepIndex + 1) / this.steps.length) * 100;
      progressFill.style.width = `${progress}%`;
    }
  }

  private clearHighlights(): void {
    // Remove previous highlights
    const highlighted = document.querySelectorAll('.onboarding-highlight');
    highlighted.forEach(el => {
      el.classList.remove('onboarding-highlight');
      (el as HTMLElement).style.position = '';
      (el as HTMLElement).style.zIndex = '';
      (el as HTMLElement).style.boxShadow = '';
    });
  }

  private highlightElement(selector: string): void {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return;

    element.classList.add('onboarding-highlight');
    
    // Create highlight effect
    const originalPosition = element.style.position;
    const originalZIndex = element.style.zIndex;
    
    element.style.position = 'relative';
    element.style.zIndex = '10002';
    element.style.boxShadow = `0 0 0 4px ${this.options.highlightColor}, 0 0 0 8px rgba(255, 107, 53, 0.3)`;
    element.style.borderRadius = '8px';
    element.style.transition = 'all 0.3s ease';

    // Create cutout in overlay
    this.createCutout(element);
  }

  private createCutout(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const padding = 8;
    
    // Create cutout using clip-path
    const cutoutPath = `
      polygon(
        0% 0%,
        0% 100%,
        ${rect.left - padding}px 100%,
        ${rect.left - padding}px ${rect.top - padding}px,
        ${rect.right + padding}px ${rect.top - padding}px,
        ${rect.right + padding}px ${rect.bottom + padding}px,
        ${rect.left - padding}px ${rect.bottom + padding}px,
        ${rect.left - padding}px 100%,
        100% 100%,
        100% 0%
      )
    `;
    
    if (this.overlay) {
      this.overlay.style.clipPath = cutoutPath;
    }
  }

  private showTooltip(step: OnboardingStep): void {
    // Remove existing tooltip
    if (this.tooltip) {
      this.tooltip.remove();
    }

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'onboarding-tooltip';
    
    Object.assign(this.tooltip.style, {
      position: 'fixed',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '320px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: '10003',
      color: '#333'
    });

    // Create tooltip content
    const title = document.createElement('h3');
    title.textContent = step.title;
    Object.assign(title.style, {
      margin: '0 0 12px 0',
      fontSize: '18px',
      fontWeight: '600',
      color: this.options.highlightColor
    });

    const description = document.createElement('p');
    description.textContent = step.description;
    Object.assign(description.style, {
      margin: '0 0 16px 0',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#666'
    });

    // Create navigation buttons
    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end'
    });

    // Previous button
    if (this.currentStepIndex > 0) {
      const prevButton = document.createElement('button');
      prevButton.textContent = 'Previous';
      Object.assign(prevButton.style, {
        background: 'transparent',
        border: `1px solid ${this.options.highlightColor}`,
        color: this.options.highlightColor,
        borderRadius: '6px',
        padding: '8px 16px',
        fontSize: '14px',
        cursor: 'pointer'
      });
      
      prevButton.addEventListener('click', () => {
        this.previousStep();
      });
      
      buttonContainer.appendChild(prevButton);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = this.currentStepIndex === this.steps.length - 1 ? 'Finish' : 'Next';
    Object.assign(nextButton.style, {
      background: this.options.highlightColor,
      border: 'none',
      color: 'white',
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      cursor: 'pointer',
      fontWeight: '600'
    });
    
    nextButton.addEventListener('click', () => {
      this.nextStep();
    });
    
    buttonContainer.appendChild(nextButton);

    this.tooltip.appendChild(title);
    this.tooltip.appendChild(description);
    this.tooltip.appendChild(buttonContainer);

    // Position tooltip
    this.positionTooltip(step);

    document.body.appendChild(this.tooltip);
  }

  private positionTooltip(step: OnboardingStep): void {
    if (!this.tooltip) return;

    const position = step.position || 'center';
    const targetElement = step.target ? document.querySelector(step.target) : null;

    if (targetElement && position !== 'center') {
      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = this.tooltip.getBoundingClientRect();
      
      switch (position) {
        case 'top':
          this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          this.tooltip.style.top = `${rect.top - tooltipRect.height - 16}px`;
          break;
        case 'bottom':
          this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          this.tooltip.style.top = `${rect.bottom + 16}px`;
          break;
        case 'left':
          this.tooltip.style.left = `${rect.left - tooltipRect.width - 16}px`;
          this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
        case 'right':
          this.tooltip.style.left = `${rect.right + 16}px`;
          this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
      }
    } else {
      // Center position
      this.tooltip.style.left = '50%';
      this.tooltip.style.top = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
    }

    // Ensure tooltip stays within viewport
    this.constrainToViewport();
  }

  private constrainToViewport(): void {
    if (!this.tooltip) return;

    const rect = this.tooltip.getBoundingClientRect();
    const padding = 16;

    if (rect.left < padding) {
      this.tooltip.style.left = `${padding}px`;
      this.tooltip.style.transform = 'none';
    }
    
    if (rect.right > window.innerWidth - padding) {
      this.tooltip.style.left = `${window.innerWidth - rect.width - padding}px`;
      this.tooltip.style.transform = 'none';
    }
    
    if (rect.top < padding) {
      this.tooltip.style.top = `${padding}px`;
      this.tooltip.style.transform = 'none';
    }
    
    if (rect.bottom > window.innerHeight - padding) {
      this.tooltip.style.top = `${window.innerHeight - rect.height - padding}px`;
      this.tooltip.style.transform = 'none';
    }
  }

  private handleStepAction(step: OnboardingStep): void {
    if (!step.action) return;

    switch (step.action) {
      case 'click':
        this.waitForClick(step.target);
        break;
      case 'hover':
        this.waitForHover(step.target);
        break;
      case 'input':
        this.waitForInput(step.target);
        break;
      case 'wait':
        this.waitForDuration(step.duration || 3000);
        break;
    }
  }

  private waitForClick(target?: string): void {
    if (!target) return;

    const element = document.querySelector(target);
    if (!element) return;

    const clickHandler = () => {
      element.removeEventListener('click', clickHandler);
      if (this.options.autoAdvance) {
        setTimeout(() => this.nextStep(), 500);
      }
    };

    element.addEventListener('click', clickHandler);
  }

  private waitForHover(target?: string): void {
    if (!target) return;

    const element = document.querySelector(target);
    if (!element) return;

    const hoverHandler = () => {
      element.removeEventListener('mouseenter', hoverHandler);
      if (this.options.autoAdvance) {
        setTimeout(() => this.nextStep(), 1000);
      }
    };

    element.addEventListener('mouseenter', hoverHandler);
  }

  private waitForInput(target?: string): void {
    if (!target) return;

    const element = document.querySelector(target) as HTMLInputElement;
    if (!element) return;

    const inputHandler = () => {
      if (element.value.length > 0) {
        element.removeEventListener('input', inputHandler);
        if (this.options.autoAdvance) {
          setTimeout(() => this.nextStep(), 500);
        }
      }
    };

    element.addEventListener('input', inputHandler);
  }

  private waitForDuration(duration: number): void {
    setTimeout(() => {
      if (this.options.autoAdvance) {
        this.nextStep();
      }
    }, duration);
  }

  private showValidationError(): void {
    if (!this.tooltip) return;

    // Add error styling to tooltip
    this.tooltip.style.borderLeft = '4px solid #ef4444';
    
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.textContent = 'Please complete this step before continuing.';
    Object.assign(errorMsg.style, {
      color: '#ef4444',
      fontSize: '12px',
      marginTop: '8px',
      fontWeight: '500'
    });
    
    this.tooltip.appendChild(errorMsg);
    
    // Remove error after 3 seconds
    setTimeout(() => {
      this.tooltip!.style.borderLeft = '';
      errorMsg.remove();
    }, 3000);
  }

  private complete(): void {
    this.cleanup();
    if (this.onComplete) {
      this.onComplete();
    }
  }

  private cleanup(): void {
    this.isActive = false;
    
    // Remove overlay
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    // Remove tooltip
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    
    // Clear highlights
    this.clearHighlights();
    
    this.progressBar = null;
  }
}

/**
 * Create default onboarding steps for UpPaws
 */
export function createDefaultOnboardingSteps(): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to UpPaws!',
      description: 'Let\'s learn how to discover and collect amazing animals through puzzle-solving adventures.',
      position: 'center',
      skippable: true
    },
    {
      id: 'daily-puzzle',
      title: 'Daily Animal Puzzle',
      description: 'Each day brings a new animal puzzle. Solve it to add the animal to your collection!',
      target: '.panel-header .emoji',
      position: 'bottom',
      action: 'hover'
    },
    {
      id: 'letter-bank',
      title: 'Letter Bank',
      description: 'Tap letters from the bank to spell out the animal\'s name. The emoji gives you a hint!',
      target: '.letter-bank',
      position: 'top',
      action: 'click'
    },
    {
      id: 'answer-slots',
      title: 'Answer Slots',
      description: 'Letters you select appear here. Tap a slot to remove a letter if you make a mistake.',
      target: '.answer-slots',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'hint-button',
      title: 'Need Help?',
      description: 'Use the hint button if you\'re stuck, but it will cost you 2 points from your score.',
      target: '#btn-hint',
      position: 'top',
      skippable: true
    },
    {
      id: 'submit-answer',
      title: 'Submit Your Answer',
      description: 'When you think you have the right answer, tap Submit to check if you\'re correct!',
      target: '#btn-submit',
      position: 'top',
      action: 'click'
    },
    {
      id: 'arcade-mode',
      title: 'Arcade Mode',
      description: 'Want more puzzles? Try Arcade Mode for unlimited play with increasing difficulty!',
      target: '#btn-arcade',
      position: 'top',
      skippable: true
    },
    {
      id: 'leaderboard',
      title: 'Compete with Others',
      description: 'Check the leaderboard to see how you rank against other animal trainers!',
      target: '#btn-leaderboard',
      position: 'bottom',
      skippable: true
    },
    {
      id: 'complete',
      title: 'You\'re Ready!',
      description: 'You now know the basics of UpPaws. Start your animal training adventure and discover amazing creatures!',
      position: 'center'
    }
  ];
}

/**
 * Start the default onboarding experience
 */
export function startDefaultOnboarding(options?: Partial<OnboardingOptions>): Promise<void> {
  const onboarding = new OnboardingSystem(options);
  const steps = createDefaultOnboardingSteps();
  onboarding.addSteps(steps);
  return onboarding.start();
}