/**
 * Splash Screen - Animated trainer selection with habitat previews
 * Creates an engaging first impression for new users
 */

export interface TrainerOption {
  id: string;
  name: string;
  description: string;
  habitat: string;
  icon: string;
  color: string;
  specialization: 'research' | 'battle' | 'conservation';
}

export interface SplashScreenOptions {
  showAnimation: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
}

export class SplashScreen {
  private container: HTMLElement;
  private options: SplashScreenOptions;
  private selectedTrainer: TrainerOption | null = null;
  private onComplete: ((trainer: TrainerOption) => void) | null = null;

  private trainerOptions: TrainerOption[] = [
    {
      id: 'forest-researcher',
      name: 'Forest Researcher',
      description: 'Discover rare animals in lush forest habitats',
      habitat: 'Forest',
      icon: '🌲',
      color: '#22c55e',
      specialization: 'research'
    },
    {
      id: 'ocean-explorer',
      name: 'Ocean Explorer',
      description: 'Dive deep to find amazing marine creatures',
      habitat: 'Ocean',
      icon: '🌊',
      color: '#3b82f6',
      specialization: 'research'
    },
    {
      id: 'mountain-trainer',
      name: 'Mountain Trainer',
      description: 'Train powerful animals in rugged mountain terrain',
      habitat: 'Mountain',
      icon: '⛰️',
      color: '#8b5cf6',
      specialization: 'battle'
    },
    {
      id: 'desert-guardian',
      name: 'Desert Guardian',
      description: 'Protect endangered species in harsh desert environments',
      habitat: 'Desert',
      icon: '🏜️',
      color: '#f59e0b',
      specialization: 'conservation'
    }
  ];

  constructor(container: HTMLElement, options: Partial<SplashScreenOptions> = {}) {
    this.container = container;
    this.options = {
      showAnimation: true,
      autoAdvance: false,
      autoAdvanceDelay: 3000,
      ...options
    };
    
    this.createSplashScreen();
  }

  /**
   * Show the splash screen
   */
  show(): Promise<TrainerOption> {
    return new Promise((resolve) => {
      this.onComplete = resolve;
      this.container.style.display = 'flex';
      
      if (this.options.showAnimation) {
        this.playIntroAnimation();
      }
      
      if (this.options.autoAdvance) {
        setTimeout(() => {
          if (!this.selectedTrainer) {
            this.selectTrainer(this.trainerOptions[0]);
          }
        }, this.options.autoAdvanceDelay);
      }
    });
  }

  /**
   * Hide the splash screen
   */
  hide(): void {
    this.container.style.display = 'none';
  }

