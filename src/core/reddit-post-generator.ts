import { BattleReplay, CollectionShowcase, AchievementPost, RedditPost, RedditPostType } from '../types/reddit-integration.js';
import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';

export interface RedditPostGenerator {
  generateBattleReplayPost(replay: BattleReplay, trainer: TrainerProfile): Promise<RedditPost>;
  generateCollectionShowcasePost(showcase: CollectionShowcase, trainer: TrainerProfile): Promise<RedditPost>;
  generateAchievementPost(achievement: AchievementPost, trainer: TrainerProfile): Promise<RedditPost>;
  generateInfographic(data: InfographicData): Promise<string>;
}

export interface InfographicData {
  type: 'collection' | 'achievement' | 'battle_stats' | 'trainer_profile';
  title: string;
  data: any;
  style: InfographicStyle;
}

export interface InfographicStyle {
  theme: 'light' | 'dark' | 'colorful';
  primaryColor: string;
  secondaryColor: string;
  layout: 'grid' | 'list' | 'circular' | 'timeline';
}

export class AutoRedditPostGenerator implements RedditPostGenerator {
  private static instance: AutoRedditPostGenerator;
  
  public static getInstance(): AutoRedditPostGenerator {
    if (!AutoRedditPostGenerator.instance) {
      AutoRedditPostGenerator.instance = new AutoRedditPostGenerator();
    }
    return AutoRedditPostGenerator.instance;
  }

  async generateBattleReplayPost(replay: BattleReplay, trainer: TrainerProfile): Promise<RedditPost> {
    const title = this.generateBattleReplayTitle(replay);
    const content = this.generateBattleReplayContent(replay, trainer);
    
    return {
      id: `post_${replay.id}_${Date.now()}`,
      title,
      content,
      subredditId: '', // Would be determined by context
      authorId: trainer.trainerId,
      authorUsername: trainer.username,
      postType: RedditPostType.BATTLE_REPLAY,
      metadata: {
        trainerId: trainer.trainerId,
        battleId: replay.battleId,
        customData: {
          replayUrl: replay.shareableUrl,
          duration: replay.duration,
          highlights: replay.highlights.length
        }
      },
      createdAt: new Date(),
      upvotes: 0,
      comments: 0,
      url: replay.shareableUrl
    };
  }

  async generateCollectionShowcasePost(showcase: CollectionShowcase, trainer: TrainerProfile): Promise<RedditPost> {
    const title = this.generateShowcaseTitle(showcase);
    const content = await this.generateShowcaseContent(showcase, trainer);
    
    return {
      id: `post_${showcase.id}_${Date.now()}`,
      title,
      content,
      subredditId: '',
      authorId: trainer.trainerId,
      authorUsername: trainer.username,
      postType: RedditPostType.COLLECTION_SHOWCASE,
      metadata: {
        trainerId: trainer.trainerId,
        animals: showcase.animals,
        customData: {
          category: showcase.category,
          totalAnimals: showcase.stats.totalAnimals,
          averageLevel: showcase.stats.averageLevel
        }
      },
      createdAt: new Date(),
      upvotes: 0,
      comments: 0
    };
  }

  async generateAchievementPost(achievement: AchievementPost, trainer: TrainerProfile): Promise<RedditPost> {
    const title = `🎉 ${trainer.username} unlocked: ${achievement.achievementName}!`;
    const content = this.generateAchievementContent(achievement, trainer);
    
    return {
      id: `post_${achievement.achievementId}_${Date.now()}`,
      title,
      content,
      subredditId: '',
      authorId: trainer.trainerId,
      authorUsername: trainer.username,
      postType: RedditPostType.ACHIEVEMENT_SHARE,
      metadata: {
        trainerId: trainer.trainerId,
        achievementId: achievement.achievementId,
        customData: {
          rarity: achievement.rarity,
          unlockedAt: achievement.unlockedAt
        }
      },
      createdAt: new Date(),
      upvotes: 0,
      comments: 0
    };
  }

  async generateInfographic(data: InfographicData): Promise<string> {
    // Generate SVG-based infographic
    const svg = this.createInfographicSVG(data);
    
    // In a real implementation, this would:
    // 1. Generate the actual SVG/image
    // 2. Upload to image hosting service
    // 3. Return the URL
    
    return `https://uppaws.reddit.com/infographic/${Date.now()}.svg`;
  }

