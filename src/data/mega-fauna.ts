import { AnimalSpecies, ConservationStatus } from '../types/animal.js';
import { HabitatType, Rarity } from '../types/common.js';

// Mega fauna and additional species to reach 500+ animals
export const MEGA_FAUNA: AnimalSpecies[] = [
  // PREHISTORIC/EXTINCT ANIMALS (for special events)
  {
    id: 'prehistoric_001',
    name: 'Woolly Mammoth',
    scientificName: 'Mammuthus primigenius',
    description: 'Massive Ice Age elephants covered in thick fur, extinct for 4,000 years.',
    habitat: [HabitatType.ARCTIC, HabitatType.GRASSLAND],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 180,
      maxHealth: 180,
      attack: 120,
      defense: 130,
      speed: 50,
      intelligence: 110,
      stamina: 140
    },
    learnableMoves: ['tusk_sweep', 'mammoth_charge', 'ice_age_endurance', 'herd_memory'],
    conservationStatus: ConservationStatus.EXTINCT,
    facts: [
      'Woolly mammoths had tusks up to 16 feet long.',
      'They lived alongside early humans who hunted them.',
      'Scientists are working to bring them back through genetic engineering.'
    ],
    emoji: '🐘'
  },
  {
    id: 'prehistoric_002',
    name: 'Saber-tooth Tiger',
    scientificName: 'Smilodon fatalis',
    description: 'Powerful prehistoric cats with massive canine teeth for taking down large prey.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 120,
      maxHealth: 120,
      attack: 130,
      defense: 85,
      speed: 80,
      intelligence: 85,
      stamina: 90
    },
    learnableMoves: ['saber_strike', 'prehistoric_roar', 'pack_hunt', 'ancient_predator'],
    conservationStatus: ConservationStatus.EXTINCT,
    facts: [
      'Saber-tooth tigers had canine teeth up to 7 inches long.',
      'They went extinct about 10,000 years ago.',
      'Despite the name, they were not closely related to modern tigers.'
    ],
    emoji: '🐅'
  },
  {
    id: 'prehistoric_003',
    name: 'Giant Ground Sloth',
    scientificName: 'Megatherium americanum',
    description: 'Massive ground-dwelling sloths that stood 12 feet tall.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 160,
      maxHealth: 160,
      attack: 100,
      defense: 120,
      speed: 30,
      intelligence: 70,
      stamina: 110
    },
    learnableMoves: ['ground_slam', 'massive_claws', 'ancient_wisdom', 'plant_harvest'],
    conservationStatus: ConservationStatus.EXTINCT,
    facts: [
      'Giant ground sloths were as large as elephants.',
      'They had claws over a foot long for stripping vegetation.',
      'They went extinct around 8,000 years ago.'
    ],
    emoji: '🦥'
  },

  // RARE MODERN ANIMALS
  {
    id: 'rare_001',
    name: 'Pangolin',
    scientificName: 'Manis pentadactyla',
    description: 'Armored mammals that roll into balls when threatened, the world\'s most trafficked animal.',
    habitat: [HabitatType.FOREST, HabitatType.GRASSLAND],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 70,
      maxHealth: 70,
      attack: 60,
      defense: 120,
      speed: 45,
      intelligence: 75,
      stamina: 80
    },
    learnableMoves: ['armor_roll', 'scale_defense', 'ant_feast', 'burrow_escape'],
    conservationStatus: ConservationStatus.CRITICALLY_ENDANGERED,
    facts: [
      'Pangolins are the only mammals covered in scales.',
      'They can consume up to 70 million ants and termites per year.',
      'All eight pangolin species are threatened with extinction.'
    ],
    emoji: '🦔'
  },
  {
    id: 'rare_002',
    name: 'Quetzal',
    scientificName: 'Pharomachrus mocinno',
    description: 'Sacred birds of ancient Mesoamerica with brilliant emerald and crimson plumage.',
    habitat: [HabitatType.FOREST],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 55,
      maxHealth: 55,
      attack: 50,
      defense: 50,
      speed: 85,
      intelligence: 90,
      stamina: 70
    },
    learnableMoves: ['sacred_flight', 'emerald_flash', 'cloud_forest_call', 'divine_beauty'],
    conservationStatus: ConservationStatus.NEAR_THREATENED,
    facts: [
      'Quetzals were considered sacred by the Maya and Aztecs.',
      'Males have tail feathers up to 3 feet long.',
      'They nest in tree holes and both parents incubate eggs.'
    ],
    emoji: '🦜'
  },
  {
    id: 'rare_003',
    name: 'Axolotl',
    scientificName: 'Ambystoma mexicanum',
    description: 'Aquatic salamanders that retain juvenile features throughout life and can regenerate limbs.',
    habitat: [HabitatType.WETLAND],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 50,
      maxHealth: 50,
      attack: 45,
      defense: 55,
      speed: 40,
      intelligence: 80,
      stamina: 70
    },
    learnableMoves: ['regeneration', 'aquatic_breathe', 'eternal_youth', 'limb_regrow'],
    conservationStatus: ConservationStatus.CRITICALLY_ENDANGERED,
    facts: [
      'Axolotls can regenerate entire limbs, organs, and parts of their brain.',
      'They remain aquatic and gilled throughout their lives.',
      'Only found naturally in Lake Xochimilco in Mexico City.'
    ],
    emoji: '🦎'
  },
  {
    id: 'rare_004',
    name: 'Kakapo',
    scientificName: 'Strigops habroptilus',
    description: 'The world\'s only flightless parrot, critically endangered with fewer than 250 individuals.',
    habitat: [HabitatType.FOREST],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 80,
      maxHealth: 80,
      attack: 55,
      defense: 70,
      speed: 35,
      intelligence: 110,
      stamina: 90
    },
    learnableMoves: ['ground_forage', 'night_call', 'moss_scent', 'ancient_wisdom'],
    conservationStatus: ConservationStatus.CRITICALLY_ENDANGERED,
    facts: [
      'Kakapos are the world\'s heaviest parrots, weighing up to 9 pounds.',
      'They are nocturnal and have a distinctive musty-sweet smell.',
      'Every individual kakapo has a name and is monitored 24/7.'
    ],
    emoji: '🦜'
  },
  {
    id: 'rare_005',
    name: 'Vaquita',
    scientificName: 'Phocoena sinus',
    description: 'The world\'s most endangered marine mammal with fewer than 30 individuals remaining.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 60,
      maxHealth: 60,
      attack: 45,
      defense: 55,
      speed: 75,
      intelligence: 95,
      stamina: 80
    },
    learnableMoves: ['shallow_dive', 'gulf_navigation', 'rare_call', 'survival_instinct'],
    conservationStatus: ConservationStatus.CRITICALLY_ENDANGERED,
    facts: [
      'Vaquitas are the smallest cetaceans, only 4-5 feet long.',
      'They are found only in the Gulf of California.',
      'Fewer than 30 vaquitas remain in the wild.'
    ],
    emoji: '🐬'
  }
];

