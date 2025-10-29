import { TrainerProfile } from '../types/trainer.js';
import { Currency, Item, Achievement } from '../types/common.js';
import { StrategyGuide, FanArtEntry, StrategyReward, FanArtReward } from './content-creation.js';

export interface CommunityRewardsSystem {
  evaluateStrategyGuide(guide: StrategyGuide): Promise<StrategyReward[]>;
  evaluateFanArt(fanArt: FanArtEntry): Promise<FanArtReward[]>;
  awardContentCreatorRewards(trainerId: string, contentType: ContentType, quality: ContentQuality): Promise<void>;
  calculateCommunityContribution(trainerId: string): Promise<CommunityContribution>;
}

export enum ContentType {
  STRATEGY_GUIDE = 'strategy_guide',
  FAN_ART = 'fan_art',
  BATTLE_REPLAY = 'battle_replay',
  COLLECTION_SHOWCASE = 'collection_showcase'
}

export enum ContentQuality {
  POOR = 'poor',
  AVERAGE = 'average',
  GOOD = 'good',
  EXCELLENT = 'excellent',
  OUTSTANDING = 'outstanding'
}

export interface CommunityContribution {
  totalContent: number;
  qualityScore: number;
  helpfulnessRating: number;
  communityImpact: number;
  rewards: CommunityReward[];
  recognition: CommunityRecognition[];
}

export interface CommunityReward {
  type: 'currency' | 'item' | 'achievement' | 'title' | 'cosmetic';
  value: any;
  reason: string;
  awardedAt: Date;
}

export interface CommunityRecognition {
  type: 'featured_creator' | 'helpful_contributor' | 'community_leader' | 'mentor';
  title: string;
  description: string;
  duration?: number; // in days, undefined for permanent
  awardedAt: Date;
}

export class CommunityRewardsManager implements CommunityRewardsSystem {
  private static instance: CommunityRewardsManager;
  private contributions: Map<string, CommunityContribution> = new Map();
  
  public static getInstance(): CommunityRewardsManager {
    if (!CommunityRewardsManager.instance) {
      CommunityRewardsManager.instance = new CommunityRewardsManager();
    }
    return CommunityRewardsManager.instance;
  }

  async evaluateStrategyGuide(guide: StrategyGuide): Promise<StrategyReward[]> {
    const rewards: StrategyReward[] = [];
    const quality = this.assessContentQuality(guide.rating, guide.views, guide.likes);
    
    // Base reward for publishing
    rewards.push({
      type: 'currency',
      value: { researchPoints: 50 },
      reason: 'Published strategy guide',
      awardedAt: new Date()
    });

    // Quality-based rewards
    switch (quality) {
      case ContentQuality.EXCELLENT:
        rewards.push({
          type: 'currency',
          value: { researchPoints: 200, pawCoins: 100 },
          reason: 'Excellent strategy guide quality',
          awardedAt: new Date()
        });
        rewards.push({
          type: 'achievement',
          value: { id: 'master_strategist', name: 'Master Strategist', description: 'Created an excellent strategy guide' },
          reason: 'High-quality content creation',
          awardedAt: new Date()
        });
        break;
      
      case ContentQuality.OUTSTANDING:
        rewards.push({
          type: 'currency',
          value: { researchPoints: 500, pawCoins: 250 },
          reason: 'Outstanding strategy guide',
          awardedAt: new Date()
        });
        rewards.push({
          type: 'item',
          value: { id: 'golden_pen', name: 'Golden Pen', description: 'A prestigious writing tool for master strategists' },
          reason: 'Outstanding content creation',
          awardedAt: new Date()
        });
        break;
    }

    // Milestone rewards
    if (guide.views > 1000) {
      rewards.push({
        type: 'recognition',
        value: 'Popular Content Creator',
        reason: 'Strategy guide reached 1000+ views',
        awardedAt: new Date()
      });
    }

    if (guide.likes > 100) {
      rewards.push({
        type: 'currency',
        value: { researchPoints: 100 },
        reason: 'Strategy guide received 100+ likes',
        awardedAt: new Date()
      });
    }

    return rewards;
  }

