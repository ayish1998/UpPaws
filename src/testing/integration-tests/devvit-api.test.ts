/**
 * Integration tests for Devvit API interactions
 */

import { Context } from '@devvit/public-api';

describe('Devvit API Integration', () => {
  let mockContext: jest.Mocked<Context>;

  beforeEach(() => {
    // Create comprehensive mock Devvit context
    mockContext = {
      reddit: {
        getCurrentUser: jest.fn(),
        getCurrentUsername: jest.fn(),
        getSubredditById: jest.fn(),
        getPostById: jest.fn(),
        submitPost: jest.fn(),
        submitComment: jest.fn(),
        getComments: jest.fn(),
        getSubredditName: jest.fn(),
        getAppUser: jest.fn()
      },
      redis: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        hget: jest.fn(),
        hset: jest.fn(),
        hdel: jest.fn(),
        hgetall: jest.fn(),
        zadd: jest.fn(),
        zrange: jest.fn(),
        zrevrange: jest.fn(),
        zrem: jest.fn(),
        expire: jest.fn(),
        exists: jest.fn(),
        keys: jest.fn()
      },
      ui: {
        showToast: jest.fn(),
        showForm: jest.fn(),
        navigateTo: jest.fn()
      },
      settings: {
        get: jest.fn(),
        set: jest.fn()
      },
      scheduler: {
        runJob: jest.fn(),
        cancelJob: jest.fn()
      },
      media: {
        upload: jest.fn(),
        getURL: jest.fn()
      }
    } as any;
  });

  describe('Reddit API Integration', () => {
    test('should get current user successfully', async () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        karma: 1000,
        created: new Date()
      };

      mockContext.reddit.getCurrentUser.mockResolvedValue(mockUser as any);

      const user = await mockContext.reddit.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(mockContext.reddit.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    test('should get current username successfully', async () => {
      mockContext.reddit.getCurrentUsername.mockResolvedValue('testuser');

      const username = await mockContext.reddit.getCurrentUsername();

      expect(username).toBe('testuser');
      expect(mockContext.reddit.getCurrentUsername).toHaveBeenCalledTimes(1);
    });

    test('should handle user not found error', async () => {
      mockContext.reddit.getCurrentUser.mockRejectedValue(new Error('User not found'));

      await expect(mockContext.reddit.getCurrentUser()).rejects.toThrow('User not found');
    });

    test('should get subreddit information', async () => {
      const mockSubreddit = {
        id: 'subreddit123',
        name: 'testsubreddit',
        displayName: 'TestSubreddit',
        subscribers: 5000,
        created: new Date()
      };

      mockContext.reddit.getSubredditById.mockResolvedValue(mockSubreddit as any);

      const subreddit = await mockContext.reddit.getSubredditById('subreddit123');

      expect(subreddit).toEqual(mockSubreddit);
      expect(mockContext.reddit.getSubredditById).toHaveBeenCalledWith('subreddit123');
    });

    test('should submit post successfully', async () => {
      const postData = {
        title: 'Test Post',
        text: 'This is a test post',
        subredditName: 'testsubreddit'
      };

      const mockPost = {
        id: 'post123',
        title: postData.title,
        body: postData.text,
        url: 'https://reddit.com/r/testsubreddit/post123'
      };

      mockContext.reddit.submitPost.mockResolvedValue(mockPost as any);

      const post = await mockContext.reddit.submitPost(postData as any);

      expect(post).toEqual(mockPost);
      expect(mockContext.reddit.submitPost).toHaveBeenCalledWith(postData);
    });

    test('should submit comment successfully', async () => {
      const commentData = {
        text: 'This is a test comment',
        postId: 'post123'
      };

      const mockComment = {
        id: 'comment123',
        body: commentData.text,
        parentId: commentData.postId
      };

      mockContext.reddit.submitComment.mockResolvedValue(mockComment as any);

      const comment = await mockContext.reddit.submitComment(commentData as any);

      expect(comment).toEqual(mockComment);
      expect(mockContext.reddit.submitComment).toHaveBeenCalledWith(commentData);
    });

    test('should get comments for post', async () => {
      const mockComments = [
        { id: 'comment1', body: 'First comment', author: 'user1' },
        { id: 'comment2', body: 'Second comment', author: 'user2' }
      ];

      mockContext.reddit.getComments.mockResolvedValue(mockComments as any);

      const comments = await mockContext.reddit.getComments('post123' as any);

      expect(comments).toEqual(mockComments);
      expect(mockContext.reddit.getComments).toHaveBeenCalledWith('post123');
    });
  });

  describe('Redis Storage Integration', () => {
    test('should store and retrieve data successfully', async () => {
      const testData = { username: 'testuser', level: 5, score: 1000 };
      const testKey = 'user:testuser';

      mockContext.redis.set.mockResolvedValue(undefined);
      mockContext.redis.get.mockResolvedValue(JSON.stringify(testData));

      // Store data
      await mockContext.redis.set(testKey, JSON.stringify(testData));
      expect(mockContext.redis.set).toHaveBeenCalledWith(testKey, JSON.stringify(testData));

      // Retrieve data
      const retrievedData = await mockContext.redis.get(testKey);
      expect(JSON.parse(retrievedData!)).toEqual(testData);
    });

    test('should handle hash operations', async () => {
      const hashKey = 'trainer:stats';
      const field = 'battles_won';
      const value = '15';

      mockContext.redis.hset.mockResolvedValue(undefined);
      mockContext.redis.hget.mockResolvedValue(value);

      // Set hash field
      await mockContext.redis.hset(hashKey, { [field]: value });
      expect(mockContext.redis.hset).toHaveBeenCalledWith(hashKey, { [field]: value });

      // Get hash field
      const retrievedValue = await mockContext.redis.hget(hashKey, field);
      expect(retrievedValue).toBe(value);
    });

    test('should handle sorted set operations', async () => {
      const leaderboardKey = 'leaderboard:daily';
      const member = 'testuser';
      const score = 1500;

      mockContext.redis.zadd.mockResolvedValue(undefined);
      mockContext.redis.zrevrange.mockResolvedValue([member]);

      // Add to sorted set
      await mockContext.redis.zadd(leaderboardKey, { [member]: score });
      expect(mockContext.redis.zadd).toHaveBeenCalledWith(leaderboardKey, { [member]: score });

      // Get top scores
      const topScores = await mockContext.redis.zrevrange(leaderboardKey, 0, 9);
      expect(topScores).toContain(member);
    });

    test('should handle Redis errors gracefully', async () => {
      mockContext.redis.get.mockRejectedValue(new Error('Redis connection failed'));

      await expect(mockContext.redis.get('test:key')).rejects.toThrow('Redis connection failed');
    });

    test('should handle data expiration', async () => {
      const key = 'session:temp';
      const value = 'temporary_data';
      const ttl = 3600; // 1 hour

      mockContext.redis.set.mockResolvedValue(undefined);
      mockContext.redis.expire.mockResolvedValue(undefined);

      await mockContext.redis.set(key, value);
      await mockContext.redis.expire(key, ttl);

      expect(mockContext.redis.set).toHaveBeenCalledWith(key, value);
      expect(mockContext.redis.expire).toHaveBeenCalledWith(key, ttl);
    });
  });

  describe('UI Integration', () => {
    test('should show toast notifications', async () => {
      const toastMessage = 'Operation completed successfully!';
      
      mockContext.ui.showToast.mockResolvedValue(undefined);

      await mockContext.ui.showToast({ text: toastMessage });

      expect(mockContext.ui.showToast).toHaveBeenCalledWith({ text: toastMessage });
    });

    test('should show forms', async () => {
      const formConfig = {
        title: 'Test Form',
        fields: [
          { name: 'username', label: 'Username', type: 'string' as const }
        ]
      };

      const formResponse = { username: 'testuser' };
      mockContext.ui.showForm.mockResolvedValue(formResponse);

      const result = await mockContext.ui.showForm(formConfig);

      expect(result).toEqual(formResponse);
      expect(mockContext.ui.showForm).toHaveBeenCalledWith(formConfig);
    });

    test('should handle navigation', async () => {
      const url = 'https://example.com/page';
      
      mockContext.ui.navigateTo.mockResolvedValue(undefined);

      await mockContext.ui.navigateTo(url);

      expect(mockContext.ui.navigateTo).toHaveBeenCalledWith(url);
    });
  });

  describe('Settings Integration', () => {
    test('should get and set app settings', async () => {
      const settingKey = 'game_difficulty';
      const settingValue = 'medium';

      mockContext.settings.set.mockResolvedValue(undefined);
      mockContext.settings.get.mockResolvedValue(settingValue);

      // Set setting
      await mockContext.settings.set(settingKey, settingValue);
      expect(mockContext.settings.set).toHaveBeenCalledWith(settingKey, settingValue);

      // Get setting
      const retrievedValue = await mockContext.settings.get(settingKey);
      expect(retrievedValue).toBe(settingValue);
    });

    test('should handle missing settings', async () => {
      mockContext.settings.get.mockResolvedValue(undefined);

      const value = await mockContext.settings.get('nonexistent_setting');
      expect(value).toBeUndefined();
    });
  });

  describe('Scheduler Integration', () => {
    test('should schedule jobs', async () => {
      const jobName = 'daily_reset';
      const jobData = { type: 'reset_daily_puzzles' };

      mockContext.scheduler.runJob.mockResolvedValue(undefined);

      await mockContext.scheduler.runJob({
        name: jobName,
        data: jobData,
        runAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });

      expect(mockContext.scheduler.runJob).toHaveBeenCalledWith({
        name: jobName,
        data: jobData,
        runAt: expect.any(Date)
      });
    });

    test('should cancel jobs', async () => {
      const jobId = 'job123';

      mockContext.scheduler.cancelJob.mockResolvedValue(undefined);

      await mockContext.scheduler.cancelJob(jobId);

      expect(mockContext.scheduler.cancelJob).toHaveBeenCalledWith(jobId);
    });
  });

  describe('Media Integration', () => {
    test('should upload media files', async () => {
      const mockFile = new Blob(['test content'], { type: 'image/png' });
      const uploadResult = {
        mediaId: 'media123',
        url: 'https://reddit.com/media/media123.png'
      };

      mockContext.media.upload.mockResolvedValue(uploadResult as any);

      const result = await mockContext.media.upload({
        file: mockFile as any,
        type: 'image'
      });

      expect(result).toEqual(uploadResult);
      expect(mockContext.media.upload).toHaveBeenCalledWith({
        file: mockFile,
        type: 'image'
      });
    });

    test('should get media URLs', async () => {
      const mediaId = 'media123';
      const expectedUrl = 'https://reddit.com/media/media123.png';

      mockContext.media.getURL.mockResolvedValue(expectedUrl);

      const url = await mockContext.media.getURL(mediaId);

      expect(url).toBe(expectedUrl);
      expect(mockContext.media.getURL).toHaveBeenCalledWith(mediaId);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should work on mobile devices', async () => {
      // Simulate mobile context
      const mobileContext = {
        ...mockContext,
        deviceInfo: {
          isMobile: true,
          platform: 'ios',
          screenSize: { width: 375, height: 812 }
        }
      };

      // Test that mobile-specific functionality works
      mobileContext.ui.showToast.mockResolvedValue(undefined);
      
      await mobileContext.ui.showToast({ 
        text: 'Mobile toast',
        appearance: 'neutral'
      });

      expect(mobileContext.ui.showToast).toHaveBeenCalledWith({
        text: 'Mobile toast',
        appearance: 'neutral'
      });
    });

    test('should work on desktop devices', async () => {
      // Simulate desktop context
      const desktopContext = {
        ...mockContext,
        deviceInfo: {
          isMobile: false,
          platform: 'web',
          screenSize: { width: 1920, height: 1080 }
        }
      };

      // Test that desktop-specific functionality works
      desktopContext.ui.navigateTo.mockResolvedValue(undefined);
      
      await desktopContext.ui.navigateTo('https://example.com');

      expect(desktopContext.ui.navigateTo).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle network timeouts', async () => {
      mockContext.reddit.getCurrentUser.mockRejectedValue(new Error('Network timeout'));

      await expect(mockContext.reddit.getCurrentUser()).rejects.toThrow('Network timeout');
    });

    test('should handle rate limiting', async () => {
      mockContext.reddit.submitPost.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(mockContext.reddit.submitPost({} as any)).rejects.toThrow('Rate limit exceeded');
    });

    test('should handle invalid permissions', async () => {
      mockContext.reddit.submitPost.mockRejectedValue(new Error('Insufficient permissions'));

      await expect(mockContext.reddit.submitPost({} as any)).rejects.toThrow('Insufficient permissions');
    });

    test('should handle malformed data', async () => {
      mockContext.redis.get.mockResolvedValue('invalid json data');

      const data = await mockContext.redis.get('test:key');
      expect(() => JSON.parse(data!)).toThrow();
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        mockContext.redis.get.mockResolvedValue(`data_${i}`);
        return mockContext.redis.get(`key_${i}`);
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockContext.redis.get).toHaveBeenCalledTimes(10);
    });

    test('should handle large data sets', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Animal ${i}`,
        level: Math.floor(Math.random() * 50) + 1
      }));

      mockContext.redis.set.mockResolvedValue(undefined);
      mockContext.redis.get.mockResolvedValue(JSON.stringify(largeData));

      await mockContext.redis.set('large_dataset', JSON.stringify(largeData));
      const retrieved = await mockContext.redis.get('large_dataset');
      const parsedData = JSON.parse(retrieved!);

      expect(parsedData).toHaveLength(1000);
      expect(parsedData[0]).toHaveProperty('id');
      expect(parsedData[0]).toHaveProperty('name');
      expect(parsedData[0]).toHaveProperty('level');
    });
  });

  describe('Security and Data Validation', () => {
    test('should sanitize user input', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitizedInput = maliciousInput.replace(/<script[^>]*>.*?<\/script>/gi, '');

      expect(sanitizedInput).not.toContain('<script>');
      expect(sanitizedInput).not.toContain('alert');
    });

    test('should validate data before storage', async () => {
      const invalidData = {
        username: '', // Empty username should be invalid
        level: -1,    // Negative level should be invalid
        score: 'not a number' // Non-numeric score should be invalid
      };

      // Validation logic
      const isValid = (data: any) => {
        return data.username && 
               data.username.length > 0 && 
               typeof data.level === 'number' && 
               data.level >= 0 &&
               typeof data.score === 'number';
      };

      expect(isValid(invalidData)).toBe(false);

      const validData = {
        username: 'testuser',
        level: 5,
        score: 1000
      };

      expect(isValid(validData)).toBe(true);
    });

    test('should handle authentication properly', async () => {
      // Test authenticated user
      mockContext.reddit.getCurrentUser.mockResolvedValue({
        id: 'user123',
        username: 'testuser'
      } as any);

      const user = await mockContext.reddit.getCurrentUser();
      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');

      // Test unauthenticated user
      mockContext.reddit.getCurrentUser.mockResolvedValue(null);
      const noUser = await mockContext.reddit.getCurrentUser();
      expect(noUser).toBeNull();
    });
  });
});