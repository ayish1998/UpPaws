import { ConservationMission, EducationalContent } from '../types/habitat.js';
import { TrainerProfile } from '../types/trainer.js';
import { Rarity } from '../types/common.js';

export interface WildlifeOrganization {
  id: string;
  name: string;
  description: string;
  website: string;
  donationUrl: string;
  logoUrl: string;
  focusAreas: ConservationFocus[];
  partnershipLevel: PartnershipLevel;
  isActive: boolean;
}

export enum ConservationFocus {
  MARINE_LIFE = 'marine_life',
  FOREST_CONSERVATION = 'forest_conservation',
  ENDANGERED_SPECIES = 'endangered_species',
  CLIMATE_CHANGE = 'climate_change',
  HABITAT_RESTORATION = 'habitat_restoration',
  WILDLIFE_RESEARCH = 'wildlife_research'
}

export enum PartnershipLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export interface SponsoredContent {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  contentType: ContentType;
  educationalMaterial: EducationalMaterial;
  rewards: SponsoredReward[];
  targetAudience: string[];
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export enum ContentType {
  MISSION = 'mission',
  EDUCATIONAL_ARTICLE = 'educational_article',
  RESEARCH_PROJECT = 'research_project',
  CONSERVATION_CHALLENGE = 'conservation_challenge',
  EXPERT_AMA = 'expert_ama'
}

export interface EducationalMaterial {
  facts: string[];
  researchPapers: ResearchPaper[];
  videos: VideoContent[];
  interactiveContent: InteractiveContent[];
  quizzes: Quiz[];
}

export interface ResearchPaper {
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  publishedDate: Date;
  difficulty: number;
}

export interface VideoContent {
  title: string;
  description: string;
  url: string;
  duration: number;
  thumbnailUrl: string;
  difficulty: number;
}

export interface InteractiveContent {
  id: string;
  title: string;
  description: string;
  type: InteractiveType;
  url: string;
  estimatedTime: number;
  difficulty: number;
}

export enum InteractiveType {
  SIMULATION = 'simulation',
  VIRTUAL_TOUR = 'virtual_tour',
  INTERACTIVE_MAP = 'interactive_map',
  CITIZEN_SCIENCE = 'citizen_science'
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  rewards: SponsoredReward[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface SponsoredReward {
  type: RewardType;
  value: number;
  description: string;
  rarity: Rarity;
}

export enum RewardType {
  CURRENCY = 'currency',
  ITEM = 'item',
  EXPERIENCE = 'experience',
  BADGE = 'badge',
  ANIMAL_ACCESS = 'animal_access',
  HABITAT_ACCESS = 'habitat_access'
}

export interface ConservationImpact {
  trainerId: string;
  organizationId: string;
  totalDonations: number;
  activitiesCompleted: number;
  researchContributions: number;
  impactScore: number;
  lastContribution: Date;
  achievements: string[];
}

export interface ExpertAMA {
  id: string;
  expertName: string;
  expertTitle: string;
  organizationId: string;
  topic: string;
  description: string;
  scheduledDate: Date;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  questions: AMAQuestion[];
  rewards: SponsoredReward[];
  isActive: boolean;
}

export interface AMAQuestion {
  id: string;
  trainerId: string;
  question: string;
  upvotes: number;
  answered: boolean;
  answer?: string;
  submittedAt: Date;
}

export interface CitizenScienceProject {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  objectives: string[];
  dataCollectionType: DataCollectionType;
  targetSpecies: string[];
  targetHabitats: HabitatType[];
  rewards: SponsoredReward[];
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  participantCount: number;
  dataPointsCollected: number;
}

export enum DataCollectionType {
  ANIMAL_SIGHTING = 'animal_sighting',
  HABITAT_CONDITION = 'habitat_condition',
  BEHAVIOR_OBSERVATION = 'behavior_observation',
  POPULATION_COUNT = 'population_count',
  ENVIRONMENTAL_DATA = 'environmental_data'
}

export interface DataContribution {
  id: string;
  projectId: string;
  trainerId: string;
  dataType: DataCollectionType;
  data: any;
  location?: string;
  timestamp: Date;
  verified: boolean;
  qualityScore: number;
}

/**
 * Educational Partnership Integration Service
 * Manages wildlife organization partnerships, sponsored content, conservation impact tracking,
 * expert AMAs, and citizen science contributions
 */
export class EducationalPartnershipService {
  private static instance: EducationalPartnershipService;
  private organizations: Map<string, WildlifeOrganization> = new Map();
  private sponsoredContent: Map<string, SponsoredContent> = new Map();
  private conservationImpacts: Map<string, ConservationImpact> = new Map();
  private expertAMAs: Map<string, ExpertAMA> = new Map();
  private citizenScienceProjects: Map<string, CitizenScienceProject> = new Map();
  private dataContributions: Map<string, DataContribution> = new Map();

  private constructor() {
    this.initializeDefaultOrganizations();
    this.initializeDefaultContent();
  }

  public static getInstance(): EducationalPartnershipService {
    if (!EducationalPartnershipService.instance) {
      EducationalPartnershipService.instance = new EducationalPartnershipService();
    }
    return EducationalPartnershipService.instance;
  }

  /**
   * Initialize default wildlife organizations
   */
  private initializeDefaultOrganizations(): void {
    const defaultOrganizations: WildlifeOrganization[] = [
      {
        id: 'wwf',
        name: 'World Wildlife Fund',
        description: 'Leading conservation organization working to protect wildlife and their habitats.',
        website: 'https://www.worldwildlife.org',
        donationUrl: 'https://www.worldwildlife.org/donate',
        logoUrl: '/assets/partners/wwf-logo.png',
        focusAreas: [ConservationFocus.ENDANGERED_SPECIES, ConservationFocus.HABITAT_RESTORATION],
        partnershipLevel: PartnershipLevel.PLATINUM,
        isActive: true
      },
      {
        id: 'oceana',
        name: 'Oceana',
        description: 'International organization focused on ocean conservation and marine life protection.',
        website: 'https://oceana.org',
        donationUrl: 'https://oceana.org/donate',
        logoUrl: '/assets/partners/oceana-logo.png',
        focusAreas: [ConservationFocus.MARINE_LIFE],
        partnershipLevel: PartnershipLevel.GOLD,
        isActive: true
      },
      {
        id: 'rainforest_alliance',
        name: 'Rainforest Alliance',
        description: 'Working to conserve biodiversity and ensure sustainable livelihoods.',
        website: 'https://www.rainforest-alliance.org',
        donationUrl: 'https://www.rainforest-alliance.org/donate',
        logoUrl: '/assets/partners/rainforest-alliance-logo.png',
        focusAreas: [ConservationFocus.FOREST_CONSERVATION, ConservationFocus.CLIMATE_CHANGE],
        partnershipLevel: PartnershipLevel.GOLD,
        isActive: true
      },
      {
        id: 'jane_goodall_institute',
        name: 'Jane Goodall Institute',
        description: 'Advancing the vision and work of Dr. Jane Goodall in wildlife research and conservation.',
        website: 'https://janegoodall.org',
        donationUrl: 'https://janegoodall.org/donate',
        logoUrl: '/assets/partners/jgi-logo.png',
        focusAreas: [ConservationFocus.WILDLIFE_RESEARCH, ConservationFocus.ENDANGERED_SPECIES],
        partnershipLevel: PartnershipLevel.SILVER,
        isActive: true
      }
    ];

    defaultOrganizations.forEach(org => {
      this.organizations.set(org.id, org);
    });
  }

  /**
   * Initialize default sponsored content
   */
  private initializeDefaultContent(): void {
    const defaultContent: SponsoredContent[] = [
      {
        id: 'wwf_tiger_conservation',
        organizationId: 'wwf',
        title: 'Save the Tigers: Conservation Mission',
        description: 'Help protect endangered tigers through habitat conservation and anti-poaching efforts.',
        contentType: ContentType.CONSERVATION_CHALLENGE,
        educationalMaterial: {
          facts: [
            'Tigers are solitary hunters and can leap horizontally up to 33 feet.',
            'A tiger\'s stripes are unique, like human fingerprints.',
            'Tigers are excellent swimmers and often cool off in water during hot days.'
          ],
          researchPapers: [
            {
              title: 'Tiger Population Recovery in Protected Areas',
              authors: ['Dr. Sarah Johnson', 'Dr. Michael Chen'],
              abstract: 'Analysis of tiger population trends in conservation areas over the past decade.',
              url: 'https://example.com/tiger-research',
              publishedDate: new Date('2023-06-15'),
              difficulty: 3
            }
          ],
          videos: [
            {
              title: 'Tiger Conservation Success Stories',
              description: 'Documentary showcasing successful tiger conservation efforts worldwide.',
              url: 'https://example.com/tiger-video',
              duration: 1800,
              thumbnailUrl: '/assets/videos/tiger-conservation-thumb.jpg',
              difficulty: 2
            }
          ],
          interactiveContent: [
            {
              id: 'tiger_habitat_sim',
              title: 'Tiger Habitat Simulation',
              description: 'Interactive simulation showing how habitat changes affect tiger populations.',
              type: InteractiveType.SIMULATION,
              url: 'https://example.com/tiger-sim',
              estimatedTime: 900,
              difficulty: 2
            }
          ],
          quizzes: [
            {
              id: 'tiger_knowledge_quiz',
              title: 'Tiger Conservation Knowledge Quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'How many subspecies of tigers are currently recognized?',
                  options: ['4', '6', '8', '10'],
                  correctAnswer: 1,
                  explanation: 'There are currently 6 recognized subspecies of tigers.'
                }
              ],
              passingScore: 70,
              rewards: [
                {
                  type: RewardType.CURRENCY,
                  value: 100,
                  description: 'Research Points for tiger conservation knowledge',
                  rarity: Rarity.COMMON
                }
              ]
            }
          ]
        },
        rewards: [
          {
            type: RewardType.BADGE,
            value: 1,
            description: 'Tiger Guardian Badge',
            rarity: Rarity.RARE
          },
          {
            type: RewardType.CURRENCY,
            value: 500,
            description: 'Conservation Research Points',
            rarity: Rarity.UNCOMMON
          }
        ],
        targetAudience: ['conservation', 'research'],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31')
      }
    ];

    defaultContent.forEach(content => {
      this.sponsoredContent.set(content.id, content);
    });

    // Initialize sample expert AMAs
    this.initializeSampleAMAs();
    
    // Initialize sample citizen science projects
    this.initializeSampleCitizenScienceProjects();
  }

