import { Devvit } from '@devvit/public-api';

// Adds a new menu item to the subreddit allowing to create a new animal trivia post
Devvit.addMenuItem({
  label: 'Create New AnimalQuest Trivia',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'AnimalQuest Trivia',
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading Animal Trivia...</text>
        </vstack>
      ),
    });
    ui.showToast({ text: 'Created animal trivia!' });
    ui.navigateTo(post);
  },
});