  async evaluateFanArt(fanArt: FanArtEntry): Promise<FanArtReward[]> {
    const rewards: FanArtReward[] = [];
    const quality = this.assessContentQuality(fanArt.rating, fanArt.views, fanArt.likes);
    
    // Base reward for submission
    rewards.push({
      type: 'currency',
      value: { pawCoins: 25 },
      reason: 'Submitted fan art',
      awardedAt: new Date()
    });

    // Quality-based rewards
    switch (quality) {
      case ContentQuality.GOOD:
        rewards.push({
          type: 'currency',
          value: { pawCoins: 75 },
          reason: 'Good quality fan art',
          awardedAt: new Date()
        });
        break;
      
      case ContentQuality.EXCELLENT:
        rewards.push({
          type: 'currency',
          value: { pawCoins: 150 },
          reason: 'Excellent fan art quality',
          awardedAt: new Date()
        });
        rewards.push({
          type: 'cosmetic',
          value: { id: 'artist_badge', name: 'Artist Badge', description: 'Shows your artistic talent' },
          reason: 'High-quality art creation',
          awardedAt: new Date()
        });
        break;
      
      case ContentQuality.OUTSTANDING:
        rewards.push({
          type: 'currency',
          value: { pawCoins: 300 },
          reason: 'Outstanding fan art',
          awardedAt: new Date()
        });
        rewards.push({
          type: 'cosmetic',
          value: { id: 'master_artist_frame', name: 'Master Artist Frame', description: 'Exclusive frame for exceptional artists' },
          reason: 'Outstanding artistic achievement',
          awardedAt: new Date()
        });
        break;
    }

    // Featured artwork bonus
    if (fanArt.featured) {
      rewards.push({
        type: 'currency',
        value: { pawCoins: 200, researchPoints: 50 },
        reason: 'Artwork featured by community',
        awardedAt: new Date()
      });
      rewards.push({
        type: 'recognition',
        value: 'Featured Artist',
        reason: 'Artwork selected for community showcase',
        awardedAt: new Date()
      });
    }

    return rewards;
  }

  async awardContentCreatorRewards(trainerId: string, contentType: ContentType, quality: ContentQuality): Promise<void> {
    const contribution = this.contributions.get(trainerId) || this.createDefaultContribution();
    
    // Update contribution stats
    contribution.totalContent++;
    contribution.qualityScore = this.updateQualityScore(contribution.qualityScore, quality);
    
    // Award based on content type and quality
    const reward = this.generateContentReward(contentType, quality);
    contribution.rewards.push(reward);
    
    // Check for recognition milestones
    const recognition = this.checkRecognitionMilestones(contribution);
    if (recognition) {
      contribution.recognition.push(recognition);
    }
    
    this.contributions.set(trainerId, contribution);
  }

  async calculateCommunityContribution(trainerId: string): Promise<CommunityContribution> {
    return this.contributions.get(trainerId) || this.createDefaultContribution();
  }

  private assessContentQuality(rating: number, views: number, likes: number): ContentQuality {
    const score = (rating * 0.4) + (Math.min(views / 100, 10) * 0.3) + (Math.min(likes / 50, 10) * 0.3);
    
    if (score >= 9) return ContentQuality.OUTSTANDING;
    if (score >= 7) return ContentQuality.EXCELLENT;
    if (score >= 5) return ContentQuality.GOOD;
    if (score >= 3) return ContentQuality.AVERAGE;
    return ContentQuality.POOR;
  }

  private createDefaultContribution(): CommunityContribution {
    return {
      totalContent: 0,
      qualityScore: 0,
      helpfulnessRating: 0,
      communityImpact: 0,
      rewards: [],
      recognition: []
    };
  }

