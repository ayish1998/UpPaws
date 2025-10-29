import { Move, MoveCategory } from '../types/animal.js';
import { HabitatType } from '../types/common.js';

/**
 * Database of animal moves based on real animal behaviors
 */
export const ANIMAL_MOVES: Record<string, Move> = {
  // Physical Attacks
  bite: {
    id: 'bite',
    name: 'Bite',
    description: 'A powerful bite attack using sharp teeth.',
    type: HabitatType.FOREST,
    power: 60,
    accuracy: 100,
    energyCost: 10,
    category: MoveCategory.PHYSICAL,
    effects: [
      {
        type: 'flinch',
        chance: 0.3,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 1
  },

  claw: {
    id: 'claw',
    name: 'Claw',
    description: 'Slash with sharp claws.',
    type: HabitatType.FOREST,
    power: 40,
    accuracy: 100,
    energyCost: 8,
    category: MoveCategory.PHYSICAL,
    effects: [
      {
        type: 'critical_boost',
        chance: 0.125,
        value: 1,
        target: 'self'
      }
    ],
    learnLevel: 1
  },

  pounce: {
    id: 'pounce',
    name: 'Pounce',
    description: 'Leap onto the opponent with full body weight.',
    type: HabitatType.GRASSLAND,
    power: 50,
    accuracy: 100,
    energyCost: 12,
    category: MoveCategory.PHYSICAL,
    effects: [],
    learnLevel: 5
  },

  charge: {
    id: 'charge',
    name: 'Charge',
    description: 'Rush forward with tremendous force.',
    type: HabitatType.GRASSLAND,
    power: 90,
    accuracy: 85,
    energyCost: 20,
    category: MoveCategory.PHYSICAL,
    effects: [
      {
        type: 'recoil',
        chance: 1.0,
        value: 25,
        target: 'self'
      }
    ],
    learnLevel: 15
  },

  horn_attack: {
    id: 'horn_attack',
    name: 'Horn Attack',
    description: 'Pierce the opponent with sharp horns.',
    type: HabitatType.GRASSLAND,
    power: 65,
    accuracy: 100,
    energyCost: 15,
    category: MoveCategory.PHYSICAL,
    effects: [],
    learnLevel: 8
  },

  // Aquatic Moves
  water_gun: {
    id: 'water_gun',
    name: 'Water Gun',
    description: 'Spray a powerful jet of water.',
    type: HabitatType.OCEAN,
    power: 40,
    accuracy: 100,
    energyCost: 10,
    category: MoveCategory.SPECIAL,
    effects: [],
    learnLevel: 1
  },

  bubble_beam: {
    id: 'bubble_beam',
    name: 'Bubble Beam',
    description: 'Attack with a stream of bubbles.',
    type: HabitatType.OCEAN,
    power: 65,
    accuracy: 100,
    energyCost: 15,
    category: MoveCategory.SPECIAL,
    effects: [
      {
        type: 'speed_down',
        chance: 0.1,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 12
  },

  tidal_wave: {
    id: 'tidal_wave',
    name: 'Tidal Wave',
    description: 'Summon a massive wave to crash down.',
    type: HabitatType.OCEAN,
    power: 110,
    accuracy: 80,
    energyCost: 25,
    category: MoveCategory.SPECIAL,
    effects: [],
    learnLevel: 25
  },

  // Aerial Moves
  wing_attack: {
    id: 'wing_attack',
    name: 'Wing Attack',
    description: 'Strike with powerful wings.',
    type: HabitatType.MOUNTAIN,
    power: 60,
    accuracy: 100,
    energyCost: 12,
    category: MoveCategory.PHYSICAL,
    effects: [],
    learnLevel: 1
  },

  air_slash: {
    id: 'air_slash',
    name: 'Air Slash',
    description: 'Cut through the air with razor-sharp wind.',
    type: HabitatType.MOUNTAIN,
    power: 75,
    accuracy: 95,
    energyCost: 18,
    category: MoveCategory.SPECIAL,
    effects: [
      {
        type: 'flinch',
        chance: 0.3,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 18
  },

  dive_bomb: {
    id: 'dive_bomb',
    name: 'Dive Bomb',
    description: 'Dive from great height with devastating force.',
    type: HabitatType.MOUNTAIN,
    power: 100,
    accuracy: 95,
    energyCost: 20,
    category: MoveCategory.PHYSICAL,
    effects: [],
    learnLevel: 22
  },

  // Desert Moves
  sand_attack: {
    id: 'sand_attack',
    name: 'Sand Attack',
    description: 'Throw sand to reduce accuracy.',
    type: HabitatType.DESERT,
    power: 0,
    accuracy: 100,
    energyCost: 5,
    category: MoveCategory.STATUS,
    effects: [
      {
        type: 'accuracy_down',
        chance: 1.0,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 1
  },

  sandstorm: {
    id: 'sandstorm',
    name: 'Sandstorm',
    description: 'Create a swirling sandstorm.',
    type: HabitatType.DESERT,
    power: 0,
    accuracy: 100,
    energyCost: 15,
    category: MoveCategory.STATUS,
    effects: [
      {
        type: 'weather_sandstorm',
        chance: 1.0,
        value: 5,
        target: 'field'
      }
    ],
    learnLevel: 20
  },

  heat_wave: {
    id: 'heat_wave',
    name: 'Heat Wave',
    description: 'Blast the opponent with scorching hot air.',
    type: HabitatType.DESERT,
    power: 95,
    accuracy: 90,
    energyCost: 20,
    category: MoveCategory.SPECIAL,
    effects: [
      {
        type: 'burn',
        chance: 0.1,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 28
  },

  // Arctic Moves
  ice_shard: {
    id: 'ice_shard',
    name: 'Ice Shard',
    description: 'Launch sharp ice crystals.',
    type: HabitatType.ARCTIC,
    power: 40,
    accuracy: 100,
    energyCost: 8,
    category: MoveCategory.PHYSICAL,
    effects: [
      {
        type: 'priority',
        chance: 1.0,
        value: 1,
        target: 'self'
      }
    ],
    learnLevel: 1
  },

  blizzard: {
    id: 'blizzard',
    name: 'Blizzard',
    description: 'Summon a devastating blizzard.',
    type: HabitatType.ARCTIC,
    power: 110,
    accuracy: 70,
    energyCost: 25,
    category: MoveCategory.SPECIAL,
    effects: [
      {
        type: 'freeze',
        chance: 0.1,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 30
  },

  frost_breath: {
    id: 'frost_breath',
    name: 'Frost Breath',
    description: 'Exhale freezing cold breath.',
    type: HabitatType.ARCTIC,
    power: 60,
    accuracy: 90,
    energyCost: 12,
    category: MoveCategory.SPECIAL,
    effects: [
      {
        type: 'critical_guaranteed',
        chance: 1.0,
        value: 1,
        target: 'self'
      }
    ],
    learnLevel: 16
  },

  // Jungle Moves
  vine_whip: {
    id: 'vine_whip',
    name: 'Vine Whip',
    description: 'Lash out with flexible vines.',
    type: HabitatType.JUNGLE,
    power: 45,
    accuracy: 100,
    energyCost: 10,
    category: MoveCategory.PHYSICAL,
    effects: [],
    learnLevel: 1
  },

  poison_sting: {
    id: 'poison_sting',
    name: 'Poison Sting',
    description: 'Inject venom with a sharp stinger.',
    type: HabitatType.JUNGLE,
    power: 15,
    accuracy: 100,
    energyCost: 8,
    category: MoveCategory.PHYSICAL,
    effects: [
      {
        type: 'poison',
        chance: 0.3,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 1
  },

  camouflage: {
    id: 'camouflage',
    name: 'Camouflage',
    description: 'Blend into surroundings to avoid attacks.',
    type: HabitatType.JUNGLE,
    power: 0,
    accuracy: 100,
    energyCost: 10,
    category: MoveCategory.STATUS,
    effects: [
      {
        type: 'evasion_up',
        chance: 1.0,
        value: 2,
        target: 'self'
      }
    ],
    learnLevel: 14
  },

  // Status and Support Moves
  roar: {
    id: 'roar',
    name: 'Roar',
    description: 'Let out a terrifying roar to intimidate.',
    type: HabitatType.FOREST,
    power: 0,
    accuracy: 100,
    energyCost: 8,
    category: MoveCategory.STATUS,
    effects: [
      {
        type: 'attack_down',
        chance: 1.0,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 6
  },

  howl: {
    id: 'howl',
    name: 'Howl',
    description: 'Howl to boost attack power.',
    type: HabitatType.FOREST,
    power: 0,
    accuracy: 100,
    energyCost: 8,
    category: MoveCategory.STATUS,
    effects: [
      {
        type: 'attack_up',
        chance: 1.0,
        value: 1,
        target: 'self'
      }
    ],
    learnLevel: 9
  },

  rest: {
    id: 'rest',
    name: 'Rest',
    description: 'Sleep to restore health completely.',
    type: HabitatType.FOREST,
    power: 0,
    accuracy: 100,
    energyCost: 0,
    category: MoveCategory.STATUS,
    effects: [
      {
        type: 'heal_full',
        chance: 1.0,
        value: 100,
        target: 'self'
      },
      {
        type: 'sleep',
        chance: 1.0,
        value: 2,
        target: 'self'
      }
    ],
    learnLevel: 24
  },

  agility: {
    id: 'agility',
    name: 'Agility',
    description: 'Increase speed dramatically.',
    type: HabitatType.GRASSLAND,
    power: 0,
    accuracy: 100,
    energyCost: 10,
    category: MoveCategory.STATUS,
    effects: [
      {
        type: 'speed_up',
        chance: 1.0,
        value: 2,
        target: 'self'
      }
    ],
    learnLevel: 18
  },

  // Signature Moves
  kings_roar: {
    id: 'kings_roar',
    name: "King's Roar",
    description: 'A mighty roar that shakes the very ground.',
    type: HabitatType.GRASSLAND,
    power: 90,
    accuracy: 100,
    energyCost: 20,
    category: MoveCategory.SPECIAL,
    effects: [
      {
        type: 'attack_down',
        chance: 0.5,
        value: 1,
        target: 'opponent'
      },
      {
        type: 'defense_down',
        chance: 0.5,
        value: 1,
        target: 'opponent'
      }
    ],
    learnLevel: 35
  },

  pack_hunt: {
    id: 'pack_hunt',
    name: 'Pack Hunt',
    description: 'Coordinate with allies for a devastating attack.',
    type: HabitatType.FOREST,
    power: 70,
    accuracy: 100,
    energyCost: 18,
    category: MoveCategory.PHYSICAL,
    effects: [
      {
        type: 'critical_boost',
        chance: 0.5,
        value: 1,
        target: 'self'
      }
    ],
    learnLevel: 26
  },

  apex_strike: {
    id: 'apex_strike',
    name: 'Apex Strike',
    description: 'The ultimate predator attack.',
    type: HabitatType.FOREST,
    power: 120,
    accuracy: 85,
    energyCost: 30,
    category: MoveCategory.PHYSICAL,
    effects: [
      {
        type: 'recoil',
        chance: 1.0,
        value: 33,
        target: 'self'
      }
    ],
    learnLevel: 40
  }
};

/**
 * Get moves that an animal can learn based on its habitat and level
 */
export function getLearnableMoves(habitatTypes: HabitatType[], level: number): Move[] {
  const availableMoves: Move[] = [];
  
  for (const move of Object.values(ANIMAL_MOVES)) {
    // Check if animal can learn this move based on habitat
    const canLearnByHabitat = habitatTypes.includes(move.type) || 
                             move.type === HabitatType.FOREST; // Forest moves are universal
    
    // Check if animal is high enough level
    const canLearnByLevel = level >= move.learnLevel;
    
    if (canLearnByHabitat && canLearnByLevel) {
      availableMoves.push(move);
    }
  }
  
  return availableMoves;
}

/**
 * Get a random set of moves for an animal
 */
export function generateRandomMoves(habitatTypes: HabitatType[], level: number, count: number = 4): Move[] {
  const learnableMoves = getLearnableMoves(habitatTypes, level);
  
  if (learnableMoves.length <= count) {
    return learnableMoves;
  }
  
  // Shuffle and take first 'count' moves
  const shuffled = [...learnableMoves].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get moves by category
 */
export function getMovesByCategory(category: MoveCategory): Move[] {
  return Object.values(ANIMAL_MOVES).filter(move => move.category === category);
}

/**
 * Get moves by habitat type
 */
export function getMovesByHabitat(habitatType: HabitatType): Move[] {
  return Object.values(ANIMAL_MOVES).filter(move => move.type === habitatType);
}

/**
 * Get signature moves (high level, powerful moves)
 */
export function getSignatureMoves(): Move[] {
  return Object.values(ANIMAL_MOVES).filter(move => move.learnLevel >= 30);
}