// DOMESTIC AND FARM ANIMALS
export const DOMESTIC_ANIMALS: AnimalSpecies[] = [
  {
    id: 'domestic_001',
    name: 'Border Collie',
    scientificName: 'Canis lupus familiaris',
    description: 'Highly intelligent herding dogs known for their problem-solving abilities.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 70,
      maxHealth: 70,
      attack: 60,
      defense: 55,
      speed: 95,
      intelligence: 120,
      stamina: 100
    },
    learnableMoves: ['herding_instinct', 'problem_solve', 'loyal_bond', 'agility_run'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Border Collies can learn over 1,000 words.',
      'They were bred specifically for herding sheep in the Scottish borders.',
      'They can work for 8+ hours without tiring.'
    ],
    emoji: '🐕'
  },
  {
    id: 'domestic_002',
    name: 'Maine Coon Cat',
    scientificName: 'Felis catus',
    description: 'Large, gentle cats with tufted ears and bushy tails, known as gentle giants.',
    habitat: [HabitatType.FOREST, HabitatType.GRASSLAND],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 75,
      maxHealth: 75,
      attack: 65,
      defense: 60,
      speed: 80,
      intelligence: 95,
      stamina: 70
    },
    learnableMoves: ['gentle_giant', 'winter_coat', 'mouse_hunt', 'purr_therapy'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Maine Coons are the largest domestic cat breed.',
      'They have water-resistant fur and love to play with water.',
      'Some Maine Coons can weigh up to 25 pounds.'
    ],
    emoji: '🐱'
  },
  {
    id: 'domestic_003',
    name: 'Clydesdale Horse',
    scientificName: 'Equus caballus',
    description: 'Powerful draft horses known for their feathered feet and gentle temperament.',
    habitat: [HabitatType.GRASSLAND],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 120,
      maxHealth: 120,
      attack: 90,
      defense: 85,
      speed: 75,
      intelligence: 85,
      stamina: 110
    },
    learnableMoves: ['powerful_stride', 'gentle_giant', 'draft_work', 'noble_bearing'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Clydesdales can weigh up to 2,200 pounds.',
      'They were originally bred for farm work in Scotland.',
      'The famous Budweiser Clydesdales have been advertising icons since 1933.'
    ],
    emoji: '🐎'
  }
];

