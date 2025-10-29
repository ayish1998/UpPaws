/**
 * Unit tests for Collection Manager
 */

import { CollectionManager, CollectionFilter, CollectionSort } from '../../core/collection-manager.js';
import { AnimalStorage } from '../../storage/animal-storage.js';
import { Animal } from '../../types/animal.js';
import { HabitatType, Rarity } from '../../types/common.js';

describe('CollectionManager', () => {
  let collectionManager: CollectionManager;
  let mockAnimalStorage: jest.Mocked<AnimalStorage>;
  let mockAnimals: Animal[];

  beforeEach(() => {
    // Create mock animal storage
    mockAnimalStorage = {
      getTrainerAnimals: jest.fn(),
      addAnimal: jest.fn(),
      updateAnimal: jest.fn(),
      removeAnimal: jest.fn(),
      storage: {
        get: jest.fn(),
        set: jest.fn()
      }
    } as any;

    collectionManager = new CollectionManager(mockAnimalStorage);

    // Create mock animals
    mockAnimals = [
      createMockAnimal('1', 'Wolf', 5, HabitatType.FOREST, Rarity.COMMON, false),
      createMockAnimal('2', 'Eagle', 8, HabitatType.MOUNTAIN, Rarity.UNCOMMON, false),
      createMockAnimal('3', 'Shark', 12, HabitatType.OCEAN, Rarity.RARE, true),
      createMockAnimal('4', 'Bear', 6, HabitatType.FOREST, Rarity.COMMON, false),
      createMockAnimal('5', 'Dragon', 20, HabitatType.MOUNTAIN, Rarity.LEGENDARY, false)
    ];

    mockAnimalStorage.getTrainerAnimals.mockResolvedValue(mockAnimals);
  });

  describe('Collection Retrieval', () => {
    test('should get complete collection with metadata', async () => {
      const collection = await collectionManager.getCollection('trainer1');
      
      expect(mockAnimalStorage.getTrainerAnimals).toHaveBeenCalledWith('trainer1');
      expect(collection).toHaveLength(5);
      expect(collection[0]).toHaveProperty('isFavorite');
      expect(collection[0]).toHaveProperty('tags');
    });

    test('should handle empty collection', async () => {
      mockAnimalStorage.getTrainerAnimals.mockResolvedValue([]);
      
      const collection = await collectionManager.getCollection('trainer1');
      
      expect(collection).toHaveLength(0);
    });

    test('should handle storage errors gracefully', async () => {
      mockAnimalStorage.getTrainerAnimals.mockRejectedValue(new Error('Storage error'));
      
      const collection = await collectionManager.getCollection('trainer1');
      
      expect(collection).toHaveLength(0);
    });
  });

  describe('Collection Filtering', () => {
    test('should filter by habitat type', async () => {
      const filter: CollectionFilter = { habitat: HabitatType.FOREST };
      const collection = await collectionManager.getFilteredCollection('trainer1', filter);
      
      expect(collection).toHaveLength(2);
      expect(collection.every(animal => animal.type.includes(HabitatType.FOREST))).toBe(true);
    });

    test('should filter by rarity', async () => {
      const filter: CollectionFilter = { rarity: Rarity.RARE };
      const collection = await collectionManager.getFilteredCollection('trainer1', filter);
      
      expect(collection).toHaveLength(1);
      expect(collection[0].rarity).toBe(Rarity.RARE);
    });

    test('should filter by shiny status', async () => {
      const filter: CollectionFilter = { shiny: true };
      const collection = await collectionManager.getFilteredCollection('trainer1', filter);
      
      expect(collection).toHaveLength(1);
      expect(collection[0].shiny).toBe(true);
    });

    test('should filter by level range', async () => {
      const filter: CollectionFilter = { level: { min: 8, max: 15 } };
      const collection = await collectionManager.getFilteredCollection('trainer1', filter);
      
      expect(collection).toHaveLength(2);
      expect(collection.every(animal => animal.level >= 8 && animal.level <= 15)).toBe(true);
    });

    test('should filter by name', async () => {
      const filter: CollectionFilter = { name: 'wolf' };
      const collection = await collectionManager.getFilteredCollection('trainer1', filter);
      
      expect(collection).toHaveLength(1);
      expect(collection[0].name.toLowerCase()).toContain('wolf');
    });

    test('should apply multiple filters', async () => {
      const filter: CollectionFilter = { 
        habitat: HabitatType.FOREST, 
        rarity: Rarity.COMMON 
      };
      const collection = await collectionManager.getFilteredCollection('trainer1', filter);
      
      expect(collection).toHaveLength(2);
      expect(collection.every(animal => 
        animal.type.includes(HabitatType.FOREST) && animal.rarity === Rarity.COMMON
      )).toBe(true);
    });
  });

  describe('Collection Sorting', () => {
    test('should sort by name ascending', async () => {
      const sort: CollectionSort = { field: 'name', direction: 'asc' };
      const collection = await collectionManager.getFilteredCollection('trainer1', undefined, sort);
      
      expect(collection[0].name).toBe('Bear');
      expect(collection[1].name).toBe('Dragon');
      expect(collection[2].name).toBe('Eagle');
    });

    test('should sort by level descending', async () => {
      const sort: CollectionSort = { field: 'level', direction: 'desc' };
      const collection = await collectionManager.getFilteredCollection('trainer1', undefined, sort);
      
      expect(collection[0].level).toBe(20);
      expect(collection[1].level).toBe(12);
      expect(collection[2].level).toBe(8);
    });

    test('should sort by rarity', async () => {
      const sort: CollectionSort = { field: 'rarity', direction: 'desc' };
      const collection = await collectionManager.getFilteredCollection('trainer1', undefined, sort);
      
      expect(collection[0].rarity).toBe(Rarity.LEGENDARY);
      expect(collection[1].rarity).toBe(Rarity.RARE);
    });
  });

  describe('Collection Statistics', () => {
    test('should calculate correct collection stats', async () => {
      // Mock animal database
      (global as any).animalDatabase = {
        getAnimalCount: () => 100
      };

      const stats = await collectionManager.getCollectionStats('trainer1');
      
      expect(stats.totalAnimals).toBe(5);
      expect(stats.uniqueSpecies).toBe(5);
      expect(stats.shinyCount).toBe(1);
      expect(stats.averageLevel).toBe(10.2);
      expect(stats.completionPercentage).toBe(5);
      expect(stats.rarityBreakdown[Rarity.COMMON]).toBe(2);
      expect(stats.rarityBreakdown[Rarity.LEGENDARY]).toBe(1);
    });

    test('should handle empty collection stats', async () => {
      mockAnimalStorage.getTrainerAnimals.mockResolvedValue([]);
      (global as any).animalDatabase = {
        getAnimalCount: () => 100
      };

      const stats = await collectionManager.getCollectionStats('trainer1');
      
      expect(stats.totalAnimals).toBe(0);
      expect(stats.averageLevel).toBe(0);
      expect(stats.completionPercentage).toBe(0);
    });
  });

  describe('Favorites Management', () => {
    test('should add animal to favorites', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.addToFavorites('trainer1', 'animal1');
      
      expect(result).toBe(true);
      expect(mockAnimalStorage.storage.set).toHaveBeenCalled();
    });

    test('should remove animal from favorites', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.removeFromFavorites('trainer1', 'animal1');
      
      expect(result).toBe(true);
      expect(mockAnimalStorage.storage.set).toHaveBeenCalled();
    });

    test('should handle favorites storage errors', async () => {
      mockAnimalStorage.storage.set.mockRejectedValue(new Error('Storage error'));
      
      const result = await collectionManager.addToFavorites('trainer1', 'animal1');
      
      expect(result).toBe(false);
    });
  });

  describe('Nickname Management', () => {
    test('should set animal nickname', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.setNickname('trainer1', 'animal1', 'Fluffy');
      
      expect(result).toBe(true);
      expect(mockAnimalStorage.storage.set).toHaveBeenCalled();
    });

    test('should remove nickname when empty string provided', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.setNickname('trainer1', 'animal1', '');
      
      expect(result).toBe(true);
    });

    test('should trim nickname whitespace', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.setNickname('trainer1', 'animal1', '  Fluffy  ');
      
      expect(result).toBe(true);
    });
  });

  describe('Tags Management', () => {
    test('should add tags to animal', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.addTags('trainer1', 'animal1', ['strong', 'favorite']);
      
      expect(result).toBe(true);
      expect(mockAnimalStorage.storage.set).toHaveBeenCalled();
    });

    test('should remove tags from animal', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.removeTags('trainer1', 'animal1', ['old-tag']);
      
      expect(result).toBe(true);
    });

    test('should handle duplicate tags', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.addTags('trainer1', 'animal1', ['tag1', 'tag1', 'tag2']);
      
      expect(result).toBe(true);
    });
  });

  describe('Notes Management', () => {
    test('should set notes for animal', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.setNotes('trainer1', 'animal1', 'This is a special animal');
      
      expect(result).toBe(true);
      expect(mockAnimalStorage.storage.set).toHaveBeenCalled();
    });

    test('should remove notes when empty string provided', async () => {
      mockAnimalStorage.storage.set.mockResolvedValue(undefined);
      
      const result = await collectionManager.setNotes('trainer1', 'animal1', '');
      
      expect(result).toBe(true);
    });
  });

  describe('Collection Export', () => {
    test('should export collection data as JSON', async () => {
      const exportData = await collectionManager.exportCollection('trainer1');
      
      expect(exportData).toBeTruthy();
      const parsed = JSON.parse(exportData);
      expect(parsed.trainerId).toBe('trainer1');
      expect(parsed.animals).toHaveLength(5);
      expect(parsed.stats).toBeTruthy();
      expect(parsed.exportDate).toBeTruthy();
    });
  });
});

// Helper function
function createMockAnimal(
  id: string, 
  name: string, 
  level: number, 
  habitat: HabitatType, 
  rarity: Rarity, 
  shiny: boolean
): Animal {
  return {
    id,
    speciesId: name.toLowerCase(),
    name,
    level,
    experience: level * 100,
    stats: {
      health: 50 + level * 10,
      attack: 40 + level * 8,
      defense: 35 + level * 6,
      speed: 45 + level * 7,
      intelligence: 30 + level * 5,
      stamina: 40 + level * 6
    },
    moves: [],
    type: [habitat],
    rarity,
    shiny,
    evolutionStage: 1,
    captureDate: new Date(),
    trainerId: 'trainer1',
    individualValues: {
      health: 15,
      attack: 12,
      defense: 10,
      speed: 14,
      intelligence: 8,
      stamina: 11
    }
  };
}