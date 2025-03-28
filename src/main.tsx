import './createPost.js';

import { Devvit, useState, useWebView } from '@devvit/public-api';

import type { DevvitMessage, WebViewMessage } from './message.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Cybersecurity challenges collection
const challenges = [
  {
    id: "c1",
    title: "Suspicious Friend Request",
    scenario: "You receive a friend request from someone claiming to be an old school friend, but their profile was created yesterday and has no mutual friends. What should you do?",
    correctAnswer: "ignore",
    explanation: "It's best to ignore friend requests from suspicious profiles with no mutual connections. This could be an attempt to gather your personal information."
  },
  {
    id: "c2",
    title: "Strange Email Link",
    scenario: "You receive an email claiming to be from your bank asking you to click a link to verify your account details. The email address looks unusual. What should you do?",
    correctAnswer: "report",
    explanation: "This is a classic phishing attempt. You should report it to your email provider and never click suspicious links claiming to be from financial institutions."
  },
  {
    id: "c3",
    title: "Harassing Comments",
    scenario: "A user is repeatedly leaving threatening and abusive comments on your posts. What's the best action to take?",
    correctAnswer: "block",
    explanation: "Blocking the user prevents them from interacting with your content, which is appropriate for repeated harassment. You may also want to report them if the content violates platform rules."
  },
  {
    id: "c4",
    title: "Offensive Content",
    scenario: "You come across a post containing hate speech that violates Reddit's content policy. What should you do?",
    correctAnswer: "report",
    explanation: "Content that violates platform policies should be reported so moderators can review and take appropriate action."
  },
  {
    id: "c5",
    title: "Accidental Private Information",
    scenario: "You notice you accidentally included your phone number in a public comment. What should you do?",
    correctAnswer: "delete",
    explanation: "When you accidentally share personal information, deleting the content quickly is the best way to minimize exposure."
  }
];

// Get a random challenge
function getRandomChallenge() {
  const randomIndex = Math.floor(Math.random() * challenges.length);
  return challenges[randomIndex];
}

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'CyberQuest Game',
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
        switch (message.type) {
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
            // Check if the answer is correct
            const isCorrect = message.data.answer === challenge.correctAnswer;
            
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
                correctAnswer: challenge.correctAnswer
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
          default:
            throw new Error(`Unknown message type: ${message satisfies never}`);
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
          <vstack alignment="middle center">
            <text size="xxlarge" weight="bold" color="brand">
              RedditQuest Cybersecurity Game Challenge
            </text>
            <text size="large">Test your online safety knowledge</text>
          </vstack>
          
          <vstack backgroundColor="neutralBorder" cornerRadius="small" padding="small">
            <hstack gap="small" alignment="center middle">
              <image url="https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png" size="small" />
              <vstack>
              <hstack gap="small" alignment="center">
              <text size="large" weight="bold">Username:</text>
              <text size="small" weight="bold" color="white">
                {username ?? 'anonymous'}
              </text>
            </hstack>
            <hstack gap="small" alignment="center">
              <text size="large" weight="bold">Current score:</text>
              <text size="small" weight="bold" color="primary">
                {score ?? '0'} points
              </text>
            </hstack>
          </vstack>
        </hstack>
      </vstack>
          
          <vstack backgroundColor="error" cornerRadius="small" padding="large" gap="medium">
            <text weight="bold" size="large" color="white">{challenge?.title || 'Loading Challenge...'}</text>
            <text color="white">{challenge?.scenario || 'Please wait while we load your cybersecurity challenge.'}</text>
          </vstack>
          
          <hstack alignment="middle center">
            <button appearance="primary" size="large" onPress={() => webView.mount()}>
              Answer Challenge
            </button>
          </hstack>
          
          <text size="small" color="textSecondary" alignment="center">
            Built as Cybersecurity Awareness Game
          </text>
        </vstack>
      </vstack>
    );
  },
});

// Process comment-based answers
Devvit.addTrigger({
  event: 'CommentSubmit',
  async onEvent(event, context) {
    if (event.type !== 'CommentSubmit') return;
    
    const comment = event.comment;
    const postId = comment.postId;
    const commentBody = comment.body.toLowerCase().trim();
    
    // Check if this is a valid action
    const validActions = ['report', 'block', 'delete', 'ignore'];
    if (!validActions.includes(commentBody)) return;
    
    // Get the challenge for this post
    const challengeData = await context.redis.get(`challenge_${postId}`);
    if (!challengeData) return;
    
    const challenge = JSON.parse(challengeData);
    const isCorrect = commentBody === challenge.correctAnswer;
    
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
    const replyText = isCorrect 
      ? `✅ Correct! ${challenge.explanation} You've earned 5 points.`
      : `❌ Not quite. The correct answer was "${challenge.correctAnswer}". ${challenge.explanation}`;
    
    await context.reddit.submitComment({
      parentId: comment.id,
      content: replyText
    });
  }
});

export default Devvit;