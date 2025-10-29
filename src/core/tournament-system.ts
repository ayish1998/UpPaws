import { Tournament, TournamentType, TournamentFormat, TournamentStatus, TournamentParticipant, TournamentBracket, TournamentMatch, MatchStatus, TournamentPrize } from '../types/community.js';
import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';
import { Currency } from '../types/common.js';

export interface TournamentSystem {
  createTournament(config: TournamentConfig): Promise<Tournament>;
  registerParticipant(tournamentId: string, trainerId: string): Promise<boolean>;
  startTournament(tournamentId: string): Promise<void>;
  processMatch(matchId: string, result: MatchResult): Promise<void>;
  getTournamentStandings(tournamentId: string): Promise<TournamentStanding[]>;
  getActiveTournaments(): Tournament[];
  getUpcomingTournaments(): Tournament[];
}

export interface TournamentConfig {
  name: string;
  description: string;
  type: TournamentType;
  format: TournamentFormat;
  maxParticipants: number;
  entryFee?: Currency;
  prizePool: TournamentPrize[];
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  rules: string[];
  subredditId?: string;
  createdBy: string;
}

export interface MatchResult {
  winnerId: string;
  loserId: string;
  score: string;
  duration: number;
  replay?: string;
}

export interface TournamentStanding {
  rank: number;
  participant: TournamentParticipant;
  points: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface WeeklyTournament {
  id: string;
  week: number;
  year: number;
  theme: string;
  restrictions: TournamentRestriction[];
  status: TournamentStatus;
  participants: TournamentParticipant[];
  prizes: TournamentPrize[];
}

export interface TournamentRestriction {
  type: 'level' | 'habitat' | 'rarity' | 'evolution_stage';
  value: any;
  description: string;
}

export interface SeasonalLeague {
  id: string;
  name: string;
  season: string;
  year: number;
  divisions: LeagueDivision[];
  schedule: LeagueMatch[];
  standings: LeagueStanding[];
  status: 'registration' | 'active' | 'playoffs' | 'completed';
}

export interface LeagueDivision {
  id: string;
  name: string;
  tier: number;
  participants: string[];
  promotionSpots: number;
  relegationSpots: number;
}

export interface LeagueMatch {
  id: string;
  week: number;
  participant1Id: string;
  participant2Id: string;
  scheduledAt: Date;
  result?: MatchResult;
  status: MatchStatus;
}

export interface LeagueStanding {
  rank: number;
  trainerId: string;
  division: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
}

export class TournamentManager implements TournamentSystem {
  private static instance: TournamentManager;
  private tournaments: Map<string, Tournament> = new Map();
  private weeklyTournaments: Map<string, WeeklyTournament> = new Map();
  private seasonalLeagues: Map<string, SeasonalLeague> = new Map();
  private skillRatings: Map<string, number> = new Map();

  public static getInstance(): TournamentManager {
    if (!TournamentManager.instance) {
      TournamentManager.instance = new TournamentManager();
    }
    return TournamentManager.instance;
  }

  async createTournament(config: TournamentConfig): Promise<Tournament> {
    const tournamentId = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tournament: Tournament = {
      id: tournamentId,
      name: config.name,
      description: config.description,
      type: config.type,
      format: config.format,
      scope: config.subredditId ? 'subreddit' as any : 'global' as any,
      subredditId: config.subredditId,
      status: TournamentStatus.REGISTRATION,
      startDate: config.startDate,
      endDate: config.endDate,
      registrationDeadline: config.registrationDeadline,
      maxParticipants: config.maxParticipants,
      entryFee: config.entryFee,
      prizePool: config.prizePool,
      participants: [],
      brackets: [],
      rules: config.rules.map((rule, index) => ({
        id: `rule_${index}`,
        description: rule,
        category: 'general'
      })),
      createdBy: config.createdBy
    };

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  async registerParticipant(tournamentId: string, trainerId: string): Promise<boolean> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;

    // Check registration conditions
    if (tournament.status !== TournamentStatus.REGISTRATION) return false;
    if (tournament.participants.length >= tournament.maxParticipants) return false;
    if (new Date() > tournament.registrationDeadline) return false;
    if (tournament.participants.some(p => p.trainerId === trainerId)) return false;

    // Add participant
    const participant: TournamentParticipant = {
      trainerId,
      username: '', // Would be populated from trainer profile
      registeredAt: new Date(),
      currentRound: 0,
      wins: 0,
      losses: 0,
      eliminated: false
    };

    tournament.participants.push(participant);
    this.tournaments.set(tournamentId, tournament);
    return true;
  }