  private createSplashScreen(): void {
    this.container.className = 'splash-screen';
    this.container.innerHTML = '';
    
    // Apply styles
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999',
      overflow: 'hidden'
    });

    // Create animated background
    this.createAnimatedBackground();
    
    // Create main content
    this.createMainContent();
    
    // Create trainer selection
    this.createTrainerSelection();
    
    // Create continue button
    this.createContinueButton();
  }

  private createAnimatedBackground(): void {
    const background = document.createElement('div');
    background.className = 'splash-background';
    
    Object.assign(background.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
      `,
      animation: 'backgroundFloat 20s ease-in-out infinite'
    });
    
    // Add floating particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'splash-particle';
      
      Object.assign(particle.style, {
        position: 'absolute',
        width: '4px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.6)',
        borderRadius: '50%',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `particleFloat ${5 + Math.random() * 10}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`
      });
      
      background.appendChild(particle);
    }
    
    this.container.appendChild(background);
  }

  private createMainContent(): void {
    const content = document.createElement('div');
    content.className = 'splash-content';
    
    Object.assign(content.style, {
      textAlign: 'center',
      color: 'white',
      zIndex: '2',
      maxWidth: '600px',
      padding: '0 20px'
    });

    // Logo/Title
    const title = document.createElement('h1');
    title.textContent = '🐾 UpPaws: Animal Trainer';
    Object.assign(title.style, {
      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
      fontWeight: '800',
      margin: '0 0 1rem 0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      animation: 'titleSlideIn 1s ease-out'
    });

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Discover, collect, and train amazing animals from around the world';
    Object.assign(subtitle.style, {
      fontSize: 'clamp(1rem, 3vw, 1.25rem)',
      margin: '0 0 2rem 0',
      opacity: '0.9',
      animation: 'subtitleFadeIn 1s ease-out 0.5s both'
    });

    // Features list
    const features = document.createElement('div');
    features.className = 'splash-features';
    Object.assign(features.style, {
      display: 'flex',
      justifyContent: 'center',
      gap: '2rem',
      flexWrap: 'wrap',
      margin: '2rem 0',
      animation: 'featuresSlideUp 1s ease-out 1s both'
    });

    const featureList = [
      { icon: '🧩', text: 'Puzzle Battles' },
      { icon: '🏆', text: 'Tournaments' },
      { icon: '🌍', text: 'Explore Habitats' },
      { icon: '📚', text: 'Learn & Discover' }
    ];

    featureList.forEach(feature => {
      const featureEl = document.createElement('div');
      featureEl.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">${feature.icon}</div>
        <div style="font-size: 0.9rem; opacity: 0.8;">${feature.text}</div>
      `;
      Object.assign(featureEl.style, {
        textAlign: 'center',
        minWidth: '100px'
      });
      features.appendChild(featureEl);
    });

    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(features);
    this.container.appendChild(content);
  }

  private createTrainerSelection(): void {
    const selectionContainer = document.createElement('div');
    selectionContainer.className = 'trainer-selection';
    
    Object.assign(selectionContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      marginTop: '2rem',
      zIndex: '2',
      animation: 'selectionSlideUp 1s ease-out 1.5s both'
    });

    // Selection title
    const selectionTitle = document.createElement('h2');
    selectionTitle.textContent = 'Choose Your Path';
    Object.assign(selectionTitle.style, {
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: '600',
      margin: '0',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
    });

    // Trainer options
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'trainer-options';
    Object.assign(optionsContainer.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      maxWidth: '800px',
      width: '100%',
      padding: '0 20px'
    });

    this.trainerOptions.forEach((trainer, index) => {
      const option = this.createTrainerOption(trainer, index);
      optionsContainer.appendChild(option);
    });

    selectionContainer.appendChild(selectionTitle);
    selectionContainer.appendChild(optionsContainer);
    this.container.appendChild(selectionContainer);
  }

  private createTrainerOption(trainer: TrainerOption, index: number): HTMLElement {
    const option = document.createElement('div');
    option.className = 'trainer-option';
    option.dataset.trainerId = trainer.id;
    
    Object.assign(option.style, {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '1.5rem',
      textAlign: 'center',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: 'translateY(20px)',
      opacity: '0',
      animation: `optionSlideIn 0.5s ease-out ${1.8 + index * 0.1}s both`
    });

    // Icon
    const icon = document.createElement('div');
    icon.textContent = trainer.icon;
    Object.assign(icon.style, {
      fontSize: '3rem',
      marginBottom: '1rem'
    });

    // Name
    const name = document.createElement('h3');
    name.textContent = trainer.name;
    Object.assign(name.style, {
      fontSize: '1.25rem',
      fontWeight: '600',
      margin: '0 0 0.5rem 0'
    });

    // Habitat
    const habitat = document.createElement('div');
    habitat.textContent = trainer.habitat;
    Object.assign(habitat.style, {
      fontSize: '0.9rem',
      opacity: '0.8',
      marginBottom: '0.5rem',
      color: trainer.color
    });

    // Description
    const description = document.createElement('p');
    description.textContent = trainer.description;
    Object.assign(description.style, {
      fontSize: '0.85rem',
      opacity: '0.7',
      margin: '0',
      lineHeight: '1.4'
    });

    // Specialization badge
    const badge = document.createElement('div');
    badge.textContent = trainer.specialization.charAt(0).toUpperCase() + trainer.specialization.slice(1);
    Object.assign(badge.style, {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: trainer.color,
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '600'
    });

    option.style.position = 'relative';
    option.appendChild(badge);
    option.appendChild(icon);
    option.appendChild(name);
    option.appendChild(habitat);
    option.appendChild(description);

    // Add hover and click effects
    option.addEventListener('mouseenter', () => {
      option.style.transform = 'translateY(-5px) scale(1.02)';
      option.style.background = 'rgba(255, 255, 255, 0.15)';
      option.style.borderColor = trainer.color;
    });

    option.addEventListener('mouseleave', () => {
      if (this.selectedTrainer?.id !== trainer.id) {
        option.style.transform = 'translateY(0) scale(1)';
        option.style.background = 'rgba(255, 255, 255, 0.1)';
        option.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }
    });

    option.addEventListener('click', () => {
      this.selectTrainer(trainer);
    });

    return option;
  }

  private createContinueButton(): void {
    const button = document.createElement('button');
    button.textContent = 'Begin Adventure';
    button.className = 'splash-continue-btn';
    
    Object.assign(button.style, {
      background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      padding: '16px 32px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '2rem',
      zIndex: '2',
      opacity: '0.5',
      pointerEvents: 'none',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
      animation: 'buttonSlideUp 1s ease-out 2s both'
    });

    button.addEventListener('click', () => {
      if (this.selectedTrainer && this.onComplete) {
        this.playOutroAnimation().then(() => {
          this.onComplete!(this.selectedTrainer!);
        });
      }
    });

    this.container.appendChild(button);
  }

  private selectTrainer(trainer: TrainerOption): void {
    this.selectedTrainer = trainer;
    
    // Update visual selection
    const options = this.container.querySelectorAll('.trainer-option');
    options.forEach(option => {
      const isSelected = option.getAttribute('data-trainer-id') === trainer.id;
      
      if (isSelected) {
        option.style.transform = 'translateY(-5px) scale(1.05)';
        option.style.background = 'rgba(255, 255, 255, 0.2)';
        option.style.borderColor = trainer.color;
        option.style.boxShadow = `0 8px 25px ${trainer.color}40`;
      } else {
        option.style.transform = 'translateY(0) scale(0.95)';
        option.style.opacity = '0.6';
      }
    });

    // Enable continue button
    const continueBtn = this.container.querySelector('.splash-continue-btn') as HTMLElement;
    if (continueBtn) {
      continueBtn.style.opacity = '1';
      continueBtn.style.pointerEvents = 'auto';
      continueBtn.style.transform = 'translateY(-2px)';
    }
  }

  private playIntroAnimation(): void {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes backgroundFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-10px) rotate(1deg); }
        66% { transform: translateY(5px) rotate(-1deg); }
      }
      
      @keyframes particleFloat {
        0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
        50% { transform: translateY(-20px) translateX(10px); opacity: 1; }
      }
      
      @keyframes titleSlideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes subtitleFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 0.9; transform: translateY(0); }
      }
      
      @keyframes featuresSlideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes selectionSlideUp {
        from { transform: translateY(40px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes optionSlideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes buttonSlideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }

  private playOutroAnimation(): Promise<void> {
    return new Promise((resolve) => {
      // Fade out animation
      this.container.style.transition = 'opacity 0.5s ease-out';
      this.container.style.opacity = '0';
      
      setTimeout(() => {
        this.hide();
        resolve();
      }, 500);
    });
  }
}

/**
 * Create and show splash screen
 */
export function createSplashScreen(
  container: HTMLElement,
  options?: Partial<SplashScreenOptions>
): Promise<TrainerOption> {
  const splash = new SplashScreen(container, options);
  return splash.show();
}