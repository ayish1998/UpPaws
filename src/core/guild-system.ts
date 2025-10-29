import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';
import { Currency, Achievement } from '../types/common.js';

export interface GuildSystem {
  createGuild(founderId: string, config: GuildConfig): Promise<Guild>;
  joinGuild(guildId: string, trainerId: string): Promise<boolean>;
  leaveGuild(guildId: string, trainerId: string): Promise<void>;
  promoteGuildMember(guildId: string, memberId: string, newRole: GuildRole): Promise<boolean>;
  startGuildRaid(guildId: string, raidConfig: RaidConfig): Promise<GuildRaid>;
  getGuildsBySubreddit(subredditId: string): Guild[];
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  subredditId: string;
  subredditName: string;
  founderId: string;
  members: GuildMember[];
  level: number;
  experience: number;
  treasury: Currency;
  achievements: GuildAchievement[];
  activities: GuildActivity[];
  raids: GuildRaid[];
  settings: GuildSettings;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface GuildMember {
  trainerId: string;
  username: string;
  role: GuildRole;
  joinedAt: Date;
  contribution: GuildContribution;
  permissions: GuildPermissions;
  lastActiveAt: Date;
}

export enum GuildRole {
  MEMBER = 'member',
  OFFICER = 'officer',
  LEADER = 'leader',
  FOUNDER = 'founder'
}

export interface GuildContribution {
  totalPoints: number;
  weeklyPoints: number;
  raidsParticipated: number;
  animalsContributed: number;
  resourcesContributed: Currency;
}

export interface GuildPermissions {
  canInvite: boolean;
  canKick: boolean;
  canStartRaids: boolean;
  canManageTreasury: boolean;
  canEditSettings: boolean;
}

export interface GuildConfig {
  name: string;
  description: string;
  subredditId: string;
  isPublic: boolean;
  maxMembers: number;
  requirements: GuildRequirements;
}

export interface GuildRequirements {
  minLevel: number;
  minAnimalsCapture: number;
  applicationRequired: boolean;
}

export interface GuildSettings {
  isPublic: boolean;
  maxMembers: number;
  autoAcceptApplications: boolean;
  requirementLevel: number;
  allowCrossSubreddit: boolean;
  raidCooldown: number;
}

export interface GuildActivity {
  id: string;
  type: GuildActivityType;
  description: string;
  participantId: string;
  participantUsername: string;
  timestamp: Date;
  data?: any;
}

export enum GuildActivityType {
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_PROMOTED = 'member_promoted',
  RAID_STARTED = 'raid_started',
  RAID_COMPLETED = 'raid_completed',
  ACHIEVEMENT_EARNED = 'achievement_earned',
  LEVEL_UP = 'level_up'
}

export interface GuildAchievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  contributors: string[];
}

export interface GuildRaid {
  id: string;
  guildId: string;
  targetAnimal: LegendaryAnimal;
  status: RaidStatus;
  participants: RaidParticipant[];
  startedAt: Date;
  endsAt: Date;
  completedAt?: Date;
  rewards: RaidReward[];
  progress: RaidProgress;
}

export interface LegendaryAnimal extends Animal {
  legendary: true;
  raidDifficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  requiredParticipants: number;
  specialAbilities: string[];
  weaknesses: string[];
}

export enum RaidStatus {
  PREPARING = 'preparing',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface RaidParticipant {
  trainerId: string;
  username: string;
  team: Animal[];
  contribution: number;
  joinedAt: Date;
  status: 'ready' | 'fighting' | 'defeated' | 'victorious';
}

export interface RaidConfig {
  targetAnimalId: string;
  duration: number; // in hours
  maxParticipants: number;
  entryFee?: Currency;
}

export interface RaidProgress {
  totalDamage: number;
  requiredDamage: number;
  phases: RaidPhase[];
  currentPhase: number;
}

export interface RaidPhase {
  name: string;
  description: string;
  damageThreshold: number;
  completed: boolean;
  completedAt?: Date;
}

export interface RaidReward {
  type: 'currency' | 'item' | 'animal' | 'achievement';
  value: any;
  rarity: string;
  eligibleParticipants: string[];
}

export class GuildManager implements GuildSystem {
  private static instance: GuildManager;
  private guilds: Map<string, Guild> = new Map();
  private membershipIndex: Map<string, string> = new Map(); // trainerId -> guildId
  private subredditGuilds: Map<string, string[]> = new Map(); // subredditId -> guildIds[]

