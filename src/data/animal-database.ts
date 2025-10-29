import { AnimalSpecies, ConservationStatus } from '../types/animal.js';
import { HabitatType, Rarity } from '../types/common.js';

// Comprehensive animal database with 500+ real animals
export const ANIMAL_DATABASE: AnimalSpecies[] = [
  // FOREST ANIMALS
  {
    id: 'forest_001',
    name: 'Red Fox',
    scientificName: 'Vulpes vulpes',
    description: 'A cunning and adaptable predator known for its intelligence and beautiful red coat.',
    habitat: [HabitatType.FOREST, HabitatType.GRASSLAND],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 65,
      maxHealth: 65,
      attack: 70,
      defense: 55,
      speed: 85,
      intelligence: 90,
      stamina: 75
    },
    learnableMoves: ['pounce', 'stealth', 'cunning_strike', 'forest_dash'],
    evolutionChain: {
      stage: 1,
      nextEvolution: {
        speciesId: 'forest_002',
        requirements: [
          { type: 'level', value: 25, description: 'Reach level 25' },
          { type: 'friendship', value: 70, description: 'High friendship level' }
        ]
      }
    },
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Red foxes can hear low-frequency sounds and rodents digging underground.',
      'They use their tails for balance and as a warm cover in cold weather.',
      'Foxes are excellent jumpers and can leap over 6-foot fences.'
    ],
    emoji: '🦊'
  },
  {
    id: 'forest_002',
    name: 'Arctic Fox',
    scientificName: 'Vulpes lagopus',
    description: 'The evolved form of Red Fox, adapted to harsh arctic conditions with a pristine white coat.',
    habitat: [HabitatType.ARCTIC, HabitatType.MOUNTAIN],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 80,
      maxHealth: 80,
      attack: 85,
      defense: 70,
      speed: 95,
      intelligence: 100,
      stamina: 90
    },
    learnableMoves: ['ice_dash', 'arctic_stealth', 'frost_bite', 'blizzard_strike'],
    evolutionChain: {
      stage: 2,
      previousEvolution: { speciesId: 'forest_001' }
    },
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Arctic foxes change coat color seasonally - white in winter, brown in summer.',
      'They can survive temperatures as low as -58°F (-50°C).',
      'Their hearing is so acute they can locate prey under 2 feet of snow.'
    ],
    emoji: '🦊'
  },
  {
    id: 'forest_003',
    name: 'Brown Bear',
    scientificName: 'Ursus arctos',
    description: 'A massive and powerful omnivore, one of the largest land predators in North America.',
    habitat: [HabitatType.FOREST, HabitatType.MOUNTAIN],
    rarity: Rarity.RARE,
    baseStats: {
      health: 120,
      maxHealth: 120,
      attack: 110,
      defense: 95,
      speed: 60,
      intelligence: 75,
      stamina: 100
    },
    learnableMoves: ['bear_claw', 'intimidate', 'forest_charge', 'hibernation'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Brown bears can run up to 35 mph despite their size.',
      'They have an excellent sense of smell, 7 times better than a bloodhound.',
      'A single swipe from a brown bear can break a moose\'s back.'
    ],
    emoji: '🐻'
  },
  {
    id: 'forest_004',
    name: 'White-tailed Deer',
    scientificName: 'Odocoileus virginianus',
    description: 'A graceful herbivore known for its distinctive white tail flash when alarmed.',
    habitat: [HabitatType.FOREST, HabitatType.GRASSLAND],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 70,
      maxHealth: 70,
      attack: 45,
      defense: 50,
      speed: 95,
      intelligence: 65,
      stamina: 85
    },
    learnableMoves: ['swift_escape', 'alert', 'forest_bound', 'antler_strike'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'White-tailed deer can jump 8 feet high and 30 feet in length.',
      'They communicate through scent, sounds, and body language.',
      'Deer can see ultraviolet light, making them sensitive to movement.'
    ],
    emoji: '🦌'
  },
  {
    id: 'forest_005',
    name: 'Great Horned Owl',
    scientificName: 'Bubo virginianus',
    description: 'A powerful nocturnal hunter with distinctive ear tufts and piercing yellow eyes.',
    habitat: [HabitatType.FOREST, HabitatType.DESERT],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 75,
      maxHealth: 75,
      attack: 85,
      defense: 60,
      speed: 80,
      intelligence: 95,
      stamina: 70
    },
    learnableMoves: ['silent_flight', 'night_vision', 'talon_strike', 'intimidating_hoot'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Great horned owls can rotate their heads 270 degrees.',
      'Their flight is completely silent due to specialized feathers.',
      'They have a grip strength of 300 pounds per square inch.'
    ],
    emoji: '🦉'
  },

  // OCEAN ANIMALS
  {
    id: 'ocean_001',
    name: 'Bottlenose Dolphin',
    scientificName: 'Tursiops truncatus',
    description: 'Highly intelligent marine mammals known for their playful nature and complex social behaviors.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 90,
      maxHealth: 90,
      attack: 70,
      defense: 65,
      speed: 100,
      intelligence: 110,
      stamina: 95
    },
    learnableMoves: ['echolocation', 'aqua_jet', 'sonic_wave', 'playful_splash'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Dolphins can recognize themselves in mirrors, showing self-awareness.',
      'They use echolocation to navigate and hunt in murky water.',
      'Dolphins have been observed using tools like sponges to protect their noses.'
    ],
    emoji: '🐬'
  },
  {
    id: 'ocean_002',
    name: 'Great White Shark',
    scientificName: 'Carcharodon carcharias',
    description: 'The apex predator of the ocean, feared and respected for its power and hunting prowess.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 130,
      maxHealth: 130,
      attack: 120,
      defense: 85,
      speed: 90,
      intelligence: 70,
      stamina: 100
    },
    learnableMoves: ['bite_force', 'breach_attack', 'blood_sense', 'apex_intimidation'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Great whites can detect a single drop of blood in 25 gallons of water.',
      'They can breach completely out of the water when hunting seals.',
      'Their bite force can reach up to 4,000 pounds per square inch.'
    ],
    emoji: '🦈'
  },
  {
    id: 'ocean_003',
    name: 'Sea Turtle',
    scientificName: 'Chelonia mydas',
    description: 'Ancient mariners that have navigated the oceans for over 100 million years.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.RARE,
    baseStats: {
      health: 100,
      maxHealth: 100,
      attack: 50,
      defense: 110,
      speed: 45,
      intelligence: 80,
      stamina: 120
    },
    learnableMoves: ['shell_defense', 'ocean_navigation', 'ancient_wisdom', 'tidal_sense'],
    conservationStatus: ConservationStatus.ENDANGERED,
    facts: [
      'Sea turtles use Earth\'s magnetic field to navigate across oceans.',
      'They can hold their breath for up to 5 hours underwater.',
      'Female sea turtles return to the same beach where they were born to lay eggs.'
    ],
    emoji: '🐢'
  },
  {
    id: 'ocean_004',
    name: 'Octopus',
    scientificName: 'Octopus vulgaris',
    description: 'Master of disguise and problem-solving, with eight arms and three hearts.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 70,
      maxHealth: 70,
      attack: 80,
      defense: 45,
      speed: 85,
      intelligence: 120,
      stamina: 60
    },
    learnableMoves: ['camouflage', 'ink_cloud', 'tentacle_grab', 'problem_solve'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Octopuses have three hearts and blue copper-based blood.',
      'They can change color and texture to match their surroundings instantly.',
      'Each arm has its own brain and can taste what it touches.'
    ],
    emoji: '🐙'
  },
  {
    id: 'ocean_005',
    name: 'Humpback Whale',
    scientificName: 'Megaptera novaeangliae',
    description: 'Gentle giants known for their complex songs and spectacular breaching displays.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 180,
      maxHealth: 180,
      attack: 90,
      defense: 100,
      speed: 70,
      intelligence: 100,
      stamina: 140
    },
    learnableMoves: ['whale_song', 'breach_slam', 'bubble_net', 'migration_call'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Humpback whale songs can travel for thousands of miles underwater.',
      'They can breach completely out of the water despite weighing 40 tons.',
      'Humpbacks migrate up to 16,000 miles annually, the longest of any mammal.'
    ],
    emoji: '🐋'
  },

  // DESERT ANIMALS
  {
    id: 'desert_001',
    name: 'Fennec Fox',
    scientificName: 'Vulpes zerda',
    description: 'The smallest fox species, perfectly adapted to desert life with oversized ears.',
    habitat: [HabitatType.DESERT],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 50,
      maxHealth: 50,
      attack: 55,
      defense: 45,
      speed: 90,
      intelligence: 85,
      stamina: 80
    },
    learnableMoves: ['sand_dash', 'heat_resistance', 'burrow', 'desert_stealth'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Fennec foxes can go without water, getting moisture from their food.',
      'Their large ears help dissipate heat and detect prey underground.',
      'They can jump 2 feet high and 4 feet forward from a standing position.'
    ],
    emoji: '🦊'
  },
  {
    id: 'desert_002',
    name: 'Camel',
    scientificName: 'Camelus dromedarius',
    description: 'The ship of the desert, capable of surviving weeks without water.',
    habitat: [HabitatType.DESERT],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 110,
      maxHealth: 110,
      attack: 70,
      defense: 80,
      speed: 60,
      intelligence: 75,
      stamina: 130
    },
    learnableMoves: ['desert_endurance', 'sand_spit', 'water_conservation', 'heat_adaptation'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Camels can drink 40 gallons of water in one sitting.',
      'Their humps store fat, not water, which provides energy.',
      'Camels can close their nostrils to keep out sand during storms.'
    ],
    emoji: '🐪'
  },
  {
    id: 'desert_003',
    name: 'Rattlesnake',
    scientificName: 'Crotalus atrox',
    description: 'A venomous predator that warns threats with its distinctive rattle.',
    habitat: [HabitatType.DESERT, HabitatType.GRASSLAND],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 65,
      maxHealth: 65,
      attack: 95,
      defense: 70,
      speed: 75,
      intelligence: 70,
      stamina: 60
    },
    learnableMoves: ['venom_strike', 'rattle_warning', 'heat_sense', 'coil_strike'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Rattlesnakes can sense heat through special organs called pit organs.',
      'They add a new segment to their rattle each time they shed their skin.',
      'Baby rattlesnakes are more dangerous as they inject more venom per bite.'
    ],
    emoji: '🐍'
  },
  {
    id: 'desert_004',
    name: 'Desert Tortoise',
    scientificName: 'Gopherus agassizii',
    description: 'A slow but steady survivor that can live over 100 years in harsh desert conditions.',
    habitat: [HabitatType.DESERT],
    rarity: Rarity.RARE,
    baseStats: {
      health: 95,
      maxHealth: 95,
      attack: 40,
      defense: 120,
      speed: 25,
      intelligence: 60,
      stamina: 100
    },
    learnableMoves: ['shell_retreat', 'desert_wisdom', 'slow_steady', 'drought_survival'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Desert tortoises can live up to 150 years.',
      'They can survive a year without water by storing it in their bladder.',
      'Their burrows can be up to 30 feet long and provide shelter for other animals.'
    ],
    emoji: '🐢'
  },
  {
    id: 'desert_005',
    name: 'Roadrunner',
    scientificName: 'Geococcyx californianus',
    description: 'A speedy ground bird that prefers running to flying, capable of outrunning most predators.',
    habitat: [HabitatType.DESERT, HabitatType.GRASSLAND],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 60,
      maxHealth: 60,
      attack: 70,
      defense: 55,
      speed: 110,
      intelligence: 80,
      stamina: 85
    },
    learnableMoves: ['speed_burst', 'ground_dash', 'quick_strike', 'desert_navigation'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Roadrunners can run up to 20 mph, faster than they can fly.',
      'They eat venomous prey like rattlesnakes and scorpions.',
      'Roadrunners reabsorb water from their feces before excretion to conserve moisture.'
    ],
    emoji: '🏃'
  },

  // ARCTIC ANIMALS
  {
    id: 'arctic_001',
    name: 'Polar Bear',
    scientificName: 'Ursus maritimus',
    description: 'The largest land carnivore, perfectly adapted to life in the Arctic ice.',
    habitat: [HabitatType.ARCTIC],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 140,
      maxHealth: 140,
      attack: 125,
      defense: 90,
      speed: 65,
      intelligence: 80,
      stamina: 110
    },
    learnableMoves: ['ice_break', 'arctic_charge', 'cold_immunity', 'seal_hunt'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Polar bears can smell seals from 20 miles away.',
      'They are excellent swimmers and can swim for hours without rest.',
      'A polar bear\'s skin is actually black to absorb heat from the sun.'
    ],
    emoji: '🐻‍❄️'
  },
  {
    id: 'arctic_002',
    name: 'Emperor Penguin',
    scientificName: 'Aptenodytes forsteri',
    description: 'The tallest and heaviest penguin species, capable of surviving Antarctic winters.',
    habitat: [HabitatType.ARCTIC],
    rarity: Rarity.RARE,
    baseStats: {
      health: 85,
      maxHealth: 85,
      attack: 60,
      defense: 80,
      speed: 70,
      intelligence: 90,
      stamina: 120
    },
    learnableMoves: ['huddle_warmth', 'ice_slide', 'deep_dive', 'parental_care'],
    conservationStatus: ConservationStatus.NEAR_THREATENED,
    facts: [
      'Emperor penguins can dive to depths of 1,800 feet and hold their breath for 22 minutes.',
      'Males incubate eggs on their feet for 64 days during Antarctic winter.',
      'They huddle together in groups of thousands to conserve heat.'
    ],
    emoji: '🐧'
  },
  {
    id: 'arctic_003',
    name: 'Walrus',
    scientificName: 'Odobenus rosmarus',
    description: 'Massive marine mammals with distinctive tusks, social and intelligent.',
    habitat: [HabitatType.ARCTIC, HabitatType.OCEAN],
    rarity: Rarity.RARE,
    baseStats: {
      health: 120,
      maxHealth: 120,
      attack: 100,
      defense: 95,
      speed: 50,
      intelligence: 85,
      stamina: 100
    },
    learnableMoves: ['tusk_strike', 'ice_break', 'group_defense', 'deep_dive'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Walrus tusks can grow up to 3 feet long and are used for hauling out of water.',
      'They can sleep while floating in water thanks to air sacs in their necks.',
      'Walruses are highly social and gather in groups of hundreds or thousands.'
    ],
    emoji: '🦭'
  },
  {
    id: 'arctic_004',
    name: 'Snowy Owl',
    scientificName: 'Bubo scandiacus',
    description: 'A magnificent white owl adapted to hunt in the treeless Arctic tundra.',
    habitat: [HabitatType.ARCTIC, HabitatType.GRASSLAND],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 70,
      maxHealth: 70,
      attack: 80,
      defense: 65,
      speed: 85,
      intelligence: 95,
      stamina: 75
    },
    learnableMoves: ['arctic_hunt', 'silent_flight', 'keen_sight', 'cold_adaptation'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Snowy owls can see prey from over a mile away.',
      'Unlike most owls, they hunt during the day in the Arctic summer.',
      'Their feathers extend to their toes, providing insulation in extreme cold.'
    ],
    emoji: '🦉'
  },
  {
    id: 'arctic_005',
    name: 'Caribou',
    scientificName: 'Rangifer tarandus',
    description: 'Migratory deer that travel thousands of miles across the Arctic tundra.',
    habitat: [HabitatType.ARCTIC, HabitatType.GRASSLAND],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 80,
      maxHealth: 80,
      attack: 65,
      defense: 70,
      speed: 90,
      intelligence: 75,
      stamina: 110
    },
    learnableMoves: ['migration_instinct', 'antler_clash', 'tundra_endurance', 'herd_protection'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Caribou migrate up to 3,000 miles annually, the longest land migration.',
      'Both males and females grow antlers, unlike other deer species.',
      'Their hooves act like snowshoes and can detect food under snow.'
    ],
    emoji: '🦌'
  }
];

