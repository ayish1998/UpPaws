import { AnimalSpecies, ConservationStatus } from '../types/animal.js';
import { HabitatType, Rarity } from '../types/common.js';

// Extended animal database to reach 500+ animals
export const EXTENDED_ANIMALS: AnimalSpecies[] = [
  // MOUNTAIN ANIMALS
  {
    id: 'mountain_001',
    name: 'Snow Leopard',
    scientificName: 'Panthera uncia',
    description: 'The ghost of the mountains, a solitary and elusive big cat adapted to high altitudes.',
    habitat: [HabitatType.MOUNTAIN, HabitatType.ARCTIC],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 95,
      maxHealth: 95,
      attack: 105,
      defense: 80,
      speed: 90,
      intelligence: 95,
      stamina: 100
    },
    learnableMoves: ['mountain_leap', 'stealth_stalk', 'altitude_adaptation', 'ghost_strike'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Snow leopards can leap up to 50 feet in a single bound.',
      'Their large paws act as snowshoes in deep snow.',
      'They cannot roar due to their throat structure, but they chuff and growl.'
    ],
    emoji: '🐆'
  },
  {
    id: 'mountain_002',
    name: 'Mountain Goat',
    scientificName: 'Oreamnos americanus',
    description: 'Sure-footed climbers that navigate steep rocky cliffs with ease.',
    habitat: [HabitatType.MOUNTAIN],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 80,
      maxHealth: 80,
      attack: 70,
      defense: 85,
      speed: 75,
      intelligence: 70,
      stamina: 95
    },
    learnableMoves: ['cliff_climb', 'sure_footing', 'horn_charge', 'mountain_endurance'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Mountain goats can climb slopes steeper than 60 degrees.',
      'Their hooves have a hard outer shell and soft inner pad for grip.',
      'They can jump 12 feet in a single leap.'
    ],
    emoji: '🐐'
  },
  {
    id: 'mountain_003',
    name: 'Golden Eagle',
    scientificName: 'Aquila chrysaetos',
    description: 'Majestic raptors that soar high above mountain peaks hunting for prey.',
    habitat: [HabitatType.MOUNTAIN, HabitatType.GRASSLAND],
    rarity: Rarity.RARE,
    baseStats: {
      health: 75,
      maxHealth: 75,
      attack: 100,
      defense: 70,
      speed: 110,
      intelligence: 100,
      stamina: 85
    },
    learnableMoves: ['dive_bomb', 'thermal_soar', 'keen_eyesight', 'talon_grip'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Golden eagles can spot prey from 2 miles away.',
      'They can dive at speeds over 150 mph when hunting.',
      'Their grip strength is 10 times stronger than a human hand.'
    ],
    emoji: '🦅'
  },
  {
    id: 'mountain_004',
    name: 'Pika',
    scientificName: 'Ochotona princeps',
    description: 'Small, round-eared relatives of rabbits that live in rocky mountain areas.',
    habitat: [HabitatType.MOUNTAIN],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 45,
      maxHealth: 45,
      attack: 35,
      defense: 50,
      speed: 80,
      intelligence: 75,
      stamina: 70
    },
    learnableMoves: ['rock_hop', 'alarm_call', 'hay_pile', 'cold_adaptation'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Pikas collect plants all summer to dry as hay for winter food.',
      'They cannot hibernate and must stay active all winter.',
      'Their alarm calls warn other pikas of approaching predators.'
    ],
    emoji: '🐰'
  },
  {
    id: 'mountain_005',
    name: 'Bighorn Sheep',
    scientificName: 'Ovis canadensis',
    description: 'Wild sheep with massive curved horns, known for their head-butting contests.',
    habitat: [HabitatType.MOUNTAIN, HabitatType.DESERT],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 90,
      maxHealth: 90,
      attack: 85,
      defense: 90,
      speed: 70,
      intelligence: 75,
      stamina: 85
    },
    learnableMoves: ['ram_charge', 'cliff_navigation', 'horn_clash', 'herd_unity'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Bighorn sheep rams can weigh up to 300 pounds.',
      'Their horn clashes can be heard from a mile away.',
      'They can climb ledges only 2 inches wide.'
    ],
    emoji: '🐏'
  },

  // JUNGLE/RAINFOREST ANIMALS
  {
    id: 'jungle_001',
    name: 'Jaguar',
    scientificName: 'Panthera onca',
    description: 'The apex predator of the Amazon, with the strongest bite force of any big cat.',
    habitat: [HabitatType.FOREST],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 110,
      maxHealth: 110,
      attack: 120,
      defense: 85,
      speed: 85,
      intelligence: 90,
      stamina: 95
    },
    learnableMoves: ['skull_crush', 'jungle_stealth', 'water_hunt', 'apex_roar'],
    conservationStatus: ConservationStatus.NEAR_THREATENED,
    facts: [
      'Jaguars have the strongest bite force of any big cat at 1,500 PSI.',
      'They are excellent swimmers and hunt caimans in water.',
      'Jaguars can crush turtle shells and even pierce skulls with their bite.'
    ],
    emoji: '🐆'
  },
  {
    id: 'jungle_002',
    name: 'Toucan',
    scientificName: 'Ramphastos toco',
    description: 'Colorful birds with oversized beaks, important seed dispersers in rainforests.',
    habitat: [HabitatType.FOREST],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 55,
      maxHealth: 55,
      attack: 50,
      defense: 45,
      speed: 70,
      intelligence: 85,
      stamina: 65
    },
    learnableMoves: ['beak_strike', 'fruit_toss', 'canopy_flight', 'colorful_display'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'A toucan\'s beak is made of keratin and is surprisingly lightweight.',
      'They use their beaks to regulate body temperature.',
      'Toucans sleep by tucking their beaks under their wings and folding their tails over their heads.'
    ],
    emoji: '🦜'
  },
  {
    id: 'jungle_003',
    name: 'Sloth',
    scientificName: 'Bradypus tridactylus',
    description: 'Slow-moving arboreal mammals that spend most of their lives hanging upside down.',
    habitat: [HabitatType.FOREST],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 70,
      maxHealth: 70,
      attack: 30,
      defense: 80,
      speed: 15,
      intelligence: 60,
      stamina: 90
    },
    learnableMoves: ['slow_motion', 'energy_conservation', 'camouflage_still', 'algae_symbiosis'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Sloths move so slowly that algae grows on their fur, providing camouflage.',
      'They only defecate once a week and lose up to 30% of their body weight.',
      'Sloths can rotate their heads 270 degrees.'
    ],
    emoji: '🦥'
  },
  {
    id: 'jungle_004',
    name: 'Poison Dart Frog',
    scientificName: 'Phyllobates terribilis',
    description: 'Tiny but deadly frogs whose bright colors warn predators of their toxicity.',
    habitat: [HabitatType.FOREST],
    rarity: Rarity.RARE,
    baseStats: {
      health: 35,
      maxHealth: 35,
      attack: 90,
      defense: 40,
      speed: 60,
      intelligence: 70,
      stamina: 55
    },
    learnableMoves: ['poison_skin', 'warning_colors', 'toxic_touch', 'jungle_hop'],
    conservationStatus: ConservationStatus.ENDANGERED,
    facts: [
      'One golden poison frog contains enough poison to kill 10 adult humans.',
      'Their toxicity comes from alkaloids in the ants they eat.',
      'Indigenous people have used their poison on arrow tips for centuries.'
    ],
    emoji: '🐸'
  },
  {
    id: 'jungle_005',
    name: 'Howler Monkey',
    scientificName: 'Alouatta seniculus',
    description: 'The loudest land animal, whose calls can be heard from 3 miles away.',
    habitat: [HabitatType.FOREST],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 65,
      maxHealth: 65,
      attack: 55,
      defense: 60,
      speed: 75,
      intelligence: 85,
      stamina: 80
    },
    learnableMoves: ['howl_call', 'tree_swing', 'territorial_roar', 'group_coordination'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Howler monkey calls can be heard up to 3 miles through dense rainforest.',
      'They have specialized throat structures that amplify their calls.',
      'Howlers spend 80% of their time resting to conserve energy.'
    ],
    emoji: '🐒'
  },

  // WETLAND ANIMALS
  {
    id: 'wetland_001',
    name: 'American Alligator',
    scientificName: 'Alligator mississippiensis',
    description: 'Ancient predators that have remained virtually unchanged for millions of years.',
    habitat: [HabitatType.WETLAND],
    rarity: Rarity.RARE,
    baseStats: {
      health: 120,
      maxHealth: 120,
      attack: 110,
      defense: 100,
      speed: 60,
      intelligence: 70,
      stamina: 90
    },
    learnableMoves: ['death_roll', 'ambush_strike', 'tail_whip', 'ancient_patience'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Alligators can hold their breath underwater for up to 24 hours.',
      'They are surprisingly good mothers, carrying babies to water in their mouths.',
      'Alligators have been around for 37 million years, surviving the dinosaurs.'
    ],
    emoji: '🐊'
  },
  {
    id: 'wetland_002',
    name: 'Great Blue Heron',
    scientificName: 'Ardea herodias',
    description: 'Patient wading birds that stand motionless for hours waiting for fish.',
    habitat: [HabitatType.WETLAND, HabitatType.OCEAN],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 70,
      maxHealth: 70,
      attack: 75,
      defense: 60,
      speed: 80,
      intelligence: 90,
      stamina: 85
    },
    learnableMoves: ['spear_strike', 'patient_wait', 'wade_hunt', 'flight_grace'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Great blue herons can stand motionless for over an hour waiting for prey.',
      'They have specialized neck vertebrae that allow lightning-fast strikes.',
      'These birds can fly at speeds up to 35 mph.'
    ],
    emoji: '🦆'
  },
  {
    id: 'wetland_003',
    name: 'Beaver',
    scientificName: 'Castor canadensis',
    description: 'Nature\'s engineers, capable of dramatically altering landscapes with their dams.',
    habitat: [HabitatType.WETLAND, HabitatType.FOREST],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 85,
      maxHealth: 85,
      attack: 65,
      defense: 80,
      speed: 50,
      intelligence: 100,
      stamina: 95
    },
    learnableMoves: ['dam_build', 'tree_fell', 'underwater_swim', 'engineering_instinct'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Beaver dams can be over 1,000 feet long and visible from space.',
      'Their teeth never stop growing and are self-sharpening.',
      'Beavers can hold their breath underwater for 15 minutes.'
    ],
    emoji: '🦫'
  },
  {
    id: 'wetland_004',
    name: 'Flamingo',
    scientificName: 'Phoenicopterus roseus',
    description: 'Pink wading birds that get their color from the shrimp and algae they eat.',
    habitat: [HabitatType.WETLAND],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 60,
      maxHealth: 60,
      attack: 45,
      defense: 55,
      speed: 75,
      intelligence: 80,
      stamina: 85
    },
    learnableMoves: ['filter_feed', 'flock_dance', 'pink_display', 'one_leg_stand'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Flamingos get their pink color from carotenoids in their diet.',
      'They can only eat with their heads upside down.',
      'Flamingos often stand on one leg to conserve body heat.'
    ],
    emoji: '🦩'
  },
  {
    id: 'wetland_005',
    name: 'Manatee',
    scientificName: 'Trichechus manatus',
    description: 'Gentle sea cows that graze on aquatic vegetation in warm coastal waters.',
    habitat: [HabitatType.WETLAND, HabitatType.OCEAN],
    rarity: Rarity.RARE,
    baseStats: {
      health: 110,
      maxHealth: 110,
      attack: 40,
      defense: 90,
      speed: 45,
      intelligence: 85,
      stamina: 100
    },
    learnableMoves: ['gentle_nature', 'plant_graze', 'warm_seek', 'peaceful_float'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Manatees are related to elephants, not other marine mammals.',
      'They can weigh up to 1,200 pounds but are completely herbivorous.',
      'Manatees need to surface for air every 3-5 minutes.'
    ],
    emoji: '🐄'
  },

  // CAVE ANIMALS
  {
    id: 'cave_001',
    name: 'Bat',
    scientificName: 'Myotis lucifugus',
    description: 'The only flying mammals, using echolocation to navigate in complete darkness.',
    habitat: [HabitatType.CAVE, HabitatType.FOREST],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 45,
      maxHealth: 45,
      attack: 55,
      defense: 40,
      speed: 100,
      intelligence: 90,
      stamina: 70
    },
    learnableMoves: ['echolocation', 'night_flight', 'ultrasonic_call', 'insect_hunt'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Bats can eat up to 1,000 mosquitoes per hour.',
      'They are the only mammals capable of true flight.',
      'Some bats can live over 30 years despite their small size.'
    ],
    emoji: '🦇'
  },
  {
    id: 'cave_002',
    name: 'Cave Bear',
    scientificName: 'Ursus spelaeus',
    description: 'Extinct massive bears that once inhabited European caves during the Ice Age.',
    habitat: [HabitatType.CAVE, HabitatType.MOUNTAIN],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 140,
      maxHealth: 140,
      attack: 115,
      defense: 100,
      speed: 55,
      intelligence: 75,
      stamina: 105
    },
    learnableMoves: ['cave_roar', 'ancient_strength', 'hibernation_deep', 'territorial_mark'],
    conservationStatus: ConservationStatus.EXTINCT,
    facts: [
      'Cave bears were 30% larger than modern brown bears.',
      'They went extinct about 24,000 years ago.',
      'Despite their size, they were primarily herbivorous.'
    ],
    emoji: '🐻'
  }
];