  public static getInstance(): GuildManager {
    if (!GuildManager.instance) {
      GuildManager.instance = new GuildManager();
    }
    return GuildManager.instance;
  }

  async createGuild(founderId: string, config: GuildConfig): Promise<Guild> {
    // Check if founder is already in a guild
    if (this.membershipIndex.has(founderId)) {
      throw new Error('Trainer is already in a guild');
    }

    const guildId = `guild_${config.subredditId}_${Date.now()}`;
    
    const guild: Guild = {
      id: guildId,
      name: config.name,
      description: config.description,
      subredditId: config.subredditId,
      subredditName: '', // Would be populated from subreddit data
      founderId,
      members: [{
        trainerId: founderId,
        username: '', // Would be populated from trainer profile
        role: GuildRole.FOUNDER,
        joinedAt: new Date(),
        contribution: {
          totalPoints: 0,
          weeklyPoints: 0,
          raidsParticipated: 0,
          animalsContributed: 0,
          resourcesContributed: { pawCoins: 0, researchPoints: 0, battleTokens: 0 }
        },
        permissions: {
          canInvite: true,
          canKick: true,
          canStartRaids: true,
          canManageTreasury: true,
          canEditSettings: true
        },
        lastActiveAt: new Date()
      }],
      level: 1,
      experience: 0,
      treasury: { pawCoins: 0, researchPoints: 0, battleTokens: 0 },
      achievements: [],
      activities: [],
      raids: [],
      settings: {
        isPublic: config.isPublic,
        maxMembers: config.maxMembers,
        autoAcceptApplications: !config.requirements.applicationRequired,
        requirementLevel: config.requirements.minLevel,
        allowCrossSubreddit: false,
        raidCooldown: 24 // hours
      },
      createdAt: new Date(),
      lastActiveAt: new Date()
    };

    this.guilds.set(guildId, guild);
    this.membershipIndex.set(founderId, guildId);
    
    // Add to subreddit index
    const subredditGuilds = this.subredditGuilds.get(config.subredditId) || [];
    subredditGuilds.push(guildId);
    this.subredditGuilds.set(config.subredditId, subredditGuilds);

    this.addGuildActivity(guild, GuildActivityType.MEMBER_JOINED, founderId, 'Guild founded');

    return guild;
  }

  async joinGuild(guildId: string, trainerId: string): Promise<boolean> {
    // Check if trainer is already in a guild
    if (this.membershipIndex.has(trainerId)) {
      return false;
    }

    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    // Check capacity
    if (guild.members.length >= guild.settings.maxMembers) {
      return false;
    }

    // Check requirements (would validate against trainer profile)
    // For now, simplified check
    
    const newMember: GuildMember = {
      trainerId,
      username: '', // Would be populated from trainer profile
      role: GuildRole.MEMBER,
      joinedAt: new Date(),
      contribution: {
        totalPoints: 0,
        weeklyPoints: 0,
        raidsParticipated: 0,
        animalsContributed: 0,
        resourcesContributed: { pawCoins: 0, researchPoints: 0, battleTokens: 0 }
      },
      permissions: {
        canInvite: false,
        canKick: false,
        canStartRaids: false,
        canManageTreasury: false,
        canEditSettings: false
      },
      lastActiveAt: new Date()
    };

    guild.members.push(newMember);
    guild.lastActiveAt = new Date();
    
    this.membershipIndex.set(trainerId, guildId);
    this.guilds.set(guildId, guild);
    
    this.addGuildActivity(guild, GuildActivityType.MEMBER_JOINED, trainerId, 'New member joined');

    return true;
  }

