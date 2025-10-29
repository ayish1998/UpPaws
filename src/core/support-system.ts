/**
 * Customer Support System - Ticket management and user support
 * Provides comprehensive support tools for user assistance
 */

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  description: string;
  category: 'bug' | 'gameplay' | 'account' | 'payment' | 'feature_request' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  assignedTo?: string;
  tags: string[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  responses: SupportResponse[];
  metadata: {
    userAgent?: string;
    gameVersion?: string;
    platform?: string;
    sessionId?: string;
    errorLogs?: string[];
  };
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  authorId: string;
  authorType: 'user' | 'support' | 'system';
  content: string;
  isInternal: boolean;
  createdAt: Date;
  attachments: string[];
}

export interface SupportAgent {
  id: string;
  username: string;
  displayName: string;
  role: 'agent' | 'senior_agent' | 'supervisor' | 'admin';
  specializations: string[];
  isOnline: boolean;
  currentTickets: number;
  maxTickets: number;
  stats: {
    totalTickets: number;
    resolvedTickets: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  };
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  helpfulness: number;
  views: number;
  lastUpdated: Date;
  relatedArticles: string[];
}

export class SupportSystem {
  private static instance: SupportSystem;
  private tickets: Map<string, SupportTicket> = new Map();
  private agents: Map<string, SupportAgent> = new Map();
  private faqs: Map<string, FAQ> = new Map();
  private autoResponses: Map<string, string> = new Map();

  private constructor() {
    this.initializeFAQs();
    this.initializeAutoResponses();
  }