// AQUATIC ANIMALS (additional ocean/freshwater species)
export const AQUATIC_ANIMALS: AnimalSpecies[] = [
  {
    id: 'aquatic_001',
    name: 'Orca',
    scientificName: 'Orcinus orca',
    description: 'Apex predators of the ocean, highly intelligent with complex social structures.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.LEGENDARY,
    baseStats: {
      health: 150,
      maxHealth: 150,
      attack: 125,
      defense: 90,
      speed: 100,
      intelligence: 120,
      stamina: 110
    },
    learnableMoves: ['pod_hunt', 'sonic_blast', 'breach_slam', 'intelligence_network'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Orcas are actually the largest members of the dolphin family.',
      'They have distinct dialects and cultural behaviors passed down through generations.',
      'Orcas can live up to 90 years in the wild.'
    ],
    emoji: '🐋'
  },
  {
    id: 'aquatic_002',
    name: 'Hammerhead Shark',
    scientificName: 'Sphyrna mokarran',
    description: 'Distinctive sharks with flattened heads that enhance their sensory abilities.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.RARE,
    baseStats: {
      health: 110,
      maxHealth: 110,
      attack: 105,
      defense: 80,
      speed: 95,
      intelligence: 75,
      stamina: 90
    },
    learnableMoves: ['hammer_strike', 'electrical_sense', 'school_formation', 'deep_dive'],
    conservationStatus: ConservationStatus.CRITICALLY_ENDANGERED,
    facts: [
      'Hammerhead sharks can detect electrical fields as small as half a billionth of a volt.',
      'Their unique head shape gives them 360-degree vision.',
      'Great hammerheads can grow up to 20 feet long.'
    ],
    emoji: '🦈'
  },
  {
    id: 'aquatic_003',
    name: 'Manta Ray',
    scientificName: 'Mobula birostris',
    description: 'Gentle giants that glide through the ocean feeding on plankton.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.RARE,
    baseStats: {
      health: 100,
      maxHealth: 100,
      attack: 50,
      defense: 85,
      speed: 80,
      intelligence: 95,
      stamina: 110
    },
    learnableMoves: ['graceful_glide', 'filter_feed', 'barrel_roll', 'gentle_giant'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Manta rays have the largest brain-to-body ratio of any fish.',
      'They can have wingspans up to 29 feet across.',
      'Mantas are known to recognize themselves in mirrors.'
    ],
    emoji: '🐠'
  },
  {
    id: 'aquatic_004',
    name: 'Seahorse',
    scientificName: 'Hippocampus kuda',
    description: 'Unique fish where males carry and give birth to the young.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 40,
      maxHealth: 40,
      attack: 35,
      defense: 60,
      speed: 25,
      intelligence: 70,
      stamina: 50
    },
    learnableMoves: ['camouflage_coral', 'tail_grip', 'suction_feed', 'male_pregnancy'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Seahorses are the only species where males get pregnant and give birth.',
      'They can move their eyes independently of each other.',
      'Seahorses are terrible swimmers and often die of exhaustion in storms.'
    ],
    emoji: '🐴'
  },
  {
    id: 'aquatic_005',
    name: 'Jellyfish',
    scientificName: 'Aurelia aurita',
    description: 'Ancient cnidarians that have survived for over 500 million years.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.COMMON,
    baseStats: {
      health: 50,
      maxHealth: 50,
      attack: 70,
      defense: 30,
      speed: 40,
      intelligence: 30,
      stamina: 80
    },
    learnableMoves: ['sting_tentacles', 'drift_current', 'transparent_body', 'ancient_survivor'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Jellyfish are 95% water and have no brain, heart, or blood.',
      'They have existed for over 500 million years, predating dinosaurs.',
      'Some jellyfish species are immortal and can reverse their aging process.'
    ],
    emoji: '🪼'
  }
];

