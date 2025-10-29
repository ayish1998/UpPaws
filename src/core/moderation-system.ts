/**
 * Community Moderation System - Content filtering and community management
 * Provides automated and manual moderation tools for community safety
 */

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type: 'content_filter' | 'behavior_monitor' | 'spam_detection' | 'custom';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'warn' | 'mute' | 'temp_ban' | 'permanent_ban' | 'content_removal' | 'manual_review';
  conditions: {
    keywords?: string[];
    patterns?: string[];
    frequency?: number;
    timeWindow?: number; // minutes
    userLevel?: number;
    reportThreshold?: number;
  };
  exceptions: string[]; // User IDs or roles exempt from this rule
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationAction {
  id: string;
  ruleId?: string;
  moderatorId: string;
  targetUserId: string;
  targetUsername: string;
  action: 'warn' | 'mute' | 'temp_ban' | 'permanent_ban' | 'content_removal' | 'manual_review';
  reason: string;
  evidence: {
    contentId?: string;
    content?: string;
    screenshots?: string[];
    reportIds?: string[];
  };
  duration?: number; // minutes for temporary actions
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  appealable: boolean;
  appealed: boolean;
  appealReason?: string;
  appealedAt?: Date;
  appealResolvedAt?: Date;
  appealResolution?: 'upheld' | 'overturned' | 'modified';
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetUserId: string;
  targetUsername: string;
  category: 'harassment' | 'spam' | 'inappropriate_content' | 'cheating' | 'impersonation' | 'other';
  description: string;
  evidence: {
    contentId?: string;
    content?: string;
    screenshots?: string[];
    chatLogs?: string[];
  };
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
  moderatorNotes: string[];
}

export interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  activeActions: number;
  ruleViolations: Record<string, number>;
  moderatorActivity: Record<string, number>;
  appealStats: {
    total: number;
    upheld: number;
    overturned: number;
    pending: number;
  };
}

export class ModerationSystem {
  private static instance: ModerationSystem;
  private rules: Map<string, ModerationRule> = new Map();
  private actions: Map<string, ModerationAction> = new Map();
  private reports: Map<string, UserReport> = new Map();
  private userViolations: Map<string, number> = new Map();
  private contentCache: Map<string, { content: string; timestamp: number }> = new Map();

  private constructor() {
    this.initializeDefaultRules();
    this.startAutomaticCleanup();
  }

  static getInstance(): ModerationSystem {
    if (!ModerationSystem.instance) {
      ModerationSystem.instance = new ModerationSystem();
    }
    return ModerationSystem.instance;
  }

  /**
   * Check content against moderation rules
   */
  async moderateContent(content: string, userId: string, contentType: 'chat' | 'post' | 'comment' | 'username'): Promise<{
    allowed: boolean;
    violations: string[];
    action?: ModerationAction;
    filteredContent?: string;
  }> {
    const violations: string[] = [];
    let filteredContent = content;
    let mostSevereAction: ModerationAction | undefined;

    // Check against all active rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const violation = this.checkRule(content, userId, rule, contentType);
      if (violation) {
        violations.push(rule.name);

        // Apply content filtering
        if (rule.type === 'content_filter' && rule.conditions.keywords) {
          filteredContent = this.filterContent(filteredContent, rule.conditions.keywords);
        }

        // Determine if action should be taken
        if (this.shouldTakeAction(rule, userId)) {
          const action = await this.executeRule(rule, userId, content, contentType);
          if (action && (!mostSevereAction || this.getActionSeverity(action.action) > this.getActionSeverity(mostSevereAction.action))) {
            mostSevereAction = action;
          }
        }
      }
    }

