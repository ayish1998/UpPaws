/**
 * Internationalization (i18n) System for UpPaws Animal Trainer
 * Provides multi-language support and cultural adaptation
 */

export interface LocaleData {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    currency: string;
  };
  pluralRules: (count: number) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
}

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface CulturalAdaptation {
  animalNames: Record<string, string>;
  colorMeanings: Record<string, string>;
  gestureInterpretations: Record<string, string>;
  dateTimePreferences: {
    timeFormat: '12h' | '24h';
    firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  };
}

export class InternationalizationSystem {
  private currentLocale: string = 'en-US';
  private fallbackLocale: string = 'en-US';
  private translations: Map<string, TranslationData> = new Map();
  private locales: Map<string, LocaleData> = new Map();
  private culturalAdaptations: Map<string, CulturalAdaptation> = new Map();
  private loadedLocales: Set<string> = new Set();

  constructor() {
    this.initializeDefaultLocales();
    this.initializeDefaultTranslations();
    this.detectUserLocale();
  }

  /**
   * Set the current locale
   */
  async setLocale(localeCode: string): Promise<void> {
    if (!this.locales.has(localeCode)) {
      throw new Error(`Locale ${localeCode} is not supported`);
    }

    // Load translations if not already loaded
    if (!this.loadedLocales.has(localeCode)) {
      await this.loadTranslations(localeCode);
    }

    this.currentLocale = localeCode;
    this.applyLocaleSettings();
    this.saveLocalePreference();
  }

