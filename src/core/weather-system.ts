import { HabitatType } from '../types/common.js';
import { WeatherEffect } from '../types/habitat.js';

export interface WeatherCondition {
  id: string;
  name: string;
  description: string;
  type: WeatherType;
  intensity: number; // 0.0 to 1.0
  duration: number; // hours
  startTime: Date;
  endTime: Date;
  effects: WeatherGameEffect[];
  visualEffects: VisualEffect[];
  soundEffects: string[];
}

export enum WeatherType {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  STORMY = 'stormy',
  FOGGY = 'foggy',
  SNOWY = 'snowy',
  BLIZZARD = 'blizzard',
  SANDSTORM = 'sandstorm',
  AURORA = 'aurora',
  HEAT_WAVE = 'heat_wave',
  DROUGHT = 'drought',
  FLOOD = 'flood'
}

export interface WeatherGameEffect {
  type: 'encounter_rate' | 'visibility' | 'movement_speed' | 'capture_rate' | 'energy_drain' | 'special_spawns';
  modifier: number;
  affectedTypes?: HabitatType[];
  description: string;
}

export interface VisualEffect {
  type: 'particles' | 'lighting' | 'color_filter' | 'animation';
  intensity: number;
  parameters: Record<string, any>;
}

export interface WeatherForecast {
  habitatId: string;
  current: WeatherCondition;
  hourly: WeatherCondition[];
  daily: DailyWeatherSummary[];
}

export interface DailyWeatherSummary {
  date: Date;
  primaryWeather: WeatherType;
  temperature: TemperatureRange;
  precipitation: number;
  specialEvents: string[];
}

export interface TemperatureRange {
  min: number;
  max: number;
  unit: 'celsius' | 'fahrenheit';
}

export class WeatherSystem {
  private static instance: WeatherSystem;
  private currentWeather: Map<string, WeatherCondition> = new Map();
  private weatherHistory: Map<string, WeatherCondition[]> = new Map();
  private weatherPatterns: Map<HabitatType, WeatherPattern> = new Map();
  private seasonalModifiers: Map<string, SeasonalModifier> = new Map();

  private constructor() {
    this.initializeWeatherPatterns();
    this.initializeSeasonalModifiers();
    this.startWeatherSystem();
  }

  public static getInstance(): WeatherSystem {
    if (!WeatherSystem.instance) {
      WeatherSystem.instance = new WeatherSystem();
    }
    return WeatherSystem.instance;
  }