  /**
   * Initialize sample expert AMAs
   */
  private initializeSampleAMAs(): void {
    const sampleAMAs: ExpertAMA[] = [
      {
        id: 'ama_marine_biologist_2024',
        expertName: 'Dr. Marina Rodriguez',
        expertTitle: 'Marine Biologist & Ocean Conservation Specialist',
        organizationId: 'oceana',
        topic: 'Ocean Conservation and Marine Life Protection',
        description: 'Join Dr. Rodriguez to learn about current marine conservation efforts and how you can help protect our oceans.',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        duration: 3600, // 1 hour
        maxParticipants: 100,
        currentParticipants: 0,
        questions: [],
        rewards: [
          {
            type: RewardType.CURRENCY,
            value: 200,
            description: 'Marine Research Points',
            rarity: Rarity.UNCOMMON
          },
          {
            type: RewardType.BADGE,
            value: 1,
            description: 'Ocean Explorer Badge',
            rarity: Rarity.RARE
          }
        ],
        isActive: true
      },
      {
        id: 'ama_primatologist_2024',
        expertName: 'Dr. James Goodwin',
        expertTitle: 'Primatologist & Wildlife Researcher',
        organizationId: 'jane_goodall_institute',
        topic: 'Primate Behavior and Conservation',
        description: 'Discover the fascinating world of primates and learn about ongoing conservation efforts.',
        scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        duration: 2700, // 45 minutes
        maxParticipants: 75,
        currentParticipants: 0,
        questions: [],
        rewards: [
          {
            type: RewardType.CURRENCY,
            value: 250,
            description: 'Primate Research Points',
            rarity: Rarity.UNCOMMON
          }
        ],
        isActive: true
      }
    ];

    sampleAMAs.forEach(ama => {
      this.expertAMAs.set(ama.id, ama);
    });
  }