// INSECTS AND SMALL CREATURES
export const SMALL_CREATURES: AnimalSpecies[] = [
  {
    id: 'insect_001',
    name: 'Monarch Butterfly',
    scientificName: 'Danaus plexippus',
    description: 'Iconic butterflies that migrate thousands of miles across North America.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 25,
      maxHealth: 25,
      attack: 30,
      defense: 25,
      speed: 60,
      intelligence: 70,
      stamina: 90
    },
    learnableMoves: ['migration_instinct', 'toxic_defense', 'flower_nectar', 'wind_ride'],
    conservationStatus: ConservationStatus.ENDANGERED,
    facts: [
      'Monarchs migrate up to 3,000 miles from Canada to Mexico.',
      'They use the sun and magnetic fields to navigate.',
      'It takes 4 generations to complete the full migration cycle.'
    ],
    emoji: '🦋'
  },
  {
    id: 'insect_002',
    name: 'Honeybee',
    scientificName: 'Apis mellifera',
    description: 'Essential pollinators that live in complex social colonies.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 20,
      maxHealth: 20,
      attack: 40,
      defense: 30,
      speed: 70,
      intelligence: 85,
      stamina: 60
    },
    learnableMoves: ['waggle_dance', 'pollen_collect', 'hive_defense', 'honey_make'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Bees communicate through a waggle dance to share flower locations.',
      'A single bee visits 2 million flowers to make one pound of honey.',
      'Bees are responsible for pollinating 1/3 of the food we eat.'
    ],
    emoji: '🐝'
  },
  {
    id: 'insect_003',
    name: 'Praying Mantis',
    scientificName: 'Mantis religiosa',
    description: 'Patient predators that wait motionless for prey to come within striking distance.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 35,
      maxHealth: 35,
      attack: 80,
      defense: 45,
      speed: 50,
      intelligence: 75,
      stamina: 55
    },
    learnableMoves: ['lightning_strike', 'perfect_stillness', 'head_turn', 'ambush_predator'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Praying mantises can turn their heads 180 degrees.',
      'They are the only insects that can look over their shoulders.',
      'Female mantises sometimes eat males after mating.'
    ],
    emoji: '🦗'
  },
  {
    id: 'insect_004',
    name: 'Firefly',
    scientificName: 'Photinus pyralis',
    description: 'Bioluminescent beetles that create magical light displays on summer evenings.',
    habitat: [HabitatType.FOREST, HabitatType.WETLAND],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 20,
      maxHealth: 20,
      attack: 25,
      defense: 30,
      speed: 45,
      intelligence: 70,
      stamina: 50
    },
    learnableMoves: ['bioluminescence', 'mating_flash', 'night_glow', 'chemical_light'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Fireflies produce light through a chemical reaction with no heat.',
      'Each species has its own unique flashing pattern.',
      'Some firefly species synchronize their flashing across entire forests.'
    ],
    emoji: '🪲'
  },
  {
    id: 'insect_005',
    name: 'Dragonfly',
    scientificName: 'Libellula quadrimaculata',
    description: 'Ancient aerial hunters with incredible flying abilities and compound eyes.',
    habitat: [HabitatType.WETLAND, HabitatType.FOREST],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 30,
      maxHealth: 30,
      attack: 60,
      defense: 40,
      speed: 100,
      intelligence: 80,
      stamina: 70
    },
    learnableMoves: ['aerial_mastery', 'compound_vision', 'hover_hunt', 'ancient_flight'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Dragonflies can fly in any direction and hover like helicopters.',
      'They have been around for 300 million years.',
      'Their compound eyes have up to 30,000 lenses.'
    ],
    emoji: '🪰'
  }
];