  private initializeWeatherPatterns(): void {
    // Define weather patterns for each habitat type
    this.weatherPatterns.set(HabitatType.FOREST, {
      commonWeathers: [
        { type: WeatherType.CLEAR, probability: 0.4 },
        { type: WeatherType.CLOUDY, probability: 0.3 },
        { type: WeatherType.RAINY, probability: 0.2 },
        { type: WeatherType.FOGGY, probability: 0.1 }
      ],
      rareWeathers: [
        { type: WeatherType.STORMY, probability: 0.05, conditions: ['high_humidity'] }
      ],
      temperatureRange: { min: 5, max: 25 },
      seasonalVariation: 0.8
    });

    this.weatherPatterns.set(HabitatType.OCEAN, {
      commonWeathers: [
        { type: WeatherType.CLEAR, probability: 0.3 },
        { type: WeatherType.CLOUDY, probability: 0.3 },
        { type: WeatherType.RAINY, probability: 0.2 },
        { type: WeatherType.STORMY, probability: 0.2 }
      ],
      rareWeathers: [
        { type: WeatherType.FLOOD, probability: 0.02, conditions: ['storm_surge'] }
      ],
      temperatureRange: { min: 10, max: 30 },
      seasonalVariation: 0.6
    });

    this.weatherPatterns.set(HabitatType.DESERT, {
      commonWeathers: [
        { type: WeatherType.CLEAR, probability: 0.6 },
        { type: WeatherType.HEAT_WAVE, probability: 0.25 },
        { type: WeatherType.SANDSTORM, probability: 0.15 }
      ],
      rareWeathers: [
        { type: WeatherType.DROUGHT, probability: 0.1, conditions: ['extreme_heat'] },
        { type: WeatherType.RAINY, probability: 0.01, conditions: ['rare_precipitation'] }
      ],
      temperatureRange: { min: 20, max: 50 },
      seasonalVariation: 0.4
    });

    this.weatherPatterns.set(HabitatType.ARCTIC, {
      commonWeathers: [
        { type: WeatherType.SNOWY, probability: 0.4 },
        { type: WeatherType.CLOUDY, probability: 0.3 },
        { type: WeatherType.CLEAR, probability: 0.2 },
        { type: WeatherType.BLIZZARD, probability: 0.1 }
      ],
      rareWeathers: [
        { type: WeatherType.AURORA, probability: 0.05, conditions: ['solar_activity'] }
      ],
      temperatureRange: { min: -30, max: 5 },
      seasonalVariation: 0.9
    });

    this.weatherPatterns.set(HabitatType.MOUNTAIN, {
      commonWeathers: [
        { type: WeatherType.CLEAR, probability: 0.35 },
        { type: WeatherType.CLOUDY, probability: 0.25 },
        { type: WeatherType.SNOWY, probability: 0.2 },
        { type: WeatherType.FOGGY, probability: 0.2 }
      ],
      rareWeathers: [
        { type: WeatherType.BLIZZARD, probability: 0.08, conditions: ['high_altitude'] }
      ],
      temperatureRange: { min: -10, max: 15 },
      seasonalVariation: 0.7
    });

    this.weatherPatterns.set(HabitatType.GRASSLAND, {
      commonWeathers: [
        { type: WeatherType.CLEAR, probability: 0.4 },
        { type: WeatherType.CLOUDY, probability: 0.3 },
        { type: WeatherType.RAINY, probability: 0.2 },
        { type: WeatherType.STORMY, probability: 0.1 }
      ],
      rareWeathers: [
        { type: WeatherType.DROUGHT, probability: 0.03, conditions: ['extended_dry_period'] }
      ],
      temperatureRange: { min: 0, max: 35 },
      seasonalVariation: 0.8
    });

    this.weatherPatterns.set(HabitatType.JUNGLE, {
      commonWeathers: [
        { type: WeatherType.RAINY, probability: 0.4 },
        { type: WeatherType.CLOUDY, probability: 0.3 },
        { type: WeatherType.STORMY, probability: 0.2 },
        { type: WeatherType.CLEAR, probability: 0.1 }
      ],
      rareWeathers: [
        { type: WeatherType.FLOOD, probability: 0.05, conditions: ['heavy_rainfall'] }
      ],
      temperatureRange: { min: 20, max: 35 },
      seasonalVariation: 0.3
    });
  }

  private initializeSeasonalModifiers(): void {
    // Spring modifiers
    this.seasonalModifiers.set('spring', {
      temperatureModifier: 0.1,
      precipitationModifier: 1.2,
      weatherTypeModifiers: new Map([
        [WeatherType.RAINY, 1.3],
        [WeatherType.CLEAR, 1.1],
        [WeatherType.STORMY, 0.8]
      ]),
      specialEvents: ['migration_boost', 'breeding_season']
    });

    // Summer modifiers
    this.seasonalModifiers.set('summer', {
      temperatureModifier: 0.3,
      precipitationModifier: 0.8,
      weatherTypeModifiers: new Map([
        [WeatherType.CLEAR, 1.4],
        [WeatherType.HEAT_WAVE, 1.5],
        [WeatherType.DROUGHT, 1.3],
        [WeatherType.SNOWY, 0.1]
      ]),
      specialEvents: ['heat_adaptation', 'water_seeking']
    });

    // Autumn modifiers
    this.seasonalModifiers.set('autumn', {
      temperatureModifier: -0.1,
      precipitationModifier: 1.1,
      weatherTypeModifiers: new Map([
        [WeatherType.CLOUDY, 1.2],
        [WeatherType.FOGGY, 1.3],
        [WeatherType.STORMY, 1.1]
      ]),
      specialEvents: ['migration_preparation', 'food_gathering']
    });

    // Winter modifiers
    this.seasonalModifiers.set('winter', {
      temperatureModifier: -0.3,
      precipitationModifier: 0.9,
      weatherTypeModifiers: new Map([
        [WeatherType.SNOWY, 1.5],
        [WeatherType.BLIZZARD, 1.3],
        [WeatherType.CLEAR, 0.8],
        [WeatherType.HEAT_WAVE, 0.1]
      ]),
      specialEvents: ['hibernation_period', 'resource_scarcity']
    });
  }