  /**
   * Initialize sample citizen science projects
   */
  private initializeSampleCitizenScienceProjects(): void {
    const sampleProjects: CitizenScienceProject[] = [
      {
        id: 'cs_bird_migration_2024',
        organizationId: 'wwf',
        title: 'Global Bird Migration Tracking',
        description: 'Help scientists track bird migration patterns by reporting sightings in your area.',
        objectives: [
          'Record bird species sightings',
          'Note migration timing and routes',
          'Document habitat conditions'
        ],
        dataCollectionType: DataCollectionType.ANIMAL_SIGHTING,
        targetSpecies: ['eagle', 'hawk', 'falcon', 'owl', 'crane'],
        targetHabitats: [HabitatType.FOREST, HabitatType.GRASSLAND, HabitatType.MOUNTAIN],
        rewards: [
          {
            type: RewardType.CURRENCY,
            value: 50,
            description: 'Research Points per verified sighting',
            rarity: Rarity.COMMON
          },
          {
            type: RewardType.BADGE,
            value: 1,
            description: 'Citizen Scientist Badge',
            rarity: Rarity.UNCOMMON
          }
        ],
        isActive: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        participantCount: 0,
        dataPointsCollected: 0
      },
      {
        id: 'cs_coral_reef_health_2024',
        organizationId: 'oceana',
        title: 'Coral Reef Health Assessment',
        description: 'Contribute to coral reef conservation by documenting reef conditions and marine life.',
        objectives: [
          'Assess coral health and coverage',
          'Document marine species diversity',
          'Record environmental conditions'
        ],
        dataCollectionType: DataCollectionType.HABITAT_CONDITION,
        targetSpecies: ['coral', 'fish', 'turtle', 'shark', 'ray'],
        targetHabitats: [HabitatType.OCEAN],
        rewards: [
          {
            type: RewardType.CURRENCY,
            value: 75,
            description: 'Marine Research Points per assessment',
            rarity: Rarity.UNCOMMON
          },
          {
            type: RewardType.ANIMAL_ACCESS,
            value: 1,
            description: 'Access to rare marine animals',
            rarity: Rarity.RARE
          }
        ],
        isActive: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        participantCount: 0,
        dataPointsCollected: 0
      }
    ];

    sampleProjects.forEach(project => {
      this.citizenScienceProjects.set(project.id, project);
    });
  }

