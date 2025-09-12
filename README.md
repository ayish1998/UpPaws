# 🐾 UpPaws: Daily Animal Trivia for Redditors

A polished, Reddit-native daily animal trivia built on Devvit Web. Answer fun multiple-choice questions (A–D), earn points once per day, and learn wild facts together.

<div align="center">
  <img src="https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png" alt="UpPaws Logo" width="120" />
  <h3>Play daily. Learn wild.</h3>
</div>

## 🌟 Why UpPaws stands out

- **Daily shared question**: Everyone gets the same question each day (UTC)
- **Instant feedback**: Multiple-choice (A–D) with facts on every answer
- **Fair scoring**: Earn points once per day per user
- **Comment-native play**: Answer via comments (A/B/C/D or 1–4) or in-post UI
- **Leaderboard-ready**: Scores persisted per user; easy to surface rankings
- **Built for Reddit**: Devvit Web app designed for discussion and sharing

## 🎮 Gameplay

UpPaws presents animal trivia questions with four options (A–D). Pick the correct answer to earn points and see a fun fact. Answer via the embedded UI or by commenting A/B/C/D (or 1/2/3/4) on the post.

### Daily Mode
- A single daily question is featured for everyone each day (UTC).
- Each user can earn points once per day. Correct answers after that still show the explanation, but no extra points.

## 🚀 Getting Started

### For Subreddit Moderators

1. Install the UpPaws app on your subreddit
2. Use the "Create New UpPaws Trivia" option in the moderator tools
3. Engage your community with animal trivia!

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

UpPaws is built for polish and Beta readiness with daily content, fair scoring, and Reddit-native engagement via comments.
