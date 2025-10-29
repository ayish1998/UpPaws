import { Animal } from '../types/animal.js';
import { TrainerProfile } from '../types/trainer.js';

export interface SpectatorSystem {
  createSpectatorSession(matchId: string): Promise<SpectatorSession>;
  joinSpectatorSession(sessionId: string, spectatorId: string): Promise<boolean>;
  leaveSpectatorSession(sessionId: string, spectatorId: string): Promise<void>;
  broadcastMatchUpdate(sessionId: string, update: MatchUpdate): Promise<void>;
  getActiveSpectatorSessions(): SpectatorSession[];
}

export interface SpectatorSession {
  id: string;
  matchId: string;
  battleId?: string;
  participants: MatchParticipant[];
  spectators: Spectator[];
  status: SpectatorSessionStatus;
  settings: SpectatorSettings;
  chat: ChatMessage[];
  statistics: SpectatorStatistics;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export interface MatchParticipant {
  trainerId: string;
  username: string;
  team: Animal[];
  currentAnimal?: Animal;
  score: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
}

export interface Spectator {
  id: string;
  username: string;
  joinedAt: Date;
  permissions: SpectatorPermissions;
  preferences: SpectatorPreferences;
}

export interface SpectatorPermissions {
  canChat: boolean;
  canUseEmotes: boolean;
  canVote: boolean;
  isModerator: boolean;
}

export interface SpectatorPreferences {
  showChat: boolean;
  showStatistics: boolean;
  autoFollowAction: boolean;
  notificationLevel: 'none' | 'minimal' | 'all';
}

export enum SpectatorSessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

export interface SpectatorSettings {
  maxSpectators: number;
  chatEnabled: boolean;
  allowEmotes: boolean;
  allowVoting: boolean;
  showPlayerStats: boolean;
  showMoveDetails: boolean;
  replayAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  message: string;
  type: ChatMessageType;
  timestamp: Date;
  reactions?: ChatReaction[];
}

export enum ChatMessageType {
  NORMAL = 'normal',
  EMOTE = 'emote',
  SYSTEM = 'system',
  PREDICTION = 'prediction',
  CHEER = 'cheer'
}

export interface ChatReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface SpectatorStatistics {
  totalSpectators: number;
  peakSpectators: number;
  averageViewTime: number;
  chatMessages: number;
  predictions: SpectatorPrediction[];
  polls: SpectatorPoll[];
}

export interface SpectatorPrediction {
  id: string;
  question: string;
  options: PredictionOption[];
  status: 'open' | 'closed' | 'resolved';
  createdAt: Date;
  closesAt: Date;
  result?: string;
}

export interface PredictionOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface SpectatorPoll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  voters: string[];
  createdAt: Date;
  endsAt: Date;
}

export interface MatchUpdate {
  type: MatchUpdateType;
  data: any;
  timestamp: Date;
}

export enum MatchUpdateType {
  MATCH_START = 'match_start',
  MATCH_END = 'match_end',
  TURN_START = 'turn_start',
  MOVE_USED = 'move_used',
  ANIMAL_FAINTED = 'animal_fainted',
  ANIMAL_SWITCHED = 'animal_switched',
  STATUS_EFFECT = 'status_effect',
  CRITICAL_HIT = 'critical_hit',
  SUPER_EFFECTIVE = 'super_effective',
  SCORE_UPDATE = 'score_update'
}

export interface LiveCommentary {
  id: string;
  sessionId: string;
  commentatorId: string;
  commentatorName: string;
  text: string;
  timestamp: Date;
  highlight: boolean;
}

export class SpectatorManager implements SpectatorSystem {
  private static instance: SpectatorManager;
  private sessions: Map<string, SpectatorSession> = new Map();
  private commentary: Map<string, LiveCommentary[]> = new Map();
  private replayData: Map<string, MatchReplay> = new Map();

  public static getInstance(): SpectatorManager {
    if (!SpectatorManager.instance) {
      SpectatorManager.instance = new SpectatorManager();
    }
    return SpectatorManager.instance;
  }

