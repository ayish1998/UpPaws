import './createPost.js';

import { Devvit, useState, useWebView } from '@devvit/public-api';

import type { DevvitMessage, WebViewMessage } from './message.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Animal trivia questions collection
const challenges = [
  {
    id: "a1",
    title: "Animal Trivia",
    question: "Which mammal is known to have the most powerful bite?",
    options: ["Lion", "Hippopotamus", "Grizzly Bear", "Tiger"],
    correctIndex: 1,
    explanation: "The hippopotamus has one of the most powerful bites among land mammals, reaching over 1,800 PSI."
  },
  {
    id: "a2",
    title: "Animal Trivia",
    question: "What is the fastest bird in the world?",
    options: ["Golden Eagle", "Peregrine Falcon", "Albatross", "Swift"],
    correctIndex: 1,
    explanation: "The peregrine falcon can exceed 200 mph (320 km/h) in a hunting dive."
  },
  {
    id: "a3",
    title: "Animal Trivia",
    question: "Which animal can sleep standing up and lying down?",
    options: ["Horse", "Giraffe", "Cow", "All of the above"],
    correctIndex: 3,
    explanation: "Horses, giraffes, and cows can all sleep standing, and they also lie down for deeper sleep."
  },
  {
    id: "a4",
    title: "Animal Trivia",
    question: "What is a group of crows called?",
    options: ["A pack", "A murder", "A colony", "A gaggle"],
    correctIndex: 1,
    explanation: "A group of crows is famously called a 'murder.'"
  },
  {
    id: "a5",
    title: "Animal Trivia",
    question: "Which sea creature has three hearts?",
    options: ["Octopus", "Dolphin", "Shark", "Seal"],
    correctIndex: 0,
    explanation: "Octopuses have three hearts: two pump blood to the gills, and one to the rest of the body."
  }
];