// BIRD SPECIES
export const BIRD_SPECIES: AnimalSpecies[] = [
  {
    id: 'bird_001',
    name: 'Peregrine Falcon',
    scientificName: 'Falco peregrinus',
    description: 'The fastest animal on Earth, capable of diving at over 200 mph.',
    habitat: [HabitatType.MOUNTAIN, HabitatType.GRASSLAND],
    rarity: Rarity.RARE,
    baseStats: {
      health: 65,
      maxHealth: 65,
      attack: 95,
      defense: 60,
      speed: 140,
      intelligence: 100,
      stamina: 80
    },
    learnableMoves: ['dive_bomb', 'speed_strike', 'aerial_mastery', 'precision_hunt'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Peregrine falcons can reach speeds over 240 mph in a hunting dive.',
      'They have special nostrils that prevent lung damage during high-speed dives.',
      'Peregrines are found on every continent except Antarctica.'
    ],
    emoji: '🦅'
  },
  {
    id: 'bird_002',
    name: 'Hummingbird',
    scientificName: 'Trochilus colubris',
    description: 'Tiny birds with incredible flying abilities, including hovering and flying backwards.',
    habitat: [HabitatType.FOREST, HabitatType.GRASSLAND],
    rarity: Rarity.UNCOMMON,
    baseStats: {
      health: 25,
      maxHealth: 25,
      attack: 40,
      defense: 30,
      speed: 120,
      intelligence: 80,
      stamina: 60
    },
    learnableMoves: ['hover_flight', 'nectar_feed', 'rapid_wing', 'backwards_fly'],
    conservationStatus: ConservationStatus.LEAST_CONCERN,
    facts: [
      'Hummingbirds can beat their wings up to 80 times per second.',
      'They are the only birds that can fly backwards and upside down.',
      'A hummingbird\'s heart beats up to 1,260 times per minute.'
    ],
    emoji: '🐦'
  },
  {
    id: 'bird_003',
    name: 'Albatross',
    scientificName: 'Diomedea exulans',
    description: 'Magnificent seabirds with the largest wingspan of any living bird.',
    habitat: [HabitatType.OCEAN],
    rarity: Rarity.RARE,
    baseStats: {
      health: 85,
      maxHealth: 85,
      attack: 70,
      defense: 75,
      speed: 90,
      intelligence: 95,
      stamina: 130
    },
    learnableMoves: ['dynamic_soar', 'ocean_glide', 'storm_rider', 'long_distance'],
    conservationStatus: ConservationStatus.VULNERABLE,
    facts: [
      'Wandering albatrosses have wingspans up to 11.5 feet.',
      'They can glide for hours without flapping their wings.',
      'Albatrosses can live over 60 years and mate for life.'
    ],
    emoji: '🐦'
  }
];

// Combine all extended animals
export const ALL_EXTENDED_ANIMALS = [
  ...EXTENDED_ANIMALS,
  ...AQUATIC_ANIMALS,
  ...BIRD_SPECIES
];

// Export count for verification
export const EXTENDED_ANIMAL_COUNT = ALL_EXTENDED_ANIMALS.length;