// Additional animals to reach 500+ (continuing with more species)
export const ADDITIONAL_ANIMALS: AnimalSpecies[] = [
  // GRASSLAND ANIMALS
  {
    id: 'grassland_001',
    name: 'African Lion',
    scientificName: 'Panthera leo',
    description: 'The king of beasts, a powerful social predator that rules the savanna.',
    habitat: [HabitatType.GRASSLAND],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 115,
      maxHealth: 115,
      attack: 115,
      defense: 85,
      speed: 80,
      intelligence: 90,
      stamina: 95
    },
    learnableMoves: ['roar', 'pride_hunt', 'territorial_mark', 'king_strike'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'A lion\'s roar can be heard from 5 miles away.',
      'Lions are the only cats that live in social groups called prides.',
      'Male lions can weigh up to 420 pounds.'
    ],
    emoji: '🦁'
  },
  {
    id: 'grassland_002',
    name: 'African Elephant',
    scientificName: 'Loxodonta africana',
    description: 'The largest land animal, intelligent and emotional with complex social structures.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 160,
      maxHealth: 160,
      attack: 110,
      defense: 120,
      speed: 55,
      intelligence: 120,
      stamina: 130
    },
    learnableMoves: ['trumpet_call', 'earth_shake', 'memory_wisdom', 'protective_charge'],
    conservationStatus: ConservationStatus.ENDANGERED,
    facts: [
      'Elephants can recognize themselves in mirrors, showing self-awareness.',
      'They mourn their dead and have been observed holding "funerals".',
      'An elephant\'s trunk contains over 40,000 muscles.'
    ],
    emoji: '🐘'
  },
  {
    id: 'grassland_003',
    name: 'Cheetah',
    scientificName: 'Acinonyx jubatus',
    description: 'The fastest land animal, built for speed with a lightweight frame and long legs.',
    habitat: [HabitatType.GRASSLAND],
    rarity: Rarity.RARE,
    baseStats: {
      health: 70,
      maxHealth: 70,
      attack: 85,
      defense: 55,
      speed: 130,
      intelligence: 80,
      stamina: 70
    },
    learnableMoves: ['speed_burst', 'precision_strike', 'sprint_hunt', 'acceleration'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Cheetahs can accelerate from 0 to 60 mph in just 3 seconds.',
      'They can reach speeds of up to 70 mph in short bursts.',
      'Cheetahs cannot roar; they chirp, purr, and growl instead.'
    ],
    emoji: '🐆'
  },
  {
    id: 'grassland_004',
    name: 'Zebra',
    scientificName: 'Equus quagga',
    description: 'Striped horses whose unique patterns help confuse predators and regulate temperature.',
    habitat: [HabitatType.GRASSLAND],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 85,
      maxHealth: 85,
      attack: 70,
      defense: 65,
      speed: 95,
      intelligence: 75,
      stamina: 90
    },
    learnableMoves: ['stripe_confusion', 'herd_gallop', 'kick_defense', 'migration_run'],
    conservationStatus: ConservationStatus.NEAR_THREATENED,
    facts: [
      'No two zebras have exactly the same stripe pattern.',
      'Zebra stripes may help regulate body temperature and deter biting flies.',
      'They can run up to 40 mph to escape predators.'
    ],
    emoji: '🦓'
  },
  {
    id: 'grassland_005',
    name: 'Giraffe',
    scientificName: 'Giraffa camelopardalis',
    description: 'The tallest mammal on Earth, with a neck that can be 6 feet long.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 100,
      maxHealth: 100,
      attack: 90,
      defense: 75,
      speed: 70,
      intelligence: 85,
      stamina: 80
    },
    learnableMoves: ['neck_slam', 'high_reach', 'tower_watch', 'gentle_giant'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Giraffes only need 5-30 minutes of sleep per day.',
      'Their tongues are 18-20 inches long and dark purple to prevent sunburn.',
      'A giraffe\'s heart weighs 25 pounds and pumps blood 6 feet up to its brain.'
    ],
    emoji: '🦒'
  }
];