  private startWeatherSystem(): void {
    // Initialize weather for all habitats
    const habitatIds = [
      'enchanted_forest', 'crystal_ocean', 'golden_desert', 
      'frozen_peaks', 'emerald_jungle', 'savanna_plains', 'sky_mountains'
    ];

    habitatIds.forEach(habitatId => {
      const weather = this.generateInitialWeather(habitatId);
      this.currentWeather.set(habitatId, weather);
    });

    // Update weather every hour
    setInterval(() => {
      this.updateAllWeather();
    }, 3600000); // 1 hour

    // Update weather every 15 minutes for more dynamic changes
    setInterval(() => {
      this.updateWeatherIntensity();
    }, 900000); // 15 minutes
  }

  private generateInitialWeather(habitatId: string): WeatherCondition {
    const habitatType = this.getHabitatTypeFromId(habitatId);
    const pattern = this.weatherPatterns.get(habitatType);
    
    if (!pattern) {
      return this.createDefaultWeather(habitatId);
    }

    const weatherType = this.selectWeatherType(pattern);
    return this.createWeatherCondition(habitatId, weatherType);
  }

  private selectWeatherType(pattern: WeatherPattern): WeatherType {
    const random = Math.random();
    let cumulative = 0;

    // Check common weathers first
    for (const weather of pattern.commonWeathers) {
      cumulative += weather.probability;
      if (random <= cumulative) {
        return weather.type;
      }
    }

    // Check rare weathers
    for (const weather of pattern.rareWeathers) {
      if (this.checkRareWeatherConditions(weather.conditions)) {
        cumulative += weather.probability;
        if (random <= cumulative) {
          return weather.type;
        }
      }
    }

    // Default to clear weather
    return WeatherType.CLEAR;
  }

  private checkRareWeatherConditions(conditions: string[]): boolean {
    // Simplified condition checking
    return Math.random() < 0.1; // 10% chance for rare weather conditions to be met
  }

  private createWeatherCondition(habitatId: string, type: WeatherType): WeatherCondition {
    const now = new Date();
    const duration = this.getWeatherDuration(type);
    const endTime = new Date(now.getTime() + duration * 60 * 60 * 1000);

    return {
      id: `${habitatId}_${type}_${now.getTime()}`,
      name: this.getWeatherName(type),
      description: this.getWeatherDescription(type),
      type,
      intensity: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      duration,
      startTime: now,
      endTime,
      effects: this.getWeatherEffects(type),
      visualEffects: this.getVisualEffects(type),
      soundEffects: this.getSoundEffects(type)
    };
  }

  private getWeatherDuration(type: WeatherType): number {
    const baseDurations = {
      [WeatherType.CLEAR]: 6,
      [WeatherType.CLOUDY]: 4,
      [WeatherType.RAINY]: 3,
      [WeatherType.STORMY]: 2,
      [WeatherType.FOGGY]: 4,
      [WeatherType.SNOWY]: 5,
      [WeatherType.BLIZZARD]: 1,
      [WeatherType.SANDSTORM]: 2,
      [WeatherType.AURORA]: 8,
      [WeatherType.HEAT_WAVE]: 12,
      [WeatherType.DROUGHT]: 24,
      [WeatherType.FLOOD]: 6
    };

    const base = baseDurations[type] || 4;
    return base + Math.random() * 2 - 1; // ±1 hour variation
  }

  private getWeatherName(type: WeatherType): string {
    const names = {
      [WeatherType.CLEAR]: 'Clear Skies',
      [WeatherType.CLOUDY]: 'Overcast',
      [WeatherType.RAINY]: 'Light Rain',
      [WeatherType.STORMY]: 'Thunderstorm',
      [WeatherType.FOGGY]: 'Dense Fog',
      [WeatherType.SNOWY]: 'Snowfall',
      [WeatherType.BLIZZARD]: 'Blizzard',
      [WeatherType.SANDSTORM]: 'Sandstorm',
      [WeatherType.AURORA]: 'Aurora Borealis',
      [WeatherType.HEAT_WAVE]: 'Heat Wave',
      [WeatherType.DROUGHT]: 'Drought',
      [WeatherType.FLOOD]: 'Flooding'
    };

    return names[type] || 'Unknown Weather';
  }