  static getInstance(): SupportSystem {
    if (!SupportSystem.instance) {
      SupportSystem.instance = new SupportSystem();
    }
    return SupportSystem.instance;
  }

  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: ticketData.userId || 'anonymous',
      username: ticketData.username || 'Anonymous User',
      subject: ticketData.subject || 'Support Request',
      description: ticketData.description || '',
      category: ticketData.category || 'other',
      priority: this.calculatePriority(ticketData),
      status: 'open',
      tags: ticketData.tags || [],
      attachments: ticketData.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: [],
      metadata: {
        userAgent: ticketData.metadata?.userAgent,
        gameVersion: ticketData.metadata?.gameVersion,
        platform: ticketData.metadata?.platform,
        sessionId: ticketData.metadata?.sessionId,
        errorLogs: ticketData.metadata?.errorLogs || []
      }
    };

    // Auto-assign if possible
    const assignedAgent = this.findBestAgent(ticket);
    if (assignedAgent) {
      ticket.assignedTo = assignedAgent.id;
      assignedAgent.currentTickets++;
    }

    // Add auto-response if applicable
    const autoResponse = this.getAutoResponse(ticket);
    if (autoResponse) {
      ticket.responses.push({
        id: `response_${Date.now()}`,
        ticketId: ticket.id,
        authorId: 'system',
        authorType: 'system',
        content: autoResponse,
        isInternal: false,
        createdAt: new Date(),
        attachments: []
      });
    }

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  /**
   * Get ticket by ID
   */
  getTicket(ticketId: string): SupportTicket | undefined {
    return this.tickets.get(ticketId);
  }

  /**
   * Get tickets by user
   */
  getUserTickets(userId: string): SupportTicket[] {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Add response to ticket
   */
  async addResponse(ticketId: string, response: Partial<SupportResponse>): Promise<boolean> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    const newResponse: SupportResponse = {
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      authorId: response.authorId || 'system',
      authorType: response.authorType || 'system',
      content: response.content || '',
      isInternal: response.isInternal || false,
      createdAt: new Date(),
      attachments: response.attachments || []
    };

    ticket.responses.push(newResponse);
    ticket.updatedAt = new Date();

    // Update status if user responds
    if (response.authorType === 'user' && ticket.status === 'waiting_user') {
      ticket.status = 'in_progress';
    }

    return true;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, status: SupportTicket['status'], agentId?: string): Promise<boolean> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date();

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
      
      // Free up agent
      if (ticket.assignedTo) {
        const agent = this.agents.get(ticket.assignedTo);
        if (agent) {
          agent.currentTickets = Math.max(0, agent.currentTickets - 1);
          agent.stats.resolvedTickets++;
        }
      }
    }

    // Add system response for status changes
    if (oldStatus !== status) {
      await this.addResponse(ticketId, {
        authorId: agentId || 'system',
        authorType: agentId ? 'support' : 'system',
        content: `Ticket status changed from ${oldStatus} to ${status}`,
        isInternal: false
      });
    }

    return true;
  }

  /**
   * Search tickets
   */
  searchTickets(query: string, filters?: {
    status?: SupportTicket['status'][];
    category?: SupportTicket['category'][];
    priority?: SupportTicket['priority'][];
    assignedTo?: string;
  }): SupportTicket[] {
    const queryLower = query.toLowerCase();
    
    return Array.from(this.tickets.values())
      .filter(ticket => {
        // Text search
        const textMatch = !query || 
          ticket.subject.toLowerCase().includes(queryLower) ||
          ticket.description.toLowerCase().includes(queryLower) ||
          ticket.username.toLowerCase().includes(queryLower) ||
          ticket.tags.some(tag => tag.toLowerCase().includes(queryLower));

        // Filter by status
        const statusMatch = !filters?.status || filters.status.includes(ticket.status);
        
        // Filter by category
        const categoryMatch = !filters?.category || filters.category.includes(ticket.category);
        
        // Filter by priority
        const priorityMatch = !filters?.priority || filters.priority.includes(ticket.priority);
        
        // Filter by assigned agent
        const assignedMatch = !filters?.assignedTo || ticket.assignedTo === filters.assignedTo;

        return textMatch && statusMatch && categoryMatch && priorityMatch && assignedMatch;
      })
      .sort((a, b) => {
        // Sort by priority first, then by creation date
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  /**
   * Get FAQ by category
   */
  getFAQs(category?: string): FAQ[] {
    const faqs = Array.from(this.faqs.values());
    
    if (category) {
      return faqs.filter(faq => faq.category === category);
    }
    
    return faqs.sort((a, b) => b.helpfulness - a.helpfulness);
  }

  /**
   * Search FAQs
   */
  searchFAQs(query: string): FAQ[] {
    const queryLower = query.toLowerCase();
    
    return Array.from(this.faqs.values())
      .filter(faq => 
        faq.question.toLowerCase().includes(queryLower) ||
        faq.answer.toLowerCase().includes(queryLower) ||
        faq.keywords.some(keyword => keyword.toLowerCase().includes(queryLower))
      )
      .sort((a, b) => b.helpfulness - a.helpfulness);
  }

  /**
   * Rate FAQ helpfulness
   */
  rateFAQ(faqId: string, helpful: boolean): boolean {
    const faq = this.faqs.get(faqId);
    if (!faq) return false;

    faq.helpfulness += helpful ? 1 : -1;
    faq.views++;
    
    return true;
  }

  /**
   * Get support statistics
   */
  getSupportStats(): {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    averageResponseTime: number;
    ticketsByCategory: Record<string, number>;
    ticketsByPriority: Record<string, number>;
    agentPerformance: Array<{
      agentId: string;
      name: string;
      ticketsHandled: number;
      averageResponseTime: number;
      satisfaction: number;
    }>;
  } {
    const tickets = Array.from(this.tickets.values());
    
    const stats = {
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => ['open', 'in_progress', 'waiting_user'].includes(t.status)).length,
      resolvedTickets: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
      averageResponseTime: this.calculateAverageResponseTime(tickets),
      ticketsByCategory: {} as Record<string, number>,
      ticketsByPriority: {} as Record<string, number>,
      agentPerformance: Array.from(this.agents.values()).map(agent => ({
        agentId: agent.id,
        name: agent.displayName,
        ticketsHandled: agent.stats.totalTickets,
        averageResponseTime: agent.stats.averageResponseTime,
        satisfaction: agent.stats.customerSatisfaction
      }))
    };

    // Count by category
    tickets.forEach(ticket => {
      stats.ticketsByCategory[ticket.category] = (stats.ticketsByCategory[ticket.category] || 0) + 1;
    });

    // Count by priority
    tickets.forEach(ticket => {
      stats.ticketsByPriority[ticket.priority] = (stats.ticketsByPriority[ticket.priority] || 0) + 1;
    });

    return stats;
  }

  private calculatePriority(ticketData: Partial<SupportTicket>): SupportTicket['priority'] {
    // Auto-calculate priority based on category and keywords
    const category = ticketData.category;
    const description = (ticketData.description || '').toLowerCase();
    
    // Urgent keywords
    const urgentKeywords = ['crash', 'error', 'broken', 'not working', 'lost progress', 'payment issue'];
    if (urgentKeywords.some(keyword => description.includes(keyword))) {
      return 'urgent';
    }
    
    // High priority categories
    if (category === 'bug' || category === 'payment') {
      return 'high';
    }
    
    // Medium priority for gameplay issues
    if (category === 'gameplay' || category === 'account') {
      return 'medium';
    }
    
    return 'low';
  }

  private findBestAgent(ticket: SupportTicket): SupportAgent | undefined {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => 
        agent.isOnline && 
        agent.currentTickets < agent.maxTickets &&
        (agent.specializations.length === 0 || agent.specializations.includes(ticket.category))
      )
      .sort((a, b) => a.currentTickets - b.currentTickets);

    return availableAgents[0];
  }

  private getAutoResponse(ticket: SupportTicket): string | undefined {
    const category = ticket.category;
    const description = ticket.description.toLowerCase();

    // Check for common issues
    if (description.includes('loading') || description.includes('not loading')) {
      return this.autoResponses.get('loading_issues');
    }
    
    if (description.includes('sound') || description.includes('audio')) {
      return this.autoResponses.get('audio_issues');
    }
    
    if (category === 'gameplay') {
      return this.autoResponses.get('gameplay_general');
    }
    
    return this.autoResponses.get('general_acknowledgment');
  }

  private calculateAverageResponseTime(tickets: SupportTicket[]): number {
    const responseTimes: number[] = [];
    
    tickets.forEach(ticket => {
      if (ticket.responses.length > 1) {
        const firstResponse = ticket.responses.find(r => r.authorType === 'support');
        if (firstResponse) {
          const responseTime = firstResponse.createdAt.getTime() - ticket.createdAt.getTime();
          responseTimes.push(responseTime);
        }
      }
    });
    
    if (responseTimes.length === 0) return 0;
    
    const averageMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(averageMs / (1000 * 60)); // Convert to minutes
  }

  private initializeFAQs(): void {
    const faqs: FAQ[] = [
      {
        id: 'faq_daily_puzzle',
        question: 'How do daily puzzles work?',
        answer: 'A new animal puzzle is released every day at midnight UTC. You can only earn points from each daily puzzle once, but you can replay it for fun. Points are awarded based on solving speed and whether you used hints.',
        category: 'gameplay',
        keywords: ['daily', 'puzzle', 'points', 'scoring', 'midnight', 'UTC'],
        helpfulness: 25,
        views: 150,
        lastUpdated: new Date(),
        relatedArticles: ['faq_scoring', 'faq_streaks']
      },
      {
        id: 'faq_scoring',
        question: 'How does the scoring system work?',
        answer: 'You earn 5 base points for solving daily puzzles correctly. Time bonuses up to 5 additional points are awarded for quick solutions. Using hints deducts 2 points. Arcade mode has separate scoring with combo multipliers.',
        category: 'gameplay',
        keywords: ['scoring', 'points', 'time bonus', 'hints', 'arcade', 'combo'],
        helpfulness: 30,
        views: 200,
        lastUpdated: new Date(),
        relatedArticles: ['faq_daily_puzzle', 'faq_arcade_mode']
      },
      {
        id: 'faq_arcade_mode',
        question: 'What is Arcade Mode?',
        answer: 'Arcade Mode offers unlimited puzzles with increasing difficulty. You start with 3 lives and can earn more through power-ups. Each correct answer increases your combo multiplier for higher scores.',
        category: 'features',
        keywords: ['arcade', 'unlimited', 'lives', 'difficulty', 'combo', 'multiplier'],
        helpfulness: 20,
        views: 120,
        lastUpdated: new Date(),
        relatedArticles: ['faq_scoring', 'faq_power_ups']
      },
      {
        id: 'faq_streaks',
        question: 'How do daily streaks work?',
        answer: 'Daily streaks count consecutive days you solve the daily puzzle. Your streak increases by 1 each day you participate. Missing a day resets your streak to 0. Longer streaks unlock special rewards and recognition.',
        category: 'features',
        keywords: ['streaks', 'consecutive', 'daily', 'rewards', 'recognition'],
        helpfulness: 18,
        views: 95,
        lastUpdated: new Date(),
        relatedArticles: ['faq_daily_puzzle', 'faq_achievements']
      },
      {
        id: 'faq_loading_issues',
        question: 'The game won\'t load. What should I do?',
        answer: 'Try refreshing the page first. If that doesn\'t work, clear your browser cache and cookies. Make sure you have a stable internet connection. If problems persist, try a different browser or device.',
        category: 'troubleshooting',
        keywords: ['loading', 'refresh', 'cache', 'cookies', 'browser', 'internet'],
        helpfulness: 35,
        views: 300,
        lastUpdated: new Date(),
        relatedArticles: ['faq_browser_support', 'faq_performance']
      },
      {
        id: 'faq_sound_issues',
        question: 'I can\'t hear any sound effects. How do I fix this?',
        answer: 'Check that the sound toggle button (speaker icon) in the top right is enabled. Verify your device volume is up and not muted. Some browsers require user interaction before playing audio, so try clicking in the game area first.',
        category: 'troubleshooting',
        keywords: ['sound', 'audio', 'mute', 'volume', 'speaker', 'browser'],
        helpfulness: 22,
        views: 180,
        lastUpdated: new Date(),
        relatedArticles: ['faq_browser_support']
      },
      {
        id: 'faq_mobile_controls',
        question: 'How do I play on mobile devices?',
        answer: 'On mobile, tap letters to add them to your answer and tap answer slots to remove letters. All buttons are optimized for touch. The game works in both portrait and landscape orientations.',
        category: 'features',
        keywords: ['mobile', 'touch', 'tap', 'portrait', 'landscape', 'controls'],
        helpfulness: 15,
        views: 85,
        lastUpdated: new Date(),
        relatedArticles: ['faq_browser_support']
      },
      {
        id: 'faq_leaderboards',
        question: 'How do leaderboards work?',
        answer: 'There are three leaderboards: Daily scores (total points from daily puzzles), Arcade high scores (best arcade run), and Longest streaks (consecutive daily participation). Rankings update in real-time.',
        category: 'features',
        keywords: ['leaderboards', 'rankings', 'daily', 'arcade', 'streaks', 'real-time'],
        helpfulness: 12,
        views: 70,
        lastUpdated: new Date(),
        relatedArticles: ['faq_scoring', 'faq_streaks']
      }
    ];

    faqs.forEach(faq => {
      this.faqs.set(faq.id, faq);
    });
  }

  private initializeAutoResponses(): void {
    this.autoResponses.set('general_acknowledgment', 
      'Thank you for contacting UpPaws support! We\'ve received your request and will respond as soon as possible. In the meantime, you might find our FAQ helpful for common questions.'
    );

    this.autoResponses.set('loading_issues',
      'Thanks for reporting the loading issue. Please try refreshing the page and clearing your browser cache. If the problem persists, let us know your browser version and any error messages you see.'
    );

    this.autoResponses.set('audio_issues',
      'For sound issues, please check that the speaker button in the game is enabled and your device volume is up. Some browsers require user interaction before playing audio. Try clicking in the game area first.'
    );

    this.autoResponses.set('gameplay_general',
      'Thanks for your gameplay question! Check our in-game help system (? button) for detailed guides. If you need specific assistance, please provide more details about what you\'re trying to do.'
    );
  }
}