  private generateBattleReplayTitle(replay: BattleReplay): string {
    const templates = [
      `🔥 Epic ${replay.duration}s Battle Replay - ${replay.highlights.length} Amazing Moments!`,
      `⚔️ Intense Battle: ${replay.title}`,
      `🏆 Victory Replay: ${replay.duration} seconds of pure action!`,
      `💥 Must-Watch Battle: ${replay.highlights.length} incredible highlights!`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateBattleReplayContent(replay: BattleReplay, trainer: TrainerProfile): string {
    return `
**Battle Summary**
- Duration: ${replay.duration} seconds
- Total Moves: ${replay.stats.totalMoves}
- Highlights: ${replay.highlights.length}
- Winner: ${replay.winner === trainer.trainerId ? trainer.username : 'Opponent'}

**Key Moments:**
${replay.highlights.map((h, i) => `${i + 1}. ${h.description} (${h.timestamp}s)`).join('\n')}

**Watch the full replay:** [Click here](${replay.shareableUrl})

*Generated automatically by UpPaws Animal Trainer*
    `.trim();
  }

  private generateShowcaseTitle(showcase: CollectionShowcase): string {
    const categoryNames = {
      'rare_collection': 'Rare Animals',
      'habitat_specialists': 'Habitat Specialists',
      'evolution_chains': 'Evolution Chains',
      'shiny_collection': 'Shiny Collection',
      'battle_team': 'Battle Team',
      'recent_captures': 'Recent Captures'
    };
    
    const categoryName = categoryNames[showcase.category as keyof typeof categoryNames] || 'Collection';
    return `🦁 My ${categoryName} Showcase - ${showcase.stats.totalAnimals} Amazing Animals!`;
  }

  private async generateShowcaseContent(showcase: CollectionShowcase, trainer: TrainerProfile): Promise<string> {
    const infographicUrl = await this.generateInfographic({
      type: 'collection',
      title: showcase.title,
      data: {
        animals: showcase.animals,
        stats: showcase.stats
      },
      style: {
        theme: 'colorful',
        primaryColor: '#FF6B35',
        secondaryColor: '#FFD700',
        layout: 'grid'
      }
    });

    return `
**${showcase.title}**

${showcase.description}

**Collection Stats:**
- Total Animals: ${showcase.stats.totalAnimals}
- Average Level: ${showcase.stats.averageLevel}
- Completion: ${showcase.stats.completionPercentage}%

**Rarity Breakdown:**
${Object.entries(showcase.stats.rarityBreakdown)
  .map(([rarity, count]) => `- ${rarity}: ${count}`)
  .join('\n')}

**Featured Animals:**
${showcase.animals.slice(0, 5).map(animal => 
  `${animal.emoji} **${animal.name}** (Lv.${animal.level}) - ${animal.rarity}`
).join('\n')}

[View Full Infographic](${infographicUrl})

*What do you think of my collection? Share your thoughts below!*
    `.trim();
  }

  private generateAchievementContent(achievement: AchievementPost, trainer: TrainerProfile): string {
    const rarityEmojis = {
      'common': '⭐',
      'uncommon': '🌟',
      'rare': '💫',
      'epic': '✨',
      'legendary': '🏆'
    };

    const emoji = rarityEmojis[achievement.rarity as keyof typeof rarityEmojis] || '⭐';

    return `
${emoji} **${achievement.achievementName}** ${emoji}

*${achievement.description}*

**Achievement Details:**
- Rarity: ${achievement.rarity.toUpperCase()}
- Unlocked: ${achievement.unlockedAt.toLocaleDateString()}
- Progress: ${achievement.progress.current}/${achievement.progress.total}

${achievement.shareMessage}

*Keep up the great work, trainer!*
    `.trim();
  }

  private createInfographicSVG(data: InfographicData): string {
    // Simplified SVG generation - in reality this would be much more complex
    const width = 800;
    const height = 600;
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${data.style.primaryColor}"/>
  <text x="50%" y="50" text-anchor="middle" fill="white" font-size="24" font-weight="bold">
    ${data.title}
  </text>
  <text x="50%" y="100" text-anchor="middle" fill="white" font-size="16">
    Generated by UpPaws Animal Trainer
  </text>
</svg>
    `.trim();
  }

  // Utility methods for post formatting
  formatAnimalList(animals: Animal[]): string {
    return animals.map(animal => 
      `${animal.emoji} **${animal.name}** (Lv.${animal.level})`
    ).join('\n');
  }

  formatStats(stats: Record<string, number>): string {
    return Object.entries(stats)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');
  }

  generateHashtags(category: string, animals?: Animal[]): string[] {
    const baseTags = ['#UpPaws', '#AnimalTrainer', '#Reddit'];
    const categoryTags = {
      'battle_replay': ['#Battle', '#PvP', '#Gaming'],
      'collection_showcase': ['#Collection', '#Animals', '#Showcase'],
      'achievement_share': ['#Achievement', '#Milestone', '#Success']
    };
    
    const tags = [...baseTags, ...(categoryTags[category as keyof typeof categoryTags] || [])];
    
    if (animals) {
      const habitatTags = [...new Set(animals.flatMap(a => a.type))]
        .map(habitat => `#${habitat.charAt(0).toUpperCase() + habitat.slice(1)}`);
      tags.push(...habitatTags);
    }
    
    return tags;
  }
}