  /**
   * Get all active wildlife organizations
   */
  public getActiveOrganizations(): WildlifeOrganization[] {
    return Array.from(this.organizations.values()).filter(org => org.isActive);
  }

  /**
   * Get organization by ID
   */
  public getOrganization(organizationId: string): WildlifeOrganization | undefined {
    return this.organizations.get(organizationId);
  }

  /**
   * Get sponsored content for a trainer based on their specialization and progress
   */
  public getSponsoredContent(trainerProfile: TrainerProfile): SponsoredContent[] {
    const activeContent = Array.from(this.sponsoredContent.values())
      .filter(content => content.isActive)
      .filter(content => !content.expiresAt || content.expiresAt > new Date());

    // Filter by trainer specialization and level
    return activeContent.filter(content => {
      if (content.targetAudience.length === 0) return true;
      
      const matchesSpecialization = content.targetAudience.includes(trainerProfile.specialization);
      const matchesLevel = trainerProfile.level >= 5; // Minimum level for sponsored content
      
      return matchesSpecialization && matchesLevel;
    });
  }

  /**
   * Complete sponsored content and award rewards
   */
  public async completeSponsoredContent(
    trainerId: string,
    contentId: string,
    completionData: any
  ): Promise<{ success: boolean; rewards: SponsoredReward[]; impactPoints: number }> {
    const content = this.sponsoredContent.get(contentId);
    if (!content || !content.isActive) {
      return { success: false, rewards: [], impactPoints: 0 };
    }

    // Calculate impact points based on content type and completion quality
    let impactPoints = this.calculateImpactPoints(content, completionData);

    // Update conservation impact
    await this.updateConservationImpact(trainerId, content.organizationId, impactPoints);

    // Process donation if applicable
    if (content.contentType === ContentType.CONSERVATION_CHALLENGE) {
      await this.processDonation(trainerId, content.organizationId, impactPoints * 0.01); // $0.01 per impact point
    }

    return {
      success: true,
      rewards: content.rewards,
      impactPoints
    };
  }