  async leaveGuild(guildId: string, trainerId: string): Promise<void> {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    const memberIndex = guild.members.findIndex(m => m.trainerId === trainerId);
    if (memberIndex === -1) return;

    const member = guild.members[memberIndex];
    
    // If founder is leaving, transfer leadership or disband
    if (member.role === GuildRole.FOUNDER) {
      const officers = guild.members.filter(m => m.role === GuildRole.OFFICER);
      if (officers.length > 0) {
        officers[0].role = GuildRole.FOUNDER;
        officers[0].permissions = member.permissions;
      } else {
        // Disband guild if no officers
        this.disbandGuild(guildId);
        return;
      }
    }

    guild.members.splice(memberIndex, 1);
    this.membershipIndex.delete(trainerId);
    this.guilds.set(guildId, guild);
    
    this.addGuildActivity(guild, GuildActivityType.MEMBER_LEFT, trainerId, 'Member left the guild');
  }

  async promoteGuildMember(guildId: string, memberId: string, newRole: GuildRole): Promise<boolean> {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    const member = guild.members.find(m => m.trainerId === memberId);
    if (!member) return false;

    const oldRole = member.role;
    member.role = newRole;
    
    // Update permissions based on role
    member.permissions = this.getPermissionsForRole(newRole);
    
    this.guilds.set(guildId, guild);
    this.addGuildActivity(guild, GuildActivityType.MEMBER_PROMOTED, memberId, 
      `Promoted from ${oldRole} to ${newRole}`);

    return true;
  }

  async startGuildRaid(guildId: string, raidConfig: RaidConfig): Promise<GuildRaid> {
    const guild = this.guilds.get(guildId);
    if (!guild) throw new Error('Guild not found');

    // Check cooldown
    const lastRaid = guild.raids[guild.raids.length - 1];
    if (lastRaid && lastRaid.completedAt) {
      const hoursSinceLastRaid = (Date.now() - lastRaid.completedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastRaid < guild.settings.raidCooldown) {
        throw new Error('Guild raid is on cooldown');
      }
    }

    const raidId = `raid_${guildId}_${Date.now()}`;
    const targetAnimal = this.getLegendaryAnimal(raidConfig.targetAnimalId);
    
    const raid: GuildRaid = {
      id: raidId,
      guildId,
      targetAnimal,
      status: RaidStatus.PREPARING,
      participants: [],
      startedAt: new Date(),
      endsAt: new Date(Date.now() + raidConfig.duration * 60 * 60 * 1000),
      rewards: this.generateRaidRewards(targetAnimal),
      progress: {
        totalDamage: 0,
        requiredDamage: targetAnimal.stats.health * 10, // Raids require more damage
        phases: this.generateRaidPhases(targetAnimal),
        currentPhase: 0
      }
    };

    guild.raids.push(raid);
    this.guilds.set(guildId, guild);
    
    this.addGuildActivity(guild, GuildActivityType.RAID_STARTED, '', 
      `Raid against ${targetAnimal.name} has begun!`);

    return raid;
  }

  getGuildsBySubreddit(subredditId: string): Guild[] {
    const guildIds = this.subredditGuilds.get(subredditId) || [];
    return guildIds.map(id => this.guilds.get(id)).filter(Boolean) as Guild[];
  }

  // Helper methods
  private addGuildActivity(guild: Guild, type: GuildActivityType, participantId: string, description: string): void {
    const activity: GuildActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      participantId,
      participantUsername: '', // Would be populated from trainer profile
      timestamp: new Date()
    };

    guild.activities.push(activity);
    
    // Keep only last 100 activities
    if (guild.activities.length > 100) {
      guild.activities.shift();
    }
  }

  private getPermissionsForRole(role: GuildRole): GuildPermissions {
    switch (role) {
      case GuildRole.FOUNDER:
        return {
          canInvite: true,
          canKick: true,
          canStartRaids: true,
          canManageTreasury: true,
          canEditSettings: true
        };
      case GuildRole.LEADER:
        return {
          canInvite: true,
          canKick: true,
          canStartRaids: true,
          canManageTreasury: true,
          canEditSettings: false
        };
      case GuildRole.OFFICER:
        return {
          canInvite: true,
          canKick: false,
          canStartRaids: true,
          canManageTreasury: false,
          canEditSettings: false
        };
      default:
        return {
          canInvite: false,
          canKick: false,
          canStartRaids: false,
          canManageTreasury: false,
          canEditSettings: false
        };
    }
  }