  async startTournament(tournamentId: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament || tournament.status !== TournamentStatus.REGISTRATION) return;

    // Generate brackets based on format
    tournament.brackets = this.generateBrackets(tournament);
    tournament.status = TournamentStatus.IN_PROGRESS;
    
    this.tournaments.set(tournamentId, tournament);
  }

  async processMatch(matchId: string, result: MatchResult): Promise<void> {
    // Find tournament containing this match
    for (const [tournamentId, tournament] of this.tournaments.entries()) {
      for (const bracket of tournament.brackets) {
        const match = bracket.matches.find(m => m.id === matchId);
        if (match) {
          match.winnerId = result.winnerId;
          match.score = result.score;
          match.completedAt = new Date();
          match.status = MatchStatus.COMPLETED;

          // Update participant records
          const winner = tournament.participants.find(p => p.trainerId === result.winnerId);
          const loser = tournament.participants.find(p => p.trainerId === result.loserId);
          
          if (winner) winner.wins++;
          if (loser) loser.losses++;

          // Update skill ratings
          this.updateSkillRatings(result.winnerId, result.loserId);

          // Check if tournament is complete
          this.checkTournamentCompletion(tournamentId);
          
          this.tournaments.set(tournamentId, tournament);
          return;
        }
      }
    }
  }

  async getTournamentStandings(tournamentId: string): Promise<TournamentStanding[]> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return [];