  /**
   * Calculate impact points based on content completion
   */
  private calculateImpactPoints(content: SponsoredContent, completionData: any): number {
    let basePoints = 50;

    switch (content.contentType) {
      case ContentType.CONSERVATION_CHALLENGE:
        basePoints = 100;
        break;
      case ContentType.RESEARCH_PROJECT:
        basePoints = 150;
        break;
      case ContentType.EDUCATIONAL_ARTICLE:
        basePoints = 25;
        break;
      case ContentType.EXPERT_AMA:
        basePoints = 75;
        break;
      default:
        basePoints = 50;
    }

    // Bonus for high-quality completion
    if (completionData.qualityScore && completionData.qualityScore > 0.8) {
      basePoints *= 1.5;
    }

    return Math.floor(basePoints);
  }

  /**
   * Update conservation impact tracking
   */
  private async updateConservationImpact(
    trainerId: string,
    organizationId: string,
    impactPoints: number
  ): Promise<void> {
    const impactKey = `${trainerId}_${organizationId}`;
    let impact = this.conservationImpacts.get(impactKey);

    if (!impact) {
      impact = {
        trainerId,
        organizationId,
        totalDonations: 0,
        activitiesCompleted: 0,
        researchContributions: 0,
        impactScore: 0,
        lastContribution: new Date(),
        achievements: []
      };
    }

    impact.activitiesCompleted += 1;
    impact.impactScore += impactPoints;
    impact.lastContribution = new Date();

    // Check for impact achievements
    this.checkImpactAchievements(impact);

    this.conservationImpacts.set(impactKey, impact);
  }

  /**
   * Process donation to conservation organization
   */
  private async processDonation(
    trainerId: string,
    organizationId: string,
    amount: number
  ): Promise<void> {
    const impactKey = `${trainerId}_${organizationId}`;
    let impact = this.conservationImpacts.get(impactKey);

    if (impact) {
      impact.totalDonations += amount;
      this.conservationImpacts.set(impactKey, impact);
    }

    // In a real implementation, this would integrate with payment processing
    console.log(`Donation of $${amount.toFixed(2)} processed for ${organizationId}`);
  }

  /**
   * Check and award impact achievements
   */
  private checkImpactAchievements(impact: ConservationImpact): void {
    const achievements = [];

    if (impact.activitiesCompleted >= 10 && !impact.achievements.includes('conservationist')) {
      achievements.push('conservationist');
    }

    if (impact.impactScore >= 1000 && !impact.achievements.includes('impact_champion')) {
      achievements.push('impact_champion');
    }

    if (impact.totalDonations >= 50 && !impact.achievements.includes('generous_donor')) {
      achievements.push('generous_donor');
    }

    impact.achievements.push(...achievements);
  }

  /**
   * Get conservation impact for a trainer
   */
  public getConservationImpact(trainerId: string): ConservationImpact[] {
    return Array.from(this.conservationImpacts.values())
      .filter(impact => impact.trainerId === trainerId);
  }