  private updateQualityScore(currentScore: number, newQuality: ContentQuality): number {
    const qualityValues = {
      [ContentQuality.POOR]: 1,
      [ContentQuality.AVERAGE]: 3,
      [ContentQuality.GOOD]: 5,
      [ContentQuality.EXCELLENT]: 8,
      [ContentQuality.OUTSTANDING]: 10
    };
    
    const newValue = qualityValues[newQuality];
    return (currentScore + newValue) / 2; // Running average
  }

  private generateContentReward(contentType: ContentType, quality: ContentQuality): CommunityReward {
    const baseRewards = {
      [ContentType.STRATEGY_GUIDE]: { researchPoints: 50 },
      [ContentType.FAN_ART]: { pawCoins: 25 },
      [ContentType.BATTLE_REPLAY]: { battleTokens: 10 },
      [ContentType.COLLECTION_SHOWCASE]: { pawCoins: 30 }
    };

    const qualityMultipliers = {
      [ContentQuality.POOR]: 0.5,
      [ContentQuality.AVERAGE]: 1,
      [ContentQuality.GOOD]: 1.5,
      [ContentQuality.EXCELLENT]: 2.5,
      [ContentQuality.OUTSTANDING]: 4
    };

    const baseReward = baseRewards[contentType];
    const multiplier = qualityMultipliers[quality];
    
    const scaledReward: any = {};
    Object.entries(baseReward).forEach(([key, value]) => {
      scaledReward[key] = Math.floor(value * multiplier);
    });

    return {
      type: 'currency',
      value: scaledReward,
      reason: `${quality} ${contentType.replace('_', ' ')}`,
      awardedAt: new Date()
    };
  }

  private checkRecognitionMilestones(contribution: CommunityContribution): CommunityRecognition | null {
    // Check for various milestones
    if (contribution.totalContent === 10 && contribution.qualityScore >= 6) {
      return {
        type: 'helpful_contributor',
        title: 'Helpful Contributor',
        description: 'Created 10+ quality content pieces',
        awardedAt: new Date()
      };
    }

    if (contribution.totalContent === 25 && contribution.qualityScore >= 7) {
      return {
        type: 'community_leader',
        title: 'Community Leader',
        description: 'Exceptional contribution to the community',
        awardedAt: new Date()
      };
    }

    if (contribution.qualityScore >= 9) {
      return {
        type: 'featured_creator',
        title: 'Featured Creator',
        description: 'Consistently creates outstanding content',
        duration: 30, // 30 days
        awardedAt: new Date()
      };
    }

    return null;
  }

  // Public methods for retrieving community data
  getTopContributors(limit: number = 10): Array<{ trainerId: string, contribution: CommunityContribution }> {
    return Array.from(this.contributions.entries())
      .map(([trainerId, contribution]) => ({ trainerId, contribution }))
      .sort((a, b) => b.contribution.qualityScore - a.contribution.qualityScore)
      .slice(0, limit);
  }

  getFeaturedCreators(): Array<{ trainerId: string, contribution: CommunityContribution }> {
    return Array.from(this.contributions.entries())
      .map(([trainerId, contribution]) => ({ trainerId, contribution }))
      .filter(({ contribution }) => 
        contribution.recognition.some(r => r.type === 'featured_creator')
      );
  }

  getCommunityStats(): {
    totalContent: number,
    totalContributors: number,
    averageQuality: number,
    topCategories: Array<{ category: string, count: number }>
  } {
    const contributions = Array.from(this.contributions.values());
    
    return {
      totalContent: contributions.reduce((sum, c) => sum + c.totalContent, 0),
      totalContributors: contributions.length,
      averageQuality: contributions.reduce((sum, c) => sum + c.qualityScore, 0) / contributions.length,
      topCategories: [] // Would be calculated from actual content data
    };
  }
}