  async createSpectatorSession(matchId: string): Promise<SpectatorSession> {
    const sessionId = `spectator_${matchId}_${Date.now()}`;
    
    const session: SpectatorSession = {
      id: sessionId,
      matchId,
      participants: [],
      spectators: [],
      status: SpectatorSessionStatus.WAITING,
      settings: {
        maxSpectators: 1000,
        chatEnabled: true,
        allowEmotes: true,
        allowVoting: true,
        showPlayerStats: true,
        showMoveDetails: true,
        replayAvailable: true
      },
      chat: [],
      statistics: {
        totalSpectators: 0,
        peakSpectators: 0,
        averageViewTime: 0,
        chatMessages: 0,
        predictions: [],
        polls: []
      },
      createdAt: new Date()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async joinSpectatorSession(sessionId: string, spectatorId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Check if already spectating
    if (session.spectators.some(s => s.id === spectatorId)) return true;

    // Check capacity
    if (session.spectators.length >= session.settings.maxSpectators) return false;

    const spectator: Spectator = {
      id: spectatorId,
      username: '', // Would be populated from user data
      joinedAt: new Date(),
      permissions: {
        canChat: true,
        canUseEmotes: true,
        canVote: true,
        isModerator: false
      },
      preferences: {
        showChat: true,
        showStatistics: true,
        autoFollowAction: true,
        notificationLevel: 'all'
      }
    };

    session.spectators.push(spectator);
    session.statistics.totalSpectators++;
    
    if (session.spectators.length > session.statistics.peakSpectators) {
      session.statistics.peakSpectators = session.spectators.length;
    }

    // Send join notification
    this.addSystemMessage(session, `${spectator.username} joined the spectator session`);
    
    this.sessions.set(sessionId, session);
    return true;
  }

  async leaveSpectatorSession(sessionId: string, spectatorId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const spectatorIndex = session.spectators.findIndex(s => s.id === spectatorId);
    if (spectatorIndex === -1) return;

    const spectator = session.spectators[spectatorIndex];
    session.spectators.splice(spectatorIndex, 1);

    // Calculate view time for statistics
    const viewTime = Date.now() - spectator.joinedAt.getTime();
    session.statistics.averageViewTime = 
      (session.statistics.averageViewTime * (session.statistics.totalSpectators - 1) + viewTime) / 
      session.statistics.totalSpectators;

    this.sessions.set(sessionId, session);
  }

  async broadcastMatchUpdate(sessionId: string, update: MatchUpdate): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Process different types of updates
    switch (update.type) {
      case MatchUpdateType.MATCH_START:
        session.status = SpectatorSessionStatus.ACTIVE;
        session.startedAt = new Date();
        this.addSystemMessage(session, '🎮 Match has started!');
        break;

      case MatchUpdateType.MATCH_END:
        session.status = SpectatorSessionStatus.FINISHED;
        session.endedAt = new Date();
        this.addSystemMessage(session, '🏆 Match finished!');
        this.generateMatchReplay(session, update.data);
        break;

      case MatchUpdateType.CRITICAL_HIT:
        this.addSystemMessage(session, '💥 Critical hit!');
        break;

      case MatchUpdateType.SUPER_EFFECTIVE:
        this.addSystemMessage(session, '⚡ Super effective!');
        break;

      case MatchUpdateType.ANIMAL_FAINTED:
        this.addSystemMessage(session, `😵 ${update.data.animalName} fainted!`);
        break;
    }

    // Generate live commentary
    this.generateLiveCommentary(session, update);

    this.sessions.set(sessionId, session);
  }

  getActiveSpectatorSessions(): SpectatorSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.status === SpectatorSessionStatus.ACTIVE);
  }

  // Chat system
  async sendChatMessage(sessionId: string, senderId: string, message: string, type: ChatMessageType = ChatMessageType.NORMAL): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.settings.chatEnabled) return false;

    const spectator = session.spectators.find(s => s.id === senderId);
    if (!spectator || !spectator.permissions.canChat) return false;

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderUsername: spectator.username,
      message,
      type,
      timestamp: new Date(),
      reactions: []
    };

    session.chat.push(chatMessage);
    session.statistics.chatMessages++;

    // Keep only last 500 messages
    if (session.chat.length > 500) {
      session.chat.shift();
    }

    this.sessions.set(sessionId, session);
    return true;
  }

  // Prediction system
  async createPrediction(sessionId: string, question: string, options: string[], duration: number): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.settings.allowVoting) return null;

    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const prediction: SpectatorPrediction = {
      id: predictionId,
      question,
      options: options.map((text, index) => ({
        id: `opt_${index}`,
        text,
        votes: 0,
        voters: []
      })),
      status: 'open',
      createdAt: new Date(),
      closesAt: new Date(Date.now() + duration * 1000)
    };

    session.statistics.predictions.push(prediction);
    this.addSystemMessage(session, `📊 New prediction: ${question}`);
    
    this.sessions.set(sessionId, session);
    return predictionId;
  }

  async votePrediction(sessionId: string, predictionId: string, optionId: string, voterId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const prediction = session.statistics.predictions.find(p => p.id === predictionId);
    if (!prediction || prediction.status !== 'open') return false;

    const option = prediction.options.find(o => o.id === optionId);
    if (!option) return false;

    // Remove previous vote if exists
    prediction.options.forEach(opt => {
      const voterIndex = opt.voters.indexOf(voterId);
      if (voterIndex !== -1) {
        opt.voters.splice(voterIndex, 1);
        opt.votes--;
      }
    });

    // Add new vote
    option.voters.push(voterId);
    option.votes++;

    this.sessions.set(sessionId, session);
    return true;
  }

  // Replay system
  private generateMatchReplay(session: SpectatorSession, matchData: any): void {
    const replay: MatchReplay = {
      id: `replay_${session.matchId}`,
      sessionId: session.id,
      matchId: session.matchId,
      participants: session.participants,
      duration: session.endedAt ? session.endedAt.getTime() - (session.startedAt?.getTime() || 0) : 0,
      highlights: [], // Would be populated from match events
      chatLog: session.chat,
      statistics: session.statistics,
      createdAt: new Date()
    };

    this.replayData.set(replay.id, replay);
  }

  private generateLiveCommentary(session: SpectatorSession, update: MatchUpdate): void {
    const commentaries = this.commentary.get(session.id) || [];
    
    let commentaryText = '';
    switch (update.type) {
      case MatchUpdateType.MOVE_USED:
        commentaryText = `${update.data.animalName} uses ${update.data.moveName}!`;
        break;
      case MatchUpdateType.CRITICAL_HIT:
        commentaryText = 'What a critical hit! The crowd goes wild!';
        break;
      case MatchUpdateType.SUPER_EFFECTIVE:
        commentaryText = 'Super effective! That move was perfectly chosen!';
        break;
      case MatchUpdateType.ANIMAL_FAINTED:
        commentaryText = `${update.data.animalName} is down! What will the trainer do next?`;
        break;
    }

    if (commentaryText) {
      const commentary: LiveCommentary = {
        id: `commentary_${Date.now()}`,
        sessionId: session.id,
        commentatorId: 'system',
        commentatorName: 'Live Commentary',
        text: commentaryText,
        timestamp: new Date(),
        highlight: update.type === MatchUpdateType.CRITICAL_HIT || update.type === MatchUpdateType.SUPER_EFFECTIVE
      };

      commentaries.push(commentary);
      this.commentary.set(session.id, commentaries);
    }
  }

  private addSystemMessage(session: SpectatorSession, message: string): void {
    const systemMessage: ChatMessage = {
      id: `sys_${Date.now()}`,
      senderId: 'system',
      senderUsername: 'System',
      message,
      type: ChatMessageType.SYSTEM,
      timestamp: new Date()
    };

    session.chat.push(systemMessage);
  }

  // Public getters
  getSpectatorSession(sessionId: string): SpectatorSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionCommentary(sessionId: string): LiveCommentary[] {
    return this.commentary.get(sessionId) || [];
  }

  getMatchReplay(replayId: string): MatchReplay | undefined {
    return this.replayData.get(replayId);
  }

  getSpectatorCount(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session ? session.spectators.length : 0;
  }

  // Statistics
  getGlobalSpectatorStats(): {
    totalActiveSessions: number,
    totalSpectators: number,
    mostPopularSession: string | null,
    averageSessionDuration: number
  } {
    const activeSessions = this.getActiveSpectatorSessions();
    const totalSpectators = activeSessions.reduce((sum, session) => sum + session.spectators.length, 0);
    
    let mostPopularSession: string | null = null;
    let maxSpectators = 0;
    
    activeSessions.forEach(session => {
      if (session.spectators.length > maxSpectators) {
        maxSpectators = session.spectators.length;
        mostPopularSession = session.id;
      }
    });

    const completedSessions = Array.from(this.sessions.values())
      .filter(s => s.status === SpectatorSessionStatus.FINISHED && s.startedAt && s.endedAt);
    
    const averageSessionDuration = completedSessions.length > 0 ?
      completedSessions.reduce((sum, session) => 
        sum + (session.endedAt!.getTime() - session.startedAt!.getTime()), 0
      ) / completedSessions.length : 0;

    return {
      totalActiveSessions: activeSessions.length,
      totalSpectators,
      mostPopularSession,
      averageSessionDuration: Math.round(averageSessionDuration / 1000) // Convert to seconds
    };
  }
}

interface MatchReplay {
  id: string;
  sessionId: string;
  matchId: string;
  participants: MatchParticipant[];
  duration: number;
  highlights: any[];
  chatLog: ChatMessage[];
  statistics: SpectatorStatistics;
  createdAt: Date;
}