  /**
   * Get current locale
   */
  getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): LocaleData[] {
    return Array.from(this.locales.values());
  }

  /**
   * Translate a key with optional interpolation
   */
  translate(key: string, params: Record<string, string | number> = {}): string {
    const translation = this.getTranslation(key, this.currentLocale) || 
                       this.getTranslation(key, this.fallbackLocale) || 
                       key;

    return this.interpolate(translation, params);
  }

  /**
   * Translate with pluralization
   */
  translatePlural(key: string, count: number, params: Record<string, string | number> = {}): string {
    const locale = this.locales.get(this.currentLocale);
    if (!locale) return this.translate(key, { ...params, count });

    const pluralForm = locale.pluralRules(count);
    const pluralKey = `${key}.${pluralForm}`;
    
    const translation = this.getTranslation(pluralKey, this.currentLocale) || 
                       this.getTranslation(`${key}.other`, this.currentLocale) ||
                       this.getTranslation(key, this.currentLocale) ||
                       key;

    return this.interpolate(translation, { ...params, count });
  }

  /**
   * Format number according to locale
   */
  formatNumber(number: number, options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(number);
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(this.currentLocale, { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    }
  }

  /**
   * Get culturally adapted animal name
   */
  getLocalizedAnimalName(animalId: string): string {
    const adaptation = this.culturalAdaptations.get(this.currentLocale);
    return adaptation?.animalNames[animalId] || this.translate(`animals.${animalId}`);
  }

  /**
   * Check if current locale uses right-to-left text direction
   */
  isRTL(): boolean {
    const locale = this.locales.get(this.currentLocale);
    return locale?.direction === 'rtl';
  }

  /**
   * Get locale-specific date/time preferences
   */
  getDateTimePreferences(): CulturalAdaptation['dateTimePreferences'] {
    const adaptation = this.culturalAdaptations.get(this.currentLocale);
    return adaptation?.dateTimePreferences || {
      timeFormat: '12h',
      firstDayOfWeek: 0
    };
  }

  /**
   * Add custom translation
   */
  addTranslation(localeCode: string, key: string, value: string): void {
    if (!this.translations.has(localeCode)) {
      this.translations.set(localeCode, {});
    }

    const translations = this.translations.get(localeCode)!;
    this.setNestedValue(translations, key, value);
  }

  /**
   * Load translations from external source
   */
  async loadTranslations(localeCode: string): Promise<void> {
    try {
      // In a real implementation, this would load from a server or local files
      // For now, we'll use the default translations
      if (!this.translations.has(localeCode) && localeCode !== 'en-US') {
        console.warn(`Translations for ${localeCode} not available, using fallback`);
      }
      this.loadedLocales.add(localeCode);
    } catch (error) {
      console.error(`Failed to load translations for ${localeCode}:`, error);
      throw error;
    }
  }

  private initializeDefaultLocales(): void {
    const locales: LocaleData[] = [
      {
        code: 'en-US',
        name: 'English (US)',
        nativeName: 'English',
        direction: 'ltr',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: { decimal: '.', thousands: ',', currency: '$' },
        pluralRules: (n) => n === 1 ? 'one' : 'other'
      },
      {
        code: 'es-ES',
        name: 'Spanish (Spain)',
        nativeName: 'Español',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: { decimal: ',', thousands: '.', currency: '€' },
        pluralRules: (n) => n === 1 ? 'one' : 'other'
      },
      {
        code: 'fr-FR',
        name: 'French (France)',
        nativeName: 'Français',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: { decimal: ',', thousands: ' ', currency: '€' },
        pluralRules: (n) => n <= 1 ? 'one' : 'other'
      },
      {
        code: 'de-DE',
        name: 'German (Germany)',
        nativeName: 'Deutsch',
        direction: 'ltr',
        dateFormat: 'DD.MM.YYYY',
        numberFormat: { decimal: ',', thousands: '.', currency: '€' },
        pluralRules: (n) => n === 1 ? 'one' : 'other'
      },
      {
        code: 'ja-JP',
        name: 'Japanese',
        nativeName: '日本語',
        direction: 'ltr',
        dateFormat: 'YYYY/MM/DD',
        numberFormat: { decimal: '.', thousands: ',', currency: '¥' },
        pluralRules: () => 'other'
      },
      {
        code: 'zh-CN',
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        direction: 'ltr',
        dateFormat: 'YYYY/MM/DD',
        numberFormat: { decimal: '.', thousands: ',', currency: '¥' },
        pluralRules: () => 'other'
      },
      {
        code: 'ar-SA',
        name: 'Arabic (Saudi Arabia)',
        nativeName: 'العربية',
        direction: 'rtl',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: { decimal: '.', thousands: ',', currency: 'ر.س' },
        pluralRules: (n) => {
          if (n === 0) return 'zero';
          if (n === 1) return 'one';
          if (n === 2) return 'two';
          if (n % 100 >= 3 && n % 100 <= 10) return 'few';
          if (n % 100 >= 11) return 'many';
          return 'other';
        }
      }
    ];

    locales.forEach(locale => {
      this.locales.set(locale.code, locale);
    });
  }

  private initializeDefaultTranslations(): void {
    // English (default)
    const enTranslations: TranslationData = {
      common: {
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        cancel: 'Cancel',
        close: 'Close',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning'
      },
      game: {
        title: 'UpPaws: Animal Trainer',
        subtitle: 'Discover, Collect, and Train Amazing Animals',
        dailyPuzzle: 'Daily Puzzle',
        arcadeMode: 'Arcade Mode',
        battleMode: 'Battle Mode',
        collection: 'My Collection',
        leaderboard: 'Leaderboard',
        settings: 'Settings',
        help: 'Help'
      },
      puzzle: {
        hint: 'Hint',
        submit: 'Submit',
        clear: 'Clear',
        timeBonus: 'Time Bonus: +{{bonus}} points',
        hintPenalty: 'Hint used: -2 points',
        correct: 'Correct!',
        incorrect: 'Try again!',
        alreadyPlayed: 'You\'ve already played today. Come back tomorrow!',
        letters: {
          one: '{{count}} letter',
          other: '{{count}} letters'
        }
      },
      animals: {
        hippopotamus: 'Hippopotamus',
        falcon: 'Falcon',
        giraffe: 'Giraffe',
        octopus: 'Octopus',
        panda: 'Panda',
        tiger: 'Tiger',
        crocodile: 'Crocodile'
      },
      accessibility: {
        screenReader: 'Screen Reader Support',
        keyboardNavigation: 'Keyboard Navigation',
        highContrast: 'High Contrast',
        reducedMotion: 'Reduced Motion',
        fontSize: 'Font Size',
        colorScheme: 'Color Scheme',
        announcements: 'Game announcements will appear here for screen readers'
      }
    };

    // Spanish translations
    const esTranslations: TranslationData = {
      common: {
        yes: 'Sí',
        no: 'No',
        ok: 'Aceptar',
        cancel: 'Cancelar',
        close: 'Cerrar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia'
      },
      game: {
        title: 'UpPaws: Entrenador de Animales',
        subtitle: 'Descubre, Colecciona y Entrena Animales Increíbles',
        dailyPuzzle: 'Puzzle Diario',
        arcadeMode: 'Modo Arcade',
        battleMode: 'Modo Batalla',
        collection: 'Mi Colección',
        leaderboard: 'Clasificación',
        settings: 'Configuración',
        help: 'Ayuda'
      },
      puzzle: {
        hint: 'Pista',
        submit: 'Enviar',
        clear: 'Limpiar',
        timeBonus: 'Bonus de Tiempo: +{{bonus}} puntos',
        hintPenalty: 'Pista usada: -2 puntos',
        correct: '¡Correcto!',
        incorrect: '¡Inténtalo de nuevo!',
        alreadyPlayed: 'Ya has jugado hoy. ¡Vuelve mañana!',
        letters: {
          one: '{{count}} letra',
          other: '{{count}} letras'
        }
      },
      animals: {
        hippopotamus: 'Hipopótamo',
        falcon: 'Halcón',
        giraffe: 'Jirafa',
        octopus: 'Pulpo',
        panda: 'Panda',
        tiger: 'Tigre',
        crocodile: 'Cocodrilo'
      }
    };

    this.translations.set('en-US', enTranslations);
    this.translations.set('es-ES', esTranslations);
    this.loadedLocales.add('en-US');
    this.loadedLocales.add('es-ES');

    // Initialize cultural adaptations
    this.initializeCulturalAdaptations();
  }

  private initializeCulturalAdaptations(): void {
    // US cultural adaptation
    this.culturalAdaptations.set('en-US', {
      animalNames: {},
      colorMeanings: {
        red: 'danger, excitement',
        green: 'success, nature',
        blue: 'trust, calm',
        yellow: 'warning, happiness'
      },
      gestureInterpretations: {
        thumbsUp: 'positive, good',
        wave: 'greeting, goodbye'
      },
      dateTimePreferences: {
        timeFormat: '12h',
        firstDayOfWeek: 0
      }
    });

    // Spanish cultural adaptation
    this.culturalAdaptations.set('es-ES', {
      animalNames: {
        hippopotamus: 'Hipopótamo',
        falcon: 'Halcón',
        giraffe: 'Jirafa'
      },
      colorMeanings: {
        red: 'pasión, peligro',
        green: 'esperanza, naturaleza',
        blue: 'tranquilidad, confianza',
        yellow: 'alegría, advertencia'
      },
      gestureInterpretations: {
        thumbsUp: 'positivo, bueno',
        wave: 'saludo, despedida'
      },
      dateTimePreferences: {
        timeFormat: '24h',
        firstDayOfWeek: 1
      }
    });

    // Arabic cultural adaptation
    this.culturalAdaptations.set('ar-SA', {
      animalNames: {},
      colorMeanings: {
        green: 'Islam, paradise, nature',
        white: 'purity, peace',
        black: 'elegance, formality',
        gold: 'wealth, luxury'
      },
      gestureInterpretations: {
        thumbsUp: 'offensive in some contexts',
        wave: 'greeting'
      },
      dateTimePreferences: {
        timeFormat: '12h',
        firstDayOfWeek: 0
      }
    });
  }

  private getTranslation(key: string, localeCode: string): string | null {
    const translations = this.translations.get(localeCode);
    if (!translations) return null;

    return this.getNestedValue(translations, key);
  }

  private getNestedValue(obj: TranslationData, key: string): string | null {
    const keys = key.split('.');
    let current: any = obj;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  private setNestedValue(obj: TranslationData, key: string, value: string): void {
    const keys = key.split('.');
    let current: any = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  private interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  private detectUserLocale(): void {
    // Try to detect user's preferred locale
    const browserLocale = navigator.language || 'en-US';
    const supportedLocale = this.findSupportedLocale(browserLocale);
    
    // Load saved preference
    const savedLocale = this.loadLocalePreference();
    
    if (savedLocale && this.locales.has(savedLocale)) {
      this.currentLocale = savedLocale;
    } else if (supportedLocale) {
      this.currentLocale = supportedLocale;
    }

    this.applyLocaleSettings();
  }

  private findSupportedLocale(locale: string): string | null {
    // Exact match
    if (this.locales.has(locale)) {
      return locale;
    }

    // Language match (e.g., 'en' matches 'en-US')
    const language = locale.split('-')[0];
    for (const [code] of this.locales) {
      if (code.startsWith(language + '-')) {
        return code;
      }
    }

    return null;
  }

  private applyLocaleSettings(): void {
    const locale = this.locales.get(this.currentLocale);
    if (!locale) return;

    // Set document language and direction
    document.documentElement.lang = this.currentLocale;
    document.documentElement.dir = locale.direction;

    // Add locale class to body
    document.body.classList.remove(...Array.from(this.locales.keys()).map(code => `locale-${code}`));
    document.body.classList.add(`locale-${this.currentLocale}`);

    // Set RTL class if needed
    document.body.classList.toggle('rtl', locale.direction === 'rtl');
  }

  private saveLocalePreference(): void {
    try {
      localStorage.setItem('uppaws-locale', this.currentLocale);
    } catch (error) {
      console.warn('Could not save locale preference:', error);
    }
  }

  private loadLocalePreference(): string | null {
    try {
      return localStorage.getItem('uppaws-locale');
    } catch (error) {
      console.warn('Could not load locale preference:', error);
      return null;
    }
  }
}

// Global instance
export const i18nSystem = new InternationalizationSystem();