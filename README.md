# 🐾 UpPaws: Daily Animal Puzzle for Redditors

A polished, Reddit-native daily animal puzzle built on Devvit Web. Arrange letter tiles to guess the animal from an emoji hint, earn points once per day, and learn wild facts together.

<div align="center">
  <img src="https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png" alt="UpPaws Logo" width="120" />
  <h3>Play daily. Learn wild.</h3>
</div>

## 🌟 Why UpPaws stands out

- **Daily shared puzzle**: Everyone gets the same emoji+letters puzzle each day (UTC)
- **Instant feedback**: Clear correct/incorrect with a fun animal fact
- **Fair scoring**: Earn points once per day per user (time bonus, hint penalty)
- **In-post play**: Puzzle played via the embedded UI, tuned for mobile
- **Leaderboard-ready**: Scores persisted per user; easy to surface rankings
- **Built for Reddit**: Devvit Web app designed for discussion and sharing

## 🎮 Gameplay

UpPaws presents a daily emoji and a shuffled bank of letters. Drag/tap to fill the answer slots with letters to spell the animal.

### Daily Mode
- One shared puzzle per day (UTC) for all players.
- You can earn points once per day. Subsequent correct guesses still show the fact but award no points.
- Scoring: base 5 points, up to +5 time bonus (faster = more), and -2 if you used the hint.

## 🚀 Getting Started

### For Subreddit Moderators

1. Install the UpPaws app on your subreddit
2. Use the "Create New AnimalQuest Puzzle" option in the moderator tools
3. Engage your community with the daily animal puzzle!

### For Developers

#### Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Devvit CLI](https://developers.reddit.com/docs/devvit)

#### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ayish1998/redditquest-app-game
   cd redditquest-app-game


### License
    MIT

---

## 🏆 Hackathon Submission Info

- **Category**: Daily Games
- **Platform**: Devvit Web (Interactive Posts + WebView)
- **How to Test**:
  - Login: `devvit login`
  - Playtest: `devvit playtest --subreddit <your_test_subreddit>`
  - Or upload/install: `devvit upload` then `devvit install --subreddit <your_test_subreddit> --app redditquest-app@latest`
- **What to Submit**:
  - App listing link (after `devvit upload`): `developers.reddit.com/apps/{app-name}`
  - Demo Post: link to your public test subreddit with a live game post
  - Developer Reddit username(s)
  - Optional: 1-minute walkthrough video

UpPaws is built for polish and Beta readiness with daily content, fair scoring, and Reddit-native engagement inside posts.