    return {
      allowed: violations.length === 0 || !mostSevereAction || mostSevereAction.action === 'warn',
      violations,
      action: mostSevereAction,
      filteredContent: violations.length > 0 ? filteredContent : undefined
    };
  }

  /**
   * Submit a user report
   */
  async submitReport(report: Partial<UserReport>): Promise<UserReport> {
    const newReport: UserReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reporterId: report.reporterId || 'anonymous',
      reporterUsername: report.reporterUsername || 'Anonymous',
      targetUserId: report.targetUserId || '',
      targetUsername: report.targetUsername || '',
      category: report.category || 'other',
      description: report.description || '',
      evidence: report.evidence || {},
      status: 'pending',
      priority: this.calculateReportPriority(report),
      createdAt: new Date(),
      moderatorNotes: []
    };

    // Auto-assign to available moderator
    const availableModerator = this.findAvailableModerator();
    if (availableModerator) {
      newReport.assignedTo = availableModerator;
    }

    this.reports.set(newReport.id, newReport);

    // Check if this triggers automatic action
    await this.checkReportThresholds(newReport.targetUserId);

    return newReport;
  }

  /**
   * Process a report
   */
  async processReport(reportId: string, moderatorId: string, resolution: 'dismiss' | 'warn' | 'action', actionType?: ModerationAction['action'], reason?: string): Promise<boolean> {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.status = 'resolved';
    report.resolvedAt = new Date();
    report.resolution = reason || 'Processed by moderator';
    report.moderatorNotes.push(`Resolved by ${moderatorId}: ${resolution}`);

    if (resolution === 'action' && actionType) {
      await this.createModerationAction({
        moderatorId,
        targetUserId: report.targetUserId,
        targetUsername: report.targetUsername,
        action: actionType,
        reason: reason || `Report violation: ${report.category}`,
        evidence: {
          reportIds: [reportId],
          content: report.evidence.content,
          screenshots: report.evidence.screenshots
        }
      });
    }

    return true;
  }

  /**
   * Create a moderation action
   */
  async createModerationAction(actionData: Partial<ModerationAction>): Promise<ModerationAction> {
    const action: ModerationAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      moderatorId: actionData.moderatorId || 'system',
      targetUserId: actionData.targetUserId || '',
      targetUsername: actionData.targetUsername || '',
      action: actionData.action || 'warn',
      reason: actionData.reason || 'Moderation action',
      evidence: actionData.evidence || {},
      duration: actionData.duration,
      isActive: true,
      createdAt: new Date(),
      appealable: ['temp_ban', 'permanent_ban', 'mute'].includes(actionData.action || 'warn'),
      appealed: false
    };

    // Set expiration for temporary actions
    if (action.duration && ['temp_ban', 'mute'].includes(action.action)) {
      action.expiresAt = new Date(Date.now() + action.duration * 60 * 1000);
    }

    this.actions.set(action.id, action);

    // Update user violation count
    const currentViolations = this.userViolations.get(action.targetUserId) || 0;
    this.userViolations.set(action.targetUserId, currentViolations + 1);

    return action;
  }

  /**
   * Appeal a moderation action
   */
  async appealAction(actionId: string, userId: string, reason: string): Promise<boolean> {
    const action = this.actions.get(actionId);
    if (!action || action.targetUserId !== userId || !action.appealable || action.appealed) {
      return false;
    }

    action.appealed = true;
    action.appealReason = reason;
    action.appealedAt = new Date();

    return true;
  }

  /**
   * Process an appeal
   */
  async processAppeal(actionId: string, moderatorId: string, resolution: 'upheld' | 'overturned' | 'modified', newDuration?: number): Promise<boolean> {
    const action = this.actions.get(actionId);
    if (!action || !action.appealed) return false;

    action.appealResolution = resolution;
    action.appealResolvedAt = new Date();

    switch (resolution) {
      case 'overturned':
        action.isActive = false;
        break;
      case 'modified':
        if (newDuration !== undefined) {
          action.duration = newDuration;
          action.expiresAt = new Date(Date.now() + newDuration * 60 * 1000);
        }
        break;
      // 'upheld' keeps the action as-is
    }

    return true;
  }

  /**
   * Check if user is currently restricted
   */
  getUserRestrictions(userId: string): {
    isBanned: boolean;
    isMuted: boolean;
    restrictions: ModerationAction[];
    violationCount: number;
  } {
    const now = new Date();
    const activeActions = Array.from(this.actions.values())
      .filter(action => 
        action.targetUserId === userId && 
        action.isActive && 
        (!action.expiresAt || action.expiresAt > now)
      );

    return {
      isBanned: activeActions.some(action => ['temp_ban', 'permanent_ban'].includes(action.action)),
      isMuted: activeActions.some(action => action.action === 'mute'),
      restrictions: activeActions,
      violationCount: this.userViolations.get(userId) || 0
    };
  }

  /**
   * Get moderation statistics
   */
  getModerationStats(): ModerationStats {
    const reports = Array.from(this.reports.values());
    const actions = Array.from(this.actions.values());

    const ruleViolations: Record<string, number> = {};
    actions.forEach(action => {
      if (action.ruleId) {
        const rule = this.rules.get(action.ruleId);
        if (rule) {
          ruleViolations[rule.name] = (ruleViolations[rule.name] || 0) + 1;
        }
      }
    });

    const moderatorActivity: Record<string, number> = {};
    actions.forEach(action => {
      moderatorActivity[action.moderatorId] = (moderatorActivity[action.moderatorId] || 0) + 1;
    });

    const appeals = actions.filter(action => action.appealed);

    return {
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      resolvedReports: reports.filter(r => r.status === 'resolved').length,
      activeActions: actions.filter(a => a.isActive).length,
      ruleViolations,
      moderatorActivity,
      appealStats: {
        total: appeals.length,
        upheld: appeals.filter(a => a.appealResolution === 'upheld').length,
        overturned: appeals.filter(a => a.appealResolution === 'overturned').length,
        pending: appeals.filter(a => !a.appealResolution).length
      }
    };
  }

  /**
   * Get pending reports for moderation queue
   */
  getPendingReports(moderatorId?: string): UserReport[] {
    return Array.from(this.reports.values())
      .filter(report => 
        report.status === 'pending' && 
        (!moderatorId || !report.assignedTo || report.assignedTo === moderatorId)
      )
      .sort((a, b) => {
        // Sort by priority first, then by creation date
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  /**
   * Add or update moderation rule
   */
  addRule(rule: Partial<ModerationRule>): ModerationRule {
    const newRule: ModerationRule = {
      id: rule.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: rule.name || 'New Rule',
      description: rule.description || '',
      type: rule.type || 'custom',
      enabled: rule.enabled !== false,
      severity: rule.severity || 'medium',
      action: rule.action || 'warn',
      conditions: rule.conditions || {},
      exceptions: rule.exceptions || [],
      createdAt: rule.createdAt || new Date(),
      updatedAt: new Date()
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Remove moderation rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get all moderation rules
   */
  getRules(): ModerationRule[] {
    return Array.from(this.rules.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private checkRule(content: string, userId: string, rule: ModerationRule, contentType: string): boolean {
    // Check exceptions
    if (rule.exceptions.includes(userId)) return false;

    const conditions = rule.conditions;
    const contentLower = content.toLowerCase();

    // Keyword matching
    if (conditions.keywords && conditions.keywords.length > 0) {
      const hasKeyword = conditions.keywords.some(keyword => 
        contentLower.includes(keyword.toLowerCase())
      );
      if (hasKeyword) return true;
    }

    // Pattern matching (regex)
    if (conditions.patterns && conditions.patterns.length > 0) {
      const hasPattern = conditions.patterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(content);
        } catch {
          return false;
        }
      });
      if (hasPattern) return true;
    }

    // Frequency checking (spam detection)
    if (conditions.frequency && conditions.timeWindow) {
      const recentContent = this.getRecentUserContent(userId, conditions.timeWindow);
      if (recentContent.length >= conditions.frequency) return true;
    }

    return false;
  }

  private shouldTakeAction(rule: ModerationRule, userId: string): boolean {
    // Always take action for critical severity
    if (rule.severity === 'critical') return true;

    // Check user violation history
    const violations = this.userViolations.get(userId) || 0;
    
    // Escalate based on violation count
    switch (rule.severity) {
      case 'high':
        return violations >= 0; // Always act on high severity
      case 'medium':
        return violations >= 1; // Act after first violation
      case 'low':
        return violations >= 3; // Act after multiple violations
      default:
        return false;
    }
  }

  private async executeRule(rule: ModerationRule, userId: string, content: string, contentType: string): Promise<ModerationAction | undefined> {
    if (rule.action === 'manual_review') {
      // Create a report for manual review
      await this.submitReport({
        reporterId: 'system',
        reporterUsername: 'Automated System',
        targetUserId: userId,
        category: 'inappropriate_content',
        description: `Automated rule violation: ${rule.name}`,
        evidence: { content }
      });
      return undefined;
    }

    // Create moderation action
    return await this.createModerationAction({
      ruleId: rule.id,
      moderatorId: 'system',
      targetUserId: userId,
      action: rule.action,
      reason: `Automated rule violation: ${rule.name}`,
      evidence: { content },
      duration: this.getDefaultDuration(rule.action)
    });
  }

  private filterContent(content: string, keywords: string[]): string {
    let filtered = content;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(keyword.length));
    });
    
    return filtered;
  }

  private getActionSeverity(action: ModerationAction['action']): number {
    const severityMap = {
      'warn': 1,
      'content_removal': 2,
      'mute': 3,
      'temp_ban': 4,
      'permanent_ban': 5,
      'manual_review': 0
    };
    return severityMap[action] || 0;
  }

  private calculateReportPriority(report: Partial<UserReport>): UserReport['priority'] {
    // High priority categories
    if (['harassment', 'cheating'].includes(report.category || '')) {
      return 'high';
    }
    
    // Check if target user has multiple recent reports
    const recentReports = Array.from(this.reports.values())
      .filter(r => 
        r.targetUserId === report.targetUserId && 
        r.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );
    
    if (recentReports.length >= 3) {
      return 'urgent';
    } else if (recentReports.length >= 2) {
      return 'high';
    }
    
    return 'medium';
  }

  private findAvailableModerator(): string | undefined {
    // This would integrate with a moderator management system
    // For now, return a placeholder
    return 'moderator_1';
  }

  private async checkReportThresholds(userId: string): Promise<void> {
    const recentReports = Array.from(this.reports.values())
      .filter(r => 
        r.targetUserId === userId && 
        r.status === 'pending' &&
        r.createdAt > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      );

    // Auto-action if threshold reached
    if (recentReports.length >= 5) {
      await this.createModerationAction({
        moderatorId: 'system',
        targetUserId: userId,
        action: 'temp_ban',
        reason: 'Multiple reports received',
        duration: 60, // 1 hour
        evidence: {
          reportIds: recentReports.map(r => r.id)
        }
      });
    }
  }

  private getRecentUserContent(userId: string, timeWindowMinutes: number): string[] {
    const cutoff = Date.now() - (timeWindowMinutes * 60 * 1000);
    
    return Array.from(this.contentCache.entries())
      .filter(([key, data]) => 
        key.startsWith(userId) && 
        data.timestamp > cutoff
      )
      .map(([, data]) => data.content);
  }

  private getDefaultDuration(action: ModerationAction['action']): number | undefined {
    switch (action) {
      case 'mute':
        return 60; // 1 hour
      case 'temp_ban':
        return 24 * 60; // 24 hours
      default:
        return undefined;
    }
  }

  private initializeDefaultRules(): void {
    const defaultRules: Partial<ModerationRule>[] = [
      {
        name: 'Profanity Filter',
        description: 'Filters common profanity and inappropriate language',
        type: 'content_filter',
        severity: 'medium',
        action: 'warn',
        conditions: {
          keywords: ['damn', 'hell', 'crap', 'stupid', 'idiot'] // Basic list - would be more comprehensive
        }
      },
      {
        name: 'Spam Detection',
        description: 'Detects repetitive or excessive posting',
        type: 'spam_detection',
        severity: 'high',
        action: 'mute',
        conditions: {
          frequency: 5,
          timeWindow: 5 // 5 messages in 5 minutes
        }
      },
      {
        name: 'Harassment Prevention',
        description: 'Detects potential harassment language',
        type: 'behavior_monitor',
        severity: 'high',
        action: 'manual_review',
        conditions: {
          keywords: ['kill yourself', 'kys', 'die', 'hate you', 'loser', 'pathetic']
        }
      },
      {
        name: 'External Links',
        description: 'Monitors external links for safety',
        type: 'content_filter',
        severity: 'medium',
        action: 'manual_review',
        conditions: {
          patterns: ['http[s]?://(?!reddit\\.com|imgur\\.com)[\\w\\.-]+']
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.addRule(rule);
    });
  }

  private startAutomaticCleanup(): void {
    // Clean up expired actions every hour
    setInterval(() => {
      const now = new Date();
      
      this.actions.forEach((action, id) => {
        if (action.expiresAt && action.expiresAt <= now && action.isActive) {
          action.isActive = false;
        }
      });

      // Clean up old content cache (older than 24 hours)
      const cutoff = Date.now() - (24 * 60 * 60 * 1000);
      this.contentCache.forEach((data, key) => {
        if (data.timestamp < cutoff) {
          this.contentCache.delete(key);
        }
      });
    }, 60 * 60 * 1000); // Every hour
  }
}