  private getWeatherDescription(type: WeatherType): string {
    const descriptions = {
      [WeatherType.CLEAR]: 'Perfect visibility with bright sunshine.',
      [WeatherType.CLOUDY]: 'Overcast skies with reduced sunlight.',
      [WeatherType.RAINY]: 'Gentle rainfall creating puddles and streams.',
      [WeatherType.STORMY]: 'Heavy rain with thunder and lightning.',
      [WeatherType.FOGGY]: 'Thick fog reducing visibility significantly.',
      [WeatherType.SNOWY]: 'Gentle snowfall covering the landscape.',
      [WeatherType.BLIZZARD]: 'Intense snowstorm with strong winds.',
      [WeatherType.SANDSTORM]: 'Swirling sand reducing visibility.',
      [WeatherType.AURORA]: 'Magical lights dancing across the sky.',
      [WeatherType.HEAT_WAVE]: 'Extreme temperatures affecting all life.',
      [WeatherType.DROUGHT]: 'Extended dry period with water scarcity.',
      [WeatherType.FLOOD]: 'Rising water levels affecting the terrain.'
    };

    return descriptions[type] || 'Weather conditions are unusual.';
  }

  private getWeatherEffects(type: WeatherType): WeatherGameEffect[] {
    const effectMap = {
      [WeatherType.CLEAR]: [
        { type: 'encounter_rate' as const, modifier: 1.1, description: 'Increased animal activity' },
        { type: 'visibility' as const, modifier: 1.2, description: 'Perfect visibility' }
      ],
      [WeatherType.CLOUDY]: [
        { type: 'encounter_rate' as const, modifier: 0.95, description: 'Slightly reduced activity' }
      ],
      [WeatherType.RAINY]: [
        { type: 'encounter_rate' as const, modifier: 0.8, description: 'Animals seek shelter' },
        { type: 'visibility' as const, modifier: 0.7, description: 'Reduced visibility' },
        { type: 'special_spawns' as const, modifier: 1.3, description: 'Water-loving animals appear', affectedTypes: [HabitatType.FOREST, HabitatType.JUNGLE] }
      ],
      [WeatherType.STORMY]: [
        { type: 'encounter_rate' as const, modifier: 0.5, description: 'Most animals hide' },
        { type: 'visibility' as const, modifier: 0.4, description: 'Very poor visibility' },
        { type: 'movement_speed' as const, modifier: 0.7, description: 'Difficult movement' }
      ],
      [WeatherType.FOGGY]: [
        { type: 'visibility' as const, modifier: 0.3, description: 'Extremely poor visibility' },
        { type: 'encounter_rate' as const, modifier: 0.9, description: 'Animals harder to spot' },
        { type: 'special_spawns' as const, modifier: 1.5, description: 'Mysterious creatures emerge' }
      ],
      [WeatherType.SNOWY]: [
        { type: 'encounter_rate' as const, modifier: 0.7, description: 'Cold-adapted animals active', affectedTypes: [HabitatType.ARCTIC, HabitatType.MOUNTAIN] },
        { type: 'movement_speed' as const, modifier: 0.8, description: 'Slower movement in snow' }
      ],
      [WeatherType.BLIZZARD]: [
        { type: 'encounter_rate' as const, modifier: 0.3, description: 'Extreme weather drives animals to shelter' },
        { type: 'visibility' as const, modifier: 0.2, description: 'Near-zero visibility' },
        { type: 'energy_drain' as const, modifier: 1.5, description: 'Increased energy consumption' }
      ],
      [WeatherType.SANDSTORM]: [
        { type: 'encounter_rate' as const, modifier: 0.4, description: 'Desert animals burrow deep' },
        { type: 'visibility' as const, modifier: 0.3, description: 'Sand blocks vision' },
        { type: 'movement_speed' as const, modifier: 0.6, description: 'Difficult to move in sand' }
      ],
      [WeatherType.AURORA]: [
        { type: 'encounter_rate' as const, modifier: 1.5, description: 'Magical energy attracts rare creatures' },
        { type: 'special_spawns' as const, modifier: 2.0, description: 'Aurora-touched variants appear' },
        { type: 'capture_rate' as const, modifier: 1.2, description: 'Animals mesmerized by lights' }
      ],
      [WeatherType.HEAT_WAVE]: [
        { type: 'encounter_rate' as const, modifier: 0.6, description: 'Animals seek shade' },
        { type: 'energy_drain' as const, modifier: 1.3, description: 'Heat exhaustion risk' },
        { type: 'special_spawns' as const, modifier: 1.4, description: 'Heat-adapted species active', affectedTypes: [HabitatType.DESERT] }
      ],
      [WeatherType.DROUGHT]: [
        { type: 'encounter_rate' as const, modifier: 0.5, description: 'Water sources attract desperate animals' },
        { type: 'special_spawns' as const, modifier: 0.3, description: 'Many species migrate away' }
      ],
      [WeatherType.FLOOD]: [
        { type: 'encounter_rate' as const, modifier: 0.7, description: 'Animals displaced by water' },
        { type: 'special_spawns' as const, modifier: 1.8, description: 'Aquatic animals in new areas' },
        { type: 'movement_speed' as const, modifier: 0.5, description: 'Difficult terrain navigation' }
      ]
    };

    return effectMap[type] || [];
  }

