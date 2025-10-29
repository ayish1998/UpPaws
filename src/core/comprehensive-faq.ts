/**
 * Comprehensive FAQ System - Extended FAQ with community management features
 * Integrates with the support system for seamless help experience
 */

import { FAQ, SupportSystem } from './support-system.js';

export interface ExtendedFAQ extends FAQ {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  videoUrl?: string;
  screenshots?: string[];
  relatedFeatures: string[];
  communityVotes: {
    helpful: number;
    notHelpful: number;
  };
  lastReviewed: Date;
  reviewedBy?: string;
  isOfficial: boolean;
  communitySubmitted: boolean;
  submittedBy?: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  isVisible: boolean;
  parentCategory?: string;
  subcategories: string[];
}

export class ComprehensiveFAQSystem {
  private static instance: ComprehensiveFAQSystem;
  private supportSystem: SupportSystem;
  private extendedFAQs: Map<string, ExtendedFAQ> = new Map();
  private categories: Map<string, FAQCategory> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();

  private constructor() {
    this.supportSystem = SupportSystem.getInstance();
    this.initializeCategories();
    this.initializeExtendedFAQs();
    this.buildSearchIndex();
  }

  static getInstance(): ComprehensiveFAQSystem {
    if (!ComprehensiveFAQSystem.instance) {
      ComprehensiveFAQSystem.instance = new ComprehensiveFAQSystem();
    }
    return ComprehensiveFAQSystem.instance;
  }