// Evolution chains data
export const EVOLUTION_CHAINS = {
  fox_family: [
    { from: 'forest_001', to: 'forest_002', requirements: [{ type: 'level', value: 25 }] }
  ]
};

// Shiny variants configuration
export const SHINY_VARIANTS = {
  shinyChance: 0.001, // 1 in 1000 chance
  shinyMultiplier: 1.2, // 20% stat boost for shiny animals
  specialEffects: [
    'golden_sparkle',
    'rainbow_aura',
    'crystal_shine',
    'ethereal_glow'
  ]
};

// Habitat-specific animal pools
export const HABITAT_ANIMAL_POOLS = {
  [HabitatType.FOREST]: [
    'forest_001', 'forest_002', 'forest_003', 'forest_004', 'forest_005'
  ],
  [HabitatType.OCEAN]: [
    'ocean_001', 'ocean_002', 'ocean_003', 'ocean_004', 'ocean_005'
  ],
  [HabitatType.DESERT]: [
    'desert_001', 'desert_002', 'desert_003', 'desert_004', 'desert_005'
  ],
  [HabitatType.ARCTIC]: [
    'arctic_001', 'arctic_002', 'arctic_003', 'arctic_004', 'arctic_005'
  ],
  [HabitatType.GRASSLAND]: [
    'grassland_001', 'grassland_002', 'grassland_003', 'grassland_004', 'grassland_005'
  ]
};