  private getVisualEffects(type: WeatherType): VisualEffect[] {
    const visualMap = {
      [WeatherType.RAINY]: [
        { type: 'particles' as const, intensity: 0.7, parameters: { particleType: 'rain', density: 100 } }
      ],
      [WeatherType.SNOWY]: [
        { type: 'particles' as const, intensity: 0.6, parameters: { particleType: 'snow', density: 80 } }
      ],
      [WeatherType.FOGGY]: [
        { type: 'color_filter' as const, intensity: 0.8, parameters: { opacity: 0.6, color: '#cccccc' } }
      ],
      [WeatherType.AURORA]: [
        { type: 'lighting' as const, intensity: 1.0, parameters: { colors: ['#00ff88', '#0088ff', '#ff0088'], movement: 'wave' } }
      ],
      [WeatherType.SANDSTORM]: [
        { type: 'particles' as const, intensity: 0.9, parameters: { particleType: 'sand', density: 150 } },
        { type: 'color_filter' as const, intensity: 0.7, parameters: { opacity: 0.5, color: '#cc9966' } }
      ]
    };

    return visualMap[type] || [];
  }

  private getSoundEffects(type: WeatherType): string[] {
    const soundMap = {
      [WeatherType.RAINY]: ['/audio/weather/rain_light.mp3'],
      [WeatherType.STORMY]: ['/audio/weather/thunder.mp3', '/audio/weather/rain_heavy.mp3'],
      [WeatherType.BLIZZARD]: ['/audio/weather/wind_strong.mp3'],
      [WeatherType.SANDSTORM]: ['/audio/weather/wind_sand.mp3'],
      [WeatherType.AURORA]: ['/audio/weather/aurora_ambient.mp3']
    };

    return soundMap[type] || [];
  }

  private updateAllWeather(): void {
    this.currentWeather.forEach((weather, habitatId) => {
      if (weather.endTime <= new Date()) {
        // Generate new weather
        const newWeather = this.generateInitialWeather(habitatId);
        this.currentWeather.set(habitatId, newWeather);
        
        // Store in history
        this.addToHistory(habitatId, weather);
      }
    });
  }

  private updateWeatherIntensity(): void {
    this.currentWeather.forEach((weather, habitatId) => {
      // Gradually change intensity for more dynamic weather
      const change = (Math.random() - 0.5) * 0.1; // ±5% change
      weather.intensity = Math.max(0.1, Math.min(1.0, weather.intensity + change));
    });
  }

  private addToHistory(habitatId: string, weather: WeatherCondition): void {
    if (!this.weatherHistory.has(habitatId)) {
      this.weatherHistory.set(habitatId, []);
    }
    
    const history = this.weatherHistory.get(habitatId)!;
    history.push(weather);
    
    // Keep only last 24 hours of history
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.weatherHistory.set(habitatId, history.filter(w => w.startTime > cutoff));
  }

  // Public methods
  public getCurrentWeather(habitatId: string): WeatherCondition | undefined {
    return this.currentWeather.get(habitatId);
  }

  public getWeatherForecast(habitatId: string): WeatherForecast {
    const current = this.getCurrentWeather(habitatId);
    if (!current) {
      throw new Error(`No weather data for habitat ${habitatId}`);
    }

    // Generate hourly forecast (next 12 hours)
    const hourly: WeatherCondition[] = [];
    for (let i = 1; i <= 12; i++) {
      const futureWeather = this.generateFutureWeather(habitatId, i);
      hourly.push(futureWeather);
    }

    // Generate daily forecast (next 7 days)
    const daily: DailyWeatherSummary[] = [];
    for (let i = 1; i <= 7; i++) {
      const dailySummary = this.generateDailySummary(habitatId, i);
      daily.push(dailySummary);
    }

    return {
      habitatId,
      current,
      hourly,
      daily
    };
  }