// Get a random challenge
function getRandomChallenge() {
  const randomIndex = Math.floor(Math.random() * challenges.length);
  return challenges[randomIndex];
}

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'AnimalQuest Game',
  height: 'tall',
  render: (context) => {
    // Load username with useAsync hook
    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? 'anon';
    });

    // Load user score from redis
    const [score] = useState(async () => {
      if (!username) return 0;
      const userScore = await context.redis.get(`user_score_${username}`);
      return Number(userScore ?? 0);
    });

    // Get current challenge for this post
    const [challenge] = useState(async () => {
      // Try to get existing challenge for this post
      const existingChallenge = await context.redis.get(`challenge_${context.postId}`);
      if (existingChallenge) {
        return JSON.parse(existingChallenge);
      }
      
      // Create a new challenge for this post
      const newChallenge = getRandomChallenge();
      await context.redis.set(`challenge_${context.postId}`, JSON.stringify(newChallenge));
      return newChallenge;
    });

    // Function to update score
    async function updateScore(newScore: number) {
      if (username) {
        await context.redis.set(`user_score_${username}`, newScore.toString());
        
        // Update leaderboard
        const leaderboardData = await context.redis.get('leaderboard');
        let leaderboard = [];
        if (leaderboardData) {
          leaderboard = JSON.parse(leaderboardData);
        }
        
        const userIndex = leaderboard.findIndex((entry: any) => entry.username === username);
        if (userIndex >= 0) {
          leaderboard[userIndex].score = newScore;
        } else {
          leaderboard.push({ username, score: newScore });
        }
        
        // Sort by score (descending)
        leaderboard.sort((a: any, b: any) => b.score - a.score);
        
        // Save updated leaderboard
        await context.redis.set('leaderboard', JSON.stringify(leaderboard));
      }
    }

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      // URL of your web view content
      url: 'page.html',

      // Handle messages sent from the web view
      async onMessage(message, webView) {
        // Check if message is valid and has a type
        if (!message || typeof message !== 'object') {
          console.error('Invalid message received', message);
          return;
        }

        // Get and validate message type
        const messageType = message.type;
        if (!messageType || typeof messageType !== 'string') {
          console.error('Message missing valid type property', message);
          return;
        }

        try {
          switch (messageType) {
            case 'webViewReady':
              // Send initial data to the web view
              webView.postMessage({
                type: 'initialData',
                data: {
                  username: username,
                  challenge: challenge,
                  userScore: score
                },
              });
              break;
            case 'submitAnswer':
              if (!message.data || typeof message.data.selectedIndex !== 'number') {
                console.error('Submit answer message missing selectedIndex', message);
                return;
              }
              
              // Check if the answer is correct
              const isCorrect = message.data.selectedIndex === challenge.correctIndex;
              
              // Update user score if correct
              if (isCorrect && username) {
                const newScore = score + 5;
                await updateScore(newScore);
                
                // Send score update
                webView.postMessage({
                  type: 'updateScore',
                  data: { newScore }
                });
              }
              
              // Send answer result to the web view
              webView.postMessage({
                type: 'answerResult',
                data: {
                  isCorrect,
                  explanation: challenge.explanation,
                  correctIndex: challenge.correctIndex
                }
              });
              break;
            case 'getNextChallenge':
              // Generate a new challenge and send it to the web view
              const newChallenge = getRandomChallenge();
              
              // Update the challenge in Redis for this post
              await context.redis.set(`challenge_${context.postId}`, JSON.stringify(newChallenge));
              
              // Send the new challenge to the web view
              webView.postMessage({
                type: 'nextChallenge',
                data: {
                  challenge: newChallenge
                }
              });
              break;
            case 'close':
              // Close the web view when explicitly requested
              webView.unmount();
              break;
            default:
              console.error(`Unknown message type: ${messageType}`, message);
          }
        } catch (error) {
          console.error('Error processing message:', error, message);
        }
      },
      onUnmount() {
        context.ui.showToast('Web view closed!');
      },
    });

    // Render the custom post type
    return (
      <vstack grow padding="large">
        <vstack grow gap="large">
          <vstack alignment="middle center" gap="small">
            <text size="xlarge" weight="bold" color="brand">
              AnimalQuest Trivia
            </text>
            <text size="medium">Test your animal knowledge</text>
          </vstack>
          
          <vstack backgroundColor="error" borderRadius="medium" padding="medium">
            <hstack gap="medium" alignment="center middle" padding="small">
              <image url="https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png" size="small" />
              <vstack gap="medium">
                <hstack gap="medium" alignment="center">
                  <text size="medium" weight="bold">Username:</text>
                  <text size="medium" weight="bold" color="white">
                    {username ?? 'anonymous'}
                  </text>
                </hstack>
                <hstack gap="medium" alignment="center">
                  <text size="medium" weight="bold">Current score:</text>
                  <text size="medium" weight="bold" color="white">
                    {score ?? '0'} points
                  </text>
                </hstack>
              </vstack>
            </hstack>
          </vstack>
          
          <vstack backgroundColor="error" borderRadius="medium" padding="large" gap="large">
            <text weight="bold" size="xlarge" color="white">{challenge?.title || 'Loading Challenge...'}</text>
            <text size="medium" color="white">{challenge?.question || 'Please wait while we load your animal trivia question.'}</text>
          </vstack>
          
          <vstack alignment="middle center" padding="medium">
            <button appearance="primary" size="large" onPress={() => webView.mount()}>
              Play Trivia
            </button>
          </vstack>
          
          <vstack alignment="middle center" padding="small">
            <text size="small" color="textSecondary" alignment="center">
              Built as Reddit's Animal Trivia Game
            </text>
          </vstack>
        </vstack>
      </vstack>
    );
  },
});

// Process comment-based answers (A/B/C/D or 1/2/3/4)
Devvit.addTrigger({
  event: 'CommentSubmit',
  async onEvent(event, context) {
    if (event.type !== 'CommentSubmit') return;
    
    const comment = event.comment;
    const postId = comment.postId;
    const commentBody = comment.body.toLowerCase().trim();
    
    // Map common formats to indices
    const mapToIndex = (body: string): number | null => {
      if (body === 'a' || body === '1') return 0;
      if (body === 'b' || body === '2') return 1;
      if (body === 'c' || body === '3') return 2;
      if (body === 'd' || body === '4') return 3;
      return null;
    };
    const selectedIndex = mapToIndex(commentBody);
    if (selectedIndex === null) return;
    
    // Get the challenge for this post
    const challengeData = await context.redis.get(`challenge_${postId}`);
    if (!challengeData) return;
    
    const challenge = JSON.parse(challengeData);
    const isCorrect = selectedIndex === challenge.correctIndex;
    
    // Update user score if we have a user
    const username = comment.author;
    if (username && isCorrect) {
      // Get current score
      const currentScoreData = await context.redis.get(`user_score_${username}`);
      const currentScore = Number(currentScoreData ?? 0);
      
      // Add points
      const newScore = currentScore + 5;
      await context.redis.set(`user_score_${username}`, newScore.toString());
    }
    
    // Reply with feedback
    const letters = ['A', 'B', 'C', 'D'];
    const replyText = isCorrect 
      ? `✅ Correct! ${challenge.explanation} You've earned 5 points.`
      : `❌ Not quite. The correct answer was "${letters[challenge.correctIndex]}". ${challenge.explanation}`;
    
    await context.reddit.submitComment({
      parentId: comment.id,
      content: replyText
    });
  }
});

export default Devvit;