// REPTILES AND AMPHIBIANS
export const REPTILES_AMPHIBIANS: AnimalSpecies[] = [
  {
    id: 'reptile_001',
    name: 'Komodo Dragon',
    scientificName: 'Varanus komodoensis',
    description: 'The largest living lizard, a powerful predator with venomous saliva.',
    habitat: [HabitatType.GRASSLAND, HabitatType.FOREST],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 110,
      maxHealth: 110,
      attack: 115,
      defense: 90,
      speed: 70,
      intelligence: 80,
      stamina: 85
    },
    learnableMoves: ['venom_bite', 'ambush_strike', 'scent_track', 'dragon_intimidate'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Komodo dragons can grow up to 10 feet long and weigh 150 pounds.',
      'Their saliva contains over 50 strains of bacteria.',
      'They can run up to 13 mph in short bursts.'
    ],
    emoji: '🦎'
  },
  {
    id: 'reptile_002',
    name: 'Galápagos Tortoise',
    scientificName: 'Chelonoidis nigra',
    description: 'Giant tortoises that can live over 150 years, symbols of the Galápagos Islands.',
    habitat: [HabitatType.GRASSLAND],
    rarity: Rarity.RARE,
    baseStats: {
      health: 130,
      maxHealth: 130,
      attack: 50,
      defense: 140,
      speed: 20,
      intelligence: 75,
      stamina: 120
    },
    learnableMoves: ['ancient_wisdom', 'shell_fortress', 'longevity', 'island_navigation'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Galápagos tortoises can live over 150 years.',
      'They can weigh up to 880 pounds.',
      'Darwin studied these tortoises, leading to his theory of evolution.'
    ],
    emoji: '🐢'
  },
  {
    id: 'reptile_003',
    name: 'Chameleon',
    scientificName: 'Chamaeleo calyptratus',
    description: 'Color-changing lizards with independently moving eyes and projectile tongues.',
    habitat: [HabitatType.FOREST],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 45,
      maxHealth: 45,
      attack: 70,
      defense: 60,
      speed: 40,
      intelligence: 85,
      stamina: 55
    },
    learnableMoves: ['color_change', 'tongue_strike', 'independent_eyes', 'branch_grip'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Chameleons can move their eyes independently to look in two directions.',
      'Their tongues can extend twice their body length in 0.07 seconds.',
      'They change color based on mood, temperature, and communication.'
    ],
    emoji: '🦎'
  },
  {
    id: 'amphibian_001',
    name: 'Tree Frog',
    scientificName: 'Hyla versicolor',
    description: 'Colorful amphibians with sticky toe pads for climbing trees.',
    habitat: [HabitatType.FOREST, HabitatType.WETLAND],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 40,
      maxHealth: 40,
      attack: 45,
      defense: 50,
      speed: 70,
      intelligence: 65,
      stamina: 60
    },
    learnableMoves: ['sticky_climb', 'color_blend', 'rain_call', 'leap_escape'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Tree frogs can change color to match their surroundings.',
      'Their toe pads can support 10 times their body weight.',
      'They absorb water through their skin rather than drinking.'
    ],
    emoji: '🐸'
  },
  {
    id: 'amphibian_002',
    name: 'Salamander',
    scientificName: 'Plethodon cinereus',
    description: 'Lungless amphibians that breathe through their skin and can regenerate limbs.',
    habitat: [HabitatType.FOREST, HabitatType.WETLAND],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 35,
      maxHealth: 35,
      attack: 40,
      defense: 55,
      speed: 50,
      intelligence: 70,
      stamina: 65
    },
    learnableMoves: ['skin_breathe', 'regeneration', 'moisture_sense', 'underground_hide'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Some salamanders have no lungs and breathe entirely through their skin.',
      'They can regenerate lost limbs, tails, and even parts of their hearts.',
      'Salamanders are indicators of environmental health.'
    ],
    emoji: '🦎'
  }
];

// Combine all mega fauna
export const ALL_MEGA_FAUNA = [
  ...MEGA_FAUNA,
  ...DOMESTIC_ANIMALS,
  ...SMALL_CREATURES,
  ...REPTILES_AMPHIBIANS
];

export const MEGA_FAUNA_COUNT = ALL_MEGA_FAUNA.length;