  private generateFutureWeather(habitatId: string, hoursAhead: number): WeatherCondition {
    // Simplified future weather generation
    const futureTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    const weatherType = this.predictWeatherType(habitatId, hoursAhead);
    
    const weather = this.createWeatherCondition(habitatId, weatherType);
    weather.startTime = futureTime;
    weather.endTime = new Date(futureTime.getTime() + weather.duration * 60 * 60 * 1000);
    
    return weather;
  }

  private predictWeatherType(habitatId: string, hoursAhead: number): WeatherType {
    const current = this.getCurrentWeather(habitatId);
    if (!current) return WeatherType.CLEAR;

    // Simple weather persistence with some randomness
    if (hoursAhead <= 3) {
      // Weather likely to persist for next 3 hours
      return Math.random() < 0.7 ? current.type : this.getRandomWeatherType(habitatId);
    } else {
      // More random for longer forecasts
      return this.getRandomWeatherType(habitatId);
    }
  }

  private getRandomWeatherType(habitatId: string): WeatherType {
    const habitatType = this.getHabitatTypeFromId(habitatId);
    const pattern = this.weatherPatterns.get(habitatType);
    
    if (!pattern) return WeatherType.CLEAR;
    
    return this.selectWeatherType(pattern);
  }

  private generateDailySummary(habitatId: string, daysAhead: number): DailyWeatherSummary {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    
    const primaryWeather = this.getRandomWeatherType(habitatId);
    const habitatType = this.getHabitatTypeFromId(habitatId);
    const pattern = this.weatherPatterns.get(habitatType);
    
    return {
      date,
      primaryWeather,
      temperature: {
        min: (pattern?.temperatureRange.min || 0) + Math.random() * 5,
        max: (pattern?.temperatureRange.max || 25) + Math.random() * 5,
        unit: 'celsius'
      },
      precipitation: Math.random() * 100,
      specialEvents: this.getSpecialEvents(primaryWeather)
    };
  }

  private getSpecialEvents(weatherType: WeatherType): string[] {
    const eventMap = {
      [WeatherType.AURORA]: ['Northern Lights Visible', 'Increased Rare Spawns'],
      [WeatherType.STORMY]: ['Lightning Activity', 'Flash Flood Risk'],
      [WeatherType.DROUGHT]: ['Water Shortage', 'Animal Migration'],
      [WeatherType.FLOOD]: ['High Water Levels', 'Displaced Wildlife']
    };

    return eventMap[weatherType] || [];
  }

  private getHabitatTypeFromId(habitatId: string): HabitatType {
    const typeMap: Record<string, HabitatType> = {
      'enchanted_forest': HabitatType.FOREST,
      'crystal_ocean': HabitatType.OCEAN,
      'golden_desert': HabitatType.DESERT,
      'frozen_peaks': HabitatType.ARCTIC,
      'emerald_jungle': HabitatType.JUNGLE,
      'savanna_plains': HabitatType.GRASSLAND,
      'sky_mountains': HabitatType.MOUNTAIN
    };

    return typeMap[habitatId] || HabitatType.FOREST;
  }

  private createDefaultWeather(habitatId: string): WeatherCondition {
    return this.createWeatherCondition(habitatId, WeatherType.CLEAR);
  }

  public getWeatherHistory(habitatId: string): WeatherCondition[] {
    return this.weatherHistory.get(habitatId) || [];
  }

  public getWeatherEffectsForHabitat(habitatId: string): WeatherGameEffect[] {
    const weather = this.getCurrentWeather(habitatId);
    return weather ? weather.effects : [];
  }
}

// Supporting interfaces
interface WeatherPattern {
  commonWeathers: WeatherProbability[];
  rareWeathers: RareWeatherProbability[];
  temperatureRange: { min: number; max: number };
  seasonalVariation: number;
}

interface WeatherProbability {
  type: WeatherType;
  probability: number;
}

interface RareWeatherProbability extends WeatherProbability {
  conditions: string[];
}

interface SeasonalModifier {
  temperatureModifier: number;
  precipitationModifier: number;
  weatherTypeModifiers: Map<WeatherType, number>;
  specialEvents: string[];
}