  /**
   * Schedule expert AMA
   */
  public scheduleExpertAMA(amaData: Omit<ExpertAMA, 'id' | 'currentParticipants' | 'questions' | 'isActive'>): string {
    const id = `ama_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ama: ExpertAMA = {
      ...amaData,
      id,
      currentParticipants: 0,
      questions: [],
      isActive: true
    };

    this.expertAMAs.set(id, ama);
    return id;
  }

  /**
   * Get active expert AMAs
   */
  public getActiveAMAs(): ExpertAMA[] {
    return Array.from(this.expertAMAs.values())
      .filter(ama => ama.isActive && ama.scheduledDate > new Date());
  }

  /**
   * Submit question for expert AMA
   */
  public submitAMAQuestion(amaId: string, trainerId: string, question: string): boolean {
    const ama = this.expertAMAs.get(amaId);
    if (!ama || !ama.isActive) {
      return false;
    }

    const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const amaQuestion: AMAQuestion = {
      id: questionId,
      trainerId,
      question,
      upvotes: 0,
      answered: false,
      submittedAt: new Date()
    };

    ama.questions.push(amaQuestion);
    this.expertAMAs.set(amaId, ama);
    return true;
  }

  /**
   * Create citizen science project
   */
  public createCitizenScienceProject(
    projectData: Omit<CitizenScienceProject, 'id' | 'participantCount' | 'dataPointsCollected'>
  ): string {
    const id = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const project: CitizenScienceProject = {
      ...projectData,
      id,
      participantCount: 0,
      dataPointsCollected: 0
    };

    this.citizenScienceProjects.set(id, project);
    return id;
  }

  /**
   * Get active citizen science projects
   */
  public getActiveCitizenScienceProjects(): CitizenScienceProject[] {
    const now = new Date();
    return Array.from(this.citizenScienceProjects.values())
      .filter(project => project.isActive && project.startDate <= now && project.endDate >= now);
  }

  /**
   * Submit data contribution to citizen science project
   */
  public submitDataContribution(
    projectId: string,
    trainerId: string,
    dataType: DataCollectionType,
    data: any,
    location?: string
  ): boolean {
    const project = this.citizenScienceProjects.get(projectId);
    if (!project || !project.isActive) {
      return false;
    }

    const contributionId = `dc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const contribution: DataContribution = {
      id: contributionId,
      projectId,
      trainerId,
      dataType,
      data,
      location,
      timestamp: new Date(),
      verified: false,
      qualityScore: this.calculateDataQualityScore(data, dataType)
    };

    this.dataContributions.set(contributionId, contribution);

    // Update project statistics
    project.dataPointsCollected += 1;
    this.citizenScienceProjects.set(projectId, project);

    return true;
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQualityScore(data: any, dataType: DataCollectionType): number {
    // Simple quality scoring based on data completeness
    let score = 0.5; // Base score

    if (data && typeof data === 'object') {
      const fields = Object.keys(data);
      score += Math.min(0.4, fields.length * 0.1); // Up to 0.4 bonus for completeness
    }

    // Type-specific scoring
    switch (dataType) {
      case DataCollectionType.ANIMAL_SIGHTING:
        if (data.species && data.location && data.timestamp) {
          score += 0.1;
        }
        break;
      case DataCollectionType.BEHAVIOR_OBSERVATION:
        if (data.behavior && data.duration && data.context) {
          score += 0.1;
        }
        break;
    }

    return Math.min(1.0, score);
  }

  /**
   * Get trainer's data contributions
   */
  public getTrainerContributions(trainerId: string): DataContribution[] {
    return Array.from(this.dataContributions.values())
      .filter(contribution => contribution.trainerId === trainerId);
  }

  /**
   * Get total conservation impact across all organizations
   */
  public getTotalConservationImpact(): {
    totalDonations: number;
    totalActivities: number;
    totalResearchContributions: number;
    totalImpactScore: number;
  } {
    const impacts = Array.from(this.conservationImpacts.values());
    
    return {
      totalDonations: impacts.reduce((sum, impact) => sum + impact.totalDonations, 0),
      totalActivities: impacts.reduce((sum, impact) => sum + impact.activitiesCompleted, 0),
      totalResearchContributions: impacts.reduce((sum, impact) => sum + impact.researchContributions, 0),
      totalImpactScore: impacts.reduce((sum, impact) => sum + impact.impactScore, 0)
    };
  }
}