    return tournament.participants
      .map((participant, index) => ({
        rank: index + 1,
        participant,
        points: this.calculatePoints(participant),
        wins: participant.wins,
        losses: participant.losses,
        winRate: participant.wins / Math.max(1, participant.wins + participant.losses)
      }))
      .sort((a, b) => b.points - a.points)
      .map((standing, index) => ({ ...standing, rank: index + 1 }));
  }

  getActiveTournaments(): Tournament[] {
    return Array.from(this.tournaments.values())
      .filter(t => t.status === TournamentStatus.IN_PROGRESS);
  }

  getUpcomingTournaments(): Tournament[] {
    return Array.from(this.tournaments.values())
      .filter(t => t.status === TournamentStatus.REGISTRATION);
  }

  // Weekly Tournament System
  async createWeeklyTournament(): Promise<WeeklyTournament> {
    const now = new Date();
    const week = this.getWeekNumber(now);
    const year = now.getFullYear();
    const weeklyId = `weekly_${year}_${week}`;

    if (this.weeklyTournaments.has(weeklyId)) {
      return this.weeklyTournaments.get(weeklyId)!;
    }

    const themes = [
      'Forest Dwellers Only',
      'Ocean Creatures Battle',
      'Mountain Peak Challenge',
      'Desert Survivors',
      'Rare Species Showcase',
      'Evolution Masters',
      'Speed Demons',
      'Tank Battle'
    ];

    const weeklyTournament: WeeklyTournament = {
      id: weeklyId,
      week,
      year,
      theme: themes[week % themes.length],
      restrictions: this.generateWeeklyRestrictions(week),
      status: TournamentStatus.REGISTRATION,
      participants: [],
      prizes: this.generateWeeklyPrizes()
    };

    this.weeklyTournaments.set(weeklyId, weeklyTournament);
    return weeklyTournament;
  }

  // Seasonal League System
  async createSeasonalLeague(season: string, year: number): Promise<SeasonalLeague> {
    const leagueId = `league_${season}_${year}`;
    
    if (this.seasonalLeagues.has(leagueId)) {
      return this.seasonalLeagues.get(leagueId)!;
    }

    const league: SeasonalLeague = {
      id: leagueId,
      name: `${season} ${year} Competitive League`,
      season,
      year,
      divisions: this.createLeagueDivisions(),
      schedule: [],
      standings: [],
      status: 'registration'
    };

    this.seasonalLeagues.set(leagueId, league);
    return league;
  }

  // Skill-based Matchmaking
  findMatchmakingOpponent(trainerId: string, gameMode: string): string | null {
    const playerRating = this.skillRatings.get(trainerId) || 1000;
    const ratingRange = 100; // ±100 rating points
    
    const potentialOpponents = Array.from(this.skillRatings.entries())
      .filter(([id, rating]) => 
        id !== trainerId && 
        Math.abs(rating - playerRating) <= ratingRange
      )
      .sort(([, a], [, b]) => Math.abs(a - playerRating) - Math.abs(b - playerRating));

    return potentialOpponents.length > 0 ? potentialOpponents[0][0] : null;
  }

  // Spectator Mode
  createSpectatorSession(matchId: string): SpectatorSession {
    return {
      id: `spectator_${matchId}_${Date.now()}`,
      matchId,
      viewers: [],
      chatEnabled: true,
      createdAt: new Date()
    };
  }

  // Private helper methods
  private generateBrackets(tournament: Tournament): TournamentBracket[] {
    const participants = [...tournament.participants];
    const brackets: TournamentBracket[] = [];

    switch (tournament.format) {
      case TournamentFormat.SINGLE_ELIMINATION:
        return this.generateSingleEliminationBrackets(participants);
      case TournamentFormat.ROUND_ROBIN:
        return this.generateRoundRobinBrackets(participants);
      default:
        return this.generateSingleEliminationBrackets(participants);
    }
  }

  private generateSingleEliminationBrackets(participants: TournamentParticipant[]): TournamentBracket[] {
    const brackets: TournamentBracket[] = [];
    let currentRound = 1;
    let currentParticipants = [...participants];

    while (currentParticipants.length > 1) {
      const matches: TournamentMatch[] = [];
      const nextRoundParticipants: TournamentParticipant[] = [];

      for (let i = 0; i < currentParticipants.length; i += 2) {
        if (i + 1 < currentParticipants.length) {
          const matchId = `match_${currentRound}_${Math.floor(i / 2) + 1}`;
          matches.push({
            id: matchId,
            participant1Id: currentParticipants[i].trainerId,
            participant2Id: currentParticipants[i + 1].trainerId,
            status: MatchStatus.SCHEDULED
          });
        } else {
          // Bye - participant advances automatically
          nextRoundParticipants.push(currentParticipants[i]);
        }
      }

      brackets.push({
        round: currentRound,
        matches
      });

      currentRound++;
      currentParticipants = nextRoundParticipants;
    }

    return brackets;
  }

  private generateRoundRobinBrackets(participants: TournamentParticipant[]): TournamentBracket[] {
    const matches: TournamentMatch[] = [];
    let matchId = 1;

    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: `match_rr_${matchId++}`,
          participant1Id: participants[i].trainerId,
          participant2Id: participants[j].trainerId,
          status: MatchStatus.SCHEDULED
        });
      }
    }

    return [{
      round: 1,
      matches
    }];
  }

  private calculatePoints(participant: TournamentParticipant): number {
    return participant.wins * 3 + (participant.losses * 0); // 3 points per win
  }

  private updateSkillRatings(winnerId: string, loserId: string): void {
    const winnerRating = this.skillRatings.get(winnerId) || 1000;
    const loserRating = this.skillRatings.get(loserId) || 1000;
    
    const K = 32; // K-factor for Elo rating
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 - expectedWinner;
    
    const newWinnerRating = winnerRating + K * (1 - expectedWinner);
    const newLoserRating = loserRating + K * (0 - expectedLoser);
    
    this.skillRatings.set(winnerId, Math.round(newWinnerRating));
    this.skillRatings.set(loserId, Math.round(newLoserRating));
  }

  private checkTournamentCompletion(tournamentId: string): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return;

    const allMatchesComplete = tournament.brackets.every(bracket =>
      bracket.matches.every(match => match.status === MatchStatus.COMPLETED)
    );

    if (allMatchesComplete) {
      tournament.status = TournamentStatus.COMPLETED;
      this.distributePrizes(tournament);
    }
  }

  private distributePrizes(tournament: Tournament): void {
    const standings = tournament.participants
      .sort((a, b) => b.wins - a.wins)
      .slice(0, tournament.prizePool.length);

    standings.forEach((participant, index) => {
      const prize = tournament.prizePool[index];
      if (prize) {
        // Award prizes to participant
        // This would integrate with the economy system
      }
    });
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private generateWeeklyRestrictions(week: number): TournamentRestriction[] {
    const restrictions = [
      { type: 'habitat' as const, value: ['forest'], description: 'Forest animals only' },
      { type: 'level' as const, value: { max: 10 }, description: 'Level 10 or below' },
      { type: 'rarity' as const, value: ['common', 'uncommon'], description: 'Common and uncommon only' },
      { type: 'evolution_stage' as const, value: 1, description: 'First evolution stage only' }
    ];
    
    return [restrictions[week % restrictions.length]];
  }

  private generateWeeklyPrizes(): TournamentPrize[] {
    return [
      {
        position: 1,
        rewards: [{
          type: 'currency' as any,
          currency: { battleTokens: 100, pawCoins: 500 }
        }]
      },
      {
        position: 2,
        rewards: [{
          type: 'currency' as any,
          currency: { battleTokens: 75, pawCoins: 300 }
        }]
      },
      {
        position: 3,
        rewards: [{
          type: 'currency' as any,
          currency: { battleTokens: 50, pawCoins: 200 }
        }]
      }
    ];
  }

  private createLeagueDivisions(): LeagueDivision[] {
    return [
      {
        id: 'premier',
        name: 'Premier Division',
        tier: 1,
        participants: [],
        promotionSpots: 0,
        relegationSpots: 3
      },
      {
        id: 'championship',
        name: 'Championship Division',
        tier: 2,
        participants: [],
        promotionSpots: 3,
        relegationSpots: 4
      },
      {
        id: 'league_one',
        name: 'League One',
        tier: 3,
        participants: [],
        promotionSpots: 4,
        relegationSpots: 4
      },
      {
        id: 'league_two',
        name: 'League Two',
        tier: 4,
        participants: [],
        promotionSpots: 4,
        relegationSpots: 0
      }
    ];
  }

  // Public getters
  getTournament(tournamentId: string): Tournament | undefined {
    return this.tournaments.get(tournamentId);
  }

  getWeeklyTournament(week: number, year: number): WeeklyTournament | undefined {
    return this.weeklyTournaments.get(`weekly_${year}_${week}`);
  }

  getSeasonalLeague(season: string, year: number): SeasonalLeague | undefined {
    return this.seasonalLeagues.get(`league_${season}_${year}`);
  }

  getPlayerSkillRating(trainerId: string): number {
    return this.skillRatings.get(trainerId) || 1000;
  }

  getAllTournaments(): Tournament[] {
    return Array.from(this.tournaments.values());
  }
}

export interface SpectatorSession {
  id: string;
  matchId: string;
  viewers: string[];
  chatEnabled: boolean;
  createdAt: Date;
}