  private getLegendaryAnimal(animalId: string): LegendaryAnimal {
    // Simplified legendary animal generation
    const legendaryAnimals: LegendaryAnimal[] = [
      {
        id: 'legendary_dragon',
        name: 'Ancient Dragon',
        emoji: '🐉',
        level: 50,
        type: ['mountain', 'fire'],
        rarity: 'legendary',
        stats: {
          health: 500,
          maxHealth: 500,
          attack: 120,
          defense: 100,
          speed: 80,
          intelligence: 110,
          stamina: 150
        },
        moves: [],
        legendary: true,
        raidDifficulty: 'extreme',
        requiredParticipants: 10,
        specialAbilities: ['Fire Breath', 'Dragon Roar', 'Ancient Wisdom'],
        weaknesses: ['ice', 'water']
      }
    ];

    return legendaryAnimals.find(a => a.id === animalId) || legendaryAnimals[0];
  }

  private generateRaidRewards(targetAnimal: LegendaryAnimal): RaidReward[] {
    return [
      {
        type: 'currency',
        value: { pawCoins: 1000, researchPoints: 500 },
        rarity: 'epic',
        eligibleParticipants: []
      },
      {
        type: 'animal',
        value: targetAnimal,
        rarity: 'legendary',
        eligibleParticipants: [] // Top contributors only
      }
    ];
  }

  private generateRaidPhases(targetAnimal: LegendaryAnimal): RaidPhase[] {
    const totalHealth = targetAnimal.stats.health * 10;
    return [
      {
        name: 'Initial Assault',
        description: 'Break through the legendary\'s defenses',
        damageThreshold: totalHealth * 0.25,
        completed: false
      },
      {
        name: 'Fierce Battle',
        description: 'The legendary fights back with full power',
        damageThreshold: totalHealth * 0.5,
        completed: false
      },
      {
        name: 'Final Stand',
        description: 'The legendary makes its last desperate attack',
        damageThreshold: totalHealth * 0.75,
        completed: false
      },
      {
        name: 'Victory',
        description: 'The legendary has been defeated!',
        damageThreshold: totalHealth,
        completed: false
      }
    ];
  }

  private disbandGuild(guildId: string): void {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    // Remove all members from membership index
    guild.members.forEach(member => {
      this.membershipIndex.delete(member.trainerId);
    });

    // Remove from subreddit index
    const subredditGuilds = this.subredditGuilds.get(guild.subredditId) || [];
    const index = subredditGuilds.indexOf(guildId);
    if (index !== -1) {
      subredditGuilds.splice(index, 1);
      this.subredditGuilds.set(guild.subredditId, subredditGuilds);
    }

    this.guilds.delete(guildId);
  }

  // Public getters
  getGuild(guildId: string): Guild | undefined {
    return this.guilds.get(guildId);
  }

  getGuildByTrainer(trainerId: string): Guild | undefined {
    const guildId = this.membershipIndex.get(trainerId);
    return guildId ? this.guilds.get(guildId) : undefined;
  }

  getAllGuilds(): Guild[] {
    return Array.from(this.guilds.values());
  }

  getGuildStats(): {
    totalGuilds: number,
    totalMembers: number,
    activeRaids: number,
    averageGuildSize: number
  } {
    const guilds = Array.from(this.guilds.values());
    const totalMembers = guilds.reduce((sum, guild) => sum + guild.members.length, 0);
    const activeRaids = guilds.reduce((sum, guild) => 
      sum + guild.raids.filter(raid => raid.status === RaidStatus.ACTIVE).length, 0);

    return {
      totalGuilds: guilds.length,
      totalMembers,
      activeRaids,
      averageGuildSize: guilds.length > 0 ? Math.round(totalMembers / guilds.length) : 0
    };
  }
}