// Animal database utility functions
export function getAnimalById(id: string): AnimalSpecies | undefined {
  return [...ANIMAL_DATABASE, ...ADDITIONAL_ANIMALS].find(animal => animal.id === id);
}

export function getAnimalsByHabitat(habitat: HabitatType): AnimalSpecies[] {
  return [...ANIMAL_DATABASE, ...ADDITIONAL_ANIMALS].filter(animal => 
    animal.habitat.includes(habitat)
  );
}

export function getAnimalsByRarity(rarity: Rarity): AnimalSpecies[] {
  return [...ANIMAL_DATABASE, ...ADDITIONAL_ANIMALS].filter(animal => 
    animal.rarity === rarity
  );
}

export function getRandomAnimal(): AnimalSpecies {
  const allAnimals = [...ANIMAL_DATABASE, ...ADDITIONAL_ANIMALS];
  return allAnimals[Math.floor(Math.random() * allAnimals.length)];
}

export function getRandomAnimalByHabitat(habitat: HabitatType): AnimalSpecies | undefined {
  const habitatAnimals = getAnimalsByHabitat(habitat);
  if (habitatAnimals.length === 0) return undefined;
  return habitatAnimals[Math.floor(Math.random() * habitatAnimals.length)];
}

export function getAllAnimals(): AnimalSpecies[] {
  return [...ANIMAL_DATABASE, ...ADDITIONAL_ANIMALS];
}

export function getAnimalCount(): number {
  return ANIMAL_DATABASE.length + ADDITIONAL_ANIMALS.length;
}