  /**
   * Get all FAQ categories
   */
  getCategories(): FAQCategory[] {
    return Array.from(this.categories.values())
      .filter(cat => cat.isVisible)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get FAQs by category with enhanced filtering
   */
  getFAQsByCategory(categoryId: string, options: {
    difficulty?: ExtendedFAQ['difficulty'];
    sortBy?: 'helpfulness' | 'views' | 'recent' | 'alphabetical';
    limit?: number;
  } = {}): ExtendedFAQ[] {
    const faqs = Array.from(this.extendedFAQs.values())
      .filter(faq => faq.category === categoryId);

    // Apply difficulty filter
    const filtered = options.difficulty 
      ? faqs.filter(faq => faq.difficulty === options.difficulty)
      : faqs;

    // Apply sorting
    const sorted = this.sortFAQs(filtered, options.sortBy || 'helpfulness');

    // Apply limit
    return options.limit ? sorted.slice(0, options.limit) : sorted;
  }

  /**
   * Advanced FAQ search with multiple criteria
   */
  searchFAQs(query: string, options: {
    categories?: string[];
    difficulty?: ExtendedFAQ['difficulty'];
    tags?: string[];
    includeUnofficial?: boolean;
  } = {}): ExtendedFAQ[] {
    const queryLower = query.toLowerCase();
    const results: ExtendedFAQ[] = [];

    // Search in indexed terms
    const searchTerms = queryLower.split(' ').filter(term => term.length > 2);
    const candidateIds = new Set<string>();

    searchTerms.forEach(term => {
      const matchingIds = this.searchIndex.get(term);
      if (matchingIds) {
        matchingIds.forEach(id => candidateIds.add(id));
      }
    });

    // Get candidate FAQs and apply filters
    candidateIds.forEach(id => {
      const faq = this.extendedFAQs.get(id);
      if (!faq) return;

      // Category filter
      if (options.categories && !options.categories.includes(faq.category)) return;

      // Difficulty filter
      if (options.difficulty && faq.difficulty !== options.difficulty) return;

      // Tags filter
      if (options.tags && !options.tags.some(tag => faq.tags.includes(tag))) return;

      // Official content filter
      if (!options.includeUnofficial && !faq.isOfficial) return;

      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(faq, queryLower, searchTerms);
      if (relevanceScore > 0) {
        results.push({ ...faq, relevanceScore } as ExtendedFAQ & { relevanceScore: number });
      }
    });

    // Sort by relevance and helpfulness
    return results.sort((a, b) => {
      const aScore = (a as any).relevanceScore;
      const bScore = (b as any).relevanceScore;
      if (aScore !== bScore) return bScore - aScore;
      return b.helpfulness - a.helpfulness;
    });
  }

  /**
   * Get trending FAQs based on recent activity
   */
  getTrendingFAQs(timeframe: 'day' | 'week' | 'month' = 'week', limit: number = 10): ExtendedFAQ[] {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }

    return Array.from(this.extendedFAQs.values())
      .filter(faq => faq.lastUpdated > cutoff)
      .sort((a, b) => {
        // Weight recent views more heavily
        const aScore = a.views + (a.communityVotes.helpful * 2);
        const bScore = b.views + (b.communityVotes.helpful * 2);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * Get recommended FAQs based on user behavior
   */
  getRecommendedFAQs(userId: string, context: {
    currentCategory?: string;
    recentSearches?: string[];
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
  } = {}): ExtendedFAQ[] {
    const recommendations: ExtendedFAQ[] = [];

    // Get user's difficulty level FAQs
    if (context.userLevel) {
      const levelFAQs = Array.from(this.extendedFAQs.values())
        .filter(faq => faq.difficulty === context.userLevel)
        .sort((a, b) => b.helpfulness - a.helpfulness)
        .slice(0, 3);
      recommendations.push(...levelFAQs);
    }

    // Get FAQs from current category
    if (context.currentCategory) {
      const categoryFAQs = this.getFAQsByCategory(context.currentCategory, { limit: 3 });
      recommendations.push(...categoryFAQs);
    }

    // Get FAQs related to recent searches
    if (context.recentSearches && context.recentSearches.length > 0) {
      const searchFAQs = context.recentSearches
        .flatMap(search => this.searchFAQs(search, { includeUnofficial: true }))
        .slice(0, 3);
      recommendations.push(...searchFAQs);
    }

    // Remove duplicates and return top recommendations
    const uniqueRecommendations = recommendations.filter((faq, index, arr) => 
      arr.findIndex(f => f.id === faq.id) === index
    );

    return uniqueRecommendations.slice(0, 8);
  }

  /**
   * Submit community FAQ
   */
  async submitCommunityFAQ(faq: Partial<ExtendedFAQ>, submitterId: string): Promise<ExtendedFAQ> {
    const newFAQ: ExtendedFAQ = {
      id: `community_faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'other',
      keywords: faq.keywords || [],
      helpfulness: 0,
      views: 0,
      lastUpdated: new Date(),
      relatedArticles: faq.relatedArticles || [],
      difficulty: faq.difficulty || 'beginner',
      tags: faq.tags || [],
      videoUrl: faq.videoUrl,
      screenshots: faq.screenshots || [],
      relatedFeatures: faq.relatedFeatures || [],
      communityVotes: { helpful: 0, notHelpful: 0 },
      lastReviewed: new Date(),
      isOfficial: false,
      communitySubmitted: true,
      submittedBy: submitterId
    };

    this.extendedFAQs.set(newFAQ.id, newFAQ);
    this.updateSearchIndex(newFAQ);

    return newFAQ;
  }

  /**
   * Vote on FAQ helpfulness
   */
  voteFAQ(faqId: string, helpful: boolean, userId: string): boolean {
    const faq = this.extendedFAQs.get(faqId);
    if (!faq) return false;

    // Update community votes
    if (helpful) {
      faq.communityVotes.helpful++;
    } else {
      faq.communityVotes.notHelpful++;
    }

    // Update overall helpfulness score
    const totalVotes = faq.communityVotes.helpful + faq.communityVotes.notHelpful;
    const positiveRatio = faq.communityVotes.helpful / totalVotes;
    faq.helpfulness = Math.round(positiveRatio * 100);

    faq.views++;
    faq.lastUpdated = new Date();

    return true;
  }

  /**
   * Get FAQ analytics
   */
  getFAQAnalytics(): {
    totalFAQs: number;
    officialFAQs: number;
    communityFAQs: number;
    categoryCounts: Record<string, number>;
    difficultyDistribution: Record<string, number>;
    topPerforming: ExtendedFAQ[];
    needsReview: ExtendedFAQ[];
    recentActivity: {
      newFAQs: number;
      updatedFAQs: number;
      totalViews: number;
      totalVotes: number;
    };
  } {
    const faqs = Array.from(this.extendedFAQs.values());
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const categoryCounts: Record<string, number> = {};
    const difficultyDistribution: Record<string, number> = {};
    let totalViews = 0;
    let totalVotes = 0;
    let newFAQs = 0;
    let updatedFAQs = 0;

    faqs.forEach(faq => {
      // Category counts
      categoryCounts[faq.category] = (categoryCounts[faq.category] || 0) + 1;

      // Difficulty distribution
      difficultyDistribution[faq.difficulty] = (difficultyDistribution[faq.difficulty] || 0) + 1;

      // Activity metrics
      totalViews += faq.views;
      totalVotes += faq.communityVotes.helpful + faq.communityVotes.notHelpful;

      if (faq.lastUpdated > weekAgo) {
        if (faq.communitySubmitted && faq.lastUpdated === faq.lastReviewed) {
          newFAQs++;
        } else {
          updatedFAQs++;
        }
      }
    });

    return {
      totalFAQs: faqs.length,
      officialFAQs: faqs.filter(f => f.isOfficial).length,
      communityFAQs: faqs.filter(f => f.communitySubmitted).length,
      categoryCounts,
      difficultyDistribution,
      topPerforming: faqs
        .sort((a, b) => b.helpfulness - a.helpfulness)
        .slice(0, 10),
      needsReview: faqs
        .filter(f => f.communitySubmitted && !f.isOfficial)
        .sort((a, b) => a.lastReviewed.getTime() - b.lastReviewed.getTime())
        .slice(0, 10),
      recentActivity: {
        newFAQs,
        updatedFAQs,
        totalViews,
        totalVotes
      }
    };
  }

  private sortFAQs(faqs: ExtendedFAQ[], sortBy: string): ExtendedFAQ[] {
    switch (sortBy) {
      case 'helpfulness':
        return faqs.sort((a, b) => b.helpfulness - a.helpfulness);
      case 'views':
        return faqs.sort((a, b) => b.views - a.views);
      case 'recent':
        return faqs.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      case 'alphabetical':
        return faqs.sort((a, b) => a.question.localeCompare(b.question));
      default:
        return faqs;
    }
  }

  private calculateRelevanceScore(faq: ExtendedFAQ, query: string, searchTerms: string[]): number {
    let score = 0;

    // Exact question match
    if (faq.question.toLowerCase().includes(query)) {
      score += 10;
    }

    // Answer match
    if (faq.answer.toLowerCase().includes(query)) {
      score += 5;
    }

    // Keyword matches
    const keywordMatches = faq.keywords.filter(keyword => 
      keyword.toLowerCase().includes(query)
    ).length;
    score += keywordMatches * 3;

    // Tag matches
    const tagMatches = faq.tags.filter(tag => 
      tag.toLowerCase().includes(query)
    ).length;
    score += tagMatches * 2;

    // Individual term matches
    searchTerms.forEach(term => {
      if (faq.question.toLowerCase().includes(term)) score += 2;
      if (faq.answer.toLowerCase().includes(term)) score += 1;
    });

    // Boost for official content
    if (faq.isOfficial) score += 1;

    // Boost for high helpfulness
    score += Math.min(faq.helpfulness / 10, 5);

    return score;
  }

  private updateSearchIndex(faq: ExtendedFAQ): void {
    const words = [
      ...faq.question.toLowerCase().split(/\W+/),
      ...faq.answer.toLowerCase().split(/\W+/),
      ...faq.keywords.map(k => k.toLowerCase()),
      ...faq.tags.map(t => t.toLowerCase())
    ].filter(word => word.length > 2);

    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(faq.id);
    });
  }

  private buildSearchIndex(): void {
    this.searchIndex.clear();
    this.extendedFAQs.forEach(faq => {
      this.updateSearchIndex(faq);
    });
  }

  private initializeCategories(): void {
    const categories: FAQCategory[] = [
      {
        id: 'getting_started',
        name: 'Getting Started',
        description: 'New to UpPaws? Start here for the basics',
        icon: '🚀',
        order: 1,
        isVisible: true,
        subcategories: []
      },
      {
        id: 'gameplay',
        name: 'Gameplay',
        description: 'How to play and master the game mechanics',
        icon: '🎮',
        order: 2,
        isVisible: true,
        subcategories: ['daily_puzzles', 'arcade_mode', 'battles']
      },
      {
        id: 'daily_puzzles',
        name: 'Daily Puzzles',
        description: 'Everything about daily animal puzzles',
        icon: '📅',
        order: 21,
        isVisible: true,
        parentCategory: 'gameplay',
        subcategories: []
      },
      {
        id: 'arcade_mode',
        name: 'Arcade Mode',
        description: 'Unlimited puzzle gameplay',
        icon: '🕹️',
        order: 22,
        isVisible: true,
        parentCategory: 'gameplay',
        subcategories: []
      },
      {
        id: 'battles',
        name: 'Animal Battles',
        description: 'Turn-based combat system',
        icon: '⚔️',
        order: 23,
        isVisible: true,
        parentCategory: 'gameplay',
        subcategories: []
      },
      {
        id: 'features',
        name: 'Features',
        description: 'Game features and systems',
        icon: '⭐',
        order: 3,
        isVisible: true,
        subcategories: ['collection', 'progression', 'social']
      },
      {
        id: 'collection',
        name: 'Animal Collection',
        description: 'Managing your animal collection',
        icon: '📚',
        order: 31,
        isVisible: true,
        parentCategory: 'features',
        subcategories: []
      },
      {
        id: 'progression',
        name: 'Progression & Rewards',
        description: 'Leveling up and earning rewards',
        icon: '📈',
        order: 32,
        isVisible: true,
        parentCategory: 'features',
        subcategories: []
      },
      {
        id: 'social',
        name: 'Social Features',
        description: 'Community and multiplayer features',
        icon: '👥',
        order: 33,
        isVisible: true,
        parentCategory: 'features',
        subcategories: []
      },
      {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        description: 'Common issues and solutions',
        icon: '🔧',
        order: 4,
        isVisible: true,
        subcategories: ['technical', 'account']
      },
      {
        id: 'technical',
        name: 'Technical Issues',
        description: 'Loading, performance, and browser issues',
        icon: '💻',
        order: 41,
        isVisible: true,
        parentCategory: 'troubleshooting',
        subcategories: []
      },
      {
        id: 'account',
        name: 'Account Issues',
        description: 'Profile and progress problems',
        icon: '👤',
        order: 42,
        isVisible: true,
        parentCategory: 'troubleshooting',
        subcategories: []
      }
    ];

    categories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  private initializeExtendedFAQs(): void {
    // Convert basic FAQs to extended FAQs and add more comprehensive ones
    const basicFAQs = this.supportSystem.getFAQs();
    
    basicFAQs.forEach(basicFAQ => {
      const extendedFAQ: ExtendedFAQ = {
        ...basicFAQ,
        difficulty: this.inferDifficulty(basicFAQ),
        tags: this.generateTags(basicFAQ),
        relatedFeatures: this.inferRelatedFeatures(basicFAQ),
        communityVotes: { helpful: Math.floor(basicFAQ.helpfulness * 0.8), notHelpful: Math.floor(basicFAQ.helpfulness * 0.2) },
        lastReviewed: new Date(),
        isOfficial: true,
        communitySubmitted: false
      };

      this.extendedFAQs.set(extendedFAQ.id, extendedFAQ);
    });

    // Add additional comprehensive FAQs
    this.addComprehensiveFAQs();
  }

  private addComprehensiveFAQs(): void {
    const additionalFAQs: Partial<ExtendedFAQ>[] = [
      {
        id: 'animal_trainer_basics',
        question: 'How do I become an Animal Trainer?',
        answer: 'Start by solving your first daily puzzle to capture your starter animal. As you progress, you\'ll unlock new habitats, learn about different animal types, and develop your training skills. Each captured animal can be trained, evolved, and used in battles.',
        category: 'getting_started',
        keywords: ['trainer', 'starter', 'begin', 'first steps'],
        difficulty: 'beginner',
        tags: ['trainer', 'basics', 'tutorial'],
        relatedFeatures: ['daily_puzzles', 'animal_collection', 'battles'],
        isOfficial: true,
        communitySubmitted: false
      },
      {
        id: 'habitat_exploration',
        question: 'How does habitat exploration work?',
        answer: 'Explore different biomes like forests, oceans, and mountains to discover new animals. Each habitat has unique weather patterns, encounter rates, and special events. Use your daily expedition attempts wisely and consider weather effects for better results.',
        category: 'features',
        keywords: ['habitat', 'exploration', 'biome', 'expedition'],
        difficulty: 'intermediate',
        tags: ['exploration', 'habitats', 'expeditions'],
        relatedFeatures: ['world_map', 'weather_system', 'daily_expeditions'],
        isOfficial: true,
        communitySubmitted: false
      },
      {
        id: 'battle_strategy',
        question: 'What are some effective battle strategies?',
        answer: 'Consider type effectiveness (water beats fire, air beats land, etc.), manage your animal\'s stamina, and use status effects strategically. Build balanced teams with different roles: attackers, defenders, and support animals. Learn each animal\'s unique moves and abilities.',
        category: 'battles',
        keywords: ['strategy', 'tactics', 'type effectiveness', 'team building'],
        difficulty: 'advanced',
        tags: ['strategy', 'combat', 'tactics'],
        relatedFeatures: ['battle_system', 'animal_types', 'moves'],
        isOfficial: true,
        communitySubmitted: false
      },
      {
        id: 'premium_benefits',
        question: 'What do I get with a Premium Trainer License?',
        answer: 'Premium trainers get expanded animal storage, access to exclusive habitats, accelerated training, priority matchmaking, and special cosmetic items. You also get bonus daily rewards and early access to new features.',
        category: 'features',
        keywords: ['premium', 'subscription', 'benefits', 'exclusive'],
        difficulty: 'beginner',
        tags: ['premium', 'subscription', 'benefits'],
        relatedFeatures: ['premium_system', 'exclusive_content', 'cosmetics'],
        isOfficial: true,
        communitySubmitted: false
      },
      {
        id: 'conservation_impact',
        question: 'How does playing UpPaws help real wildlife conservation?',
        answer: 'A portion of premium subscriptions goes to wildlife conservation organizations. Complete conservation missions, participate in citizen science projects, and learn about endangered species. Your gameplay directly contributes to real-world conservation efforts.',
        category: 'features',
        keywords: ['conservation', 'wildlife', 'donation', 'impact'],
        difficulty: 'intermediate',
        tags: ['conservation', 'wildlife', 'education'],
        relatedFeatures: ['conservation_missions', 'educational_partnerships', 'citizen_science'],
        isOfficial: true,
        communitySubmitted: false
      }
    ];

    additionalFAQs.forEach(faqData => {
      const faq: ExtendedFAQ = {
        id: faqData.id!,
        question: faqData.question!,
        answer: faqData.answer!,
        category: faqData.category!,
        keywords: faqData.keywords!,
        helpfulness: Math.floor(Math.random() * 30) + 70, // 70-100
        views: Math.floor(Math.random() * 200) + 50, // 50-250
        lastUpdated: new Date(),
        relatedArticles: [],
        difficulty: faqData.difficulty!,
        tags: faqData.tags!,
        relatedFeatures: faqData.relatedFeatures!,
        communityVotes: {
          helpful: Math.floor(Math.random() * 50) + 20,
          notHelpful: Math.floor(Math.random() * 10) + 2
        },
        lastReviewed: new Date(),
        isOfficial: faqData.isOfficial!,
        communitySubmitted: faqData.communitySubmitted!
      };

      this.extendedFAQs.set(faq.id, faq);
    });
  }

  private inferDifficulty(faq: FAQ): ExtendedFAQ['difficulty'] {
    const content = (faq.question + ' ' + faq.answer).toLowerCase();
    
    if (content.includes('advanced') || content.includes('strategy') || content.includes('complex')) {
      return 'advanced';
    } else if (content.includes('how to') || content.includes('getting started') || content.includes('basic')) {
      return 'beginner';
    } else {
      return 'intermediate';
    }
  }

  private generateTags(faq: FAQ): string[] {
    const tags: string[] = [];
    const content = (faq.question + ' ' + faq.answer).toLowerCase();

    // Common tag patterns
    const tagPatterns = [
      { pattern: /puzzle|daily/i, tag: 'puzzles' },
      { pattern: /score|point/i, tag: 'scoring' },
      { pattern: /streak/i, tag: 'streaks' },
      { pattern: /arcade/i, tag: 'arcade' },
      { pattern: /battle|fight/i, tag: 'battles' },
      { pattern: /animal|creature/i, tag: 'animals' },
      { pattern: /mobile|phone/i, tag: 'mobile' },
      { pattern: /sound|audio/i, tag: 'audio' },
      { pattern: /loading|performance/i, tag: 'technical' }
    ];

    tagPatterns.forEach(({ pattern, tag }) => {
      if (pattern.test(content)) {
        tags.push(tag);
      }
    });

    return tags;
  }

  private inferRelatedFeatures(faq: FAQ): string[] {
    const features: string[] = [];
    const content = (faq.question + ' ' + faq.answer).toLowerCase();

    const featurePatterns = [
      { pattern: /daily.*puzzle/i, feature: 'daily_puzzles' },
      { pattern: /arcade/i, feature: 'arcade_mode' },
      { pattern: /battle/i, feature: 'battle_system' },
      { pattern: /leaderboard/i, feature: 'leaderboards' },
      { pattern: /streak/i, feature: 'streak_system' },
      { pattern: /collection/i, feature: 'animal_collection' },
      { pattern: /habitat/i, feature: 'habitat_exploration' }
    ];

    featurePatterns.forEach(({ pattern, feature }) => {
      if (pattern.test(content)) {
        features.push(feature);
      }
    });

    return features;
  }
}