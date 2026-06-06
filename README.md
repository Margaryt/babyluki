# Baby Luki

I'm a backend engineer and a new mom. Baby Luki is a project where I'm combining both of those worlds — building a real app for tracking my baby's daily rhythms while learning how to integrate AI into a product. It started because I wanted something simple to log feedings at 3am, and grew into a project I'm genuinely excited about: an app that helps tired parents understand what's going on with their baby, not just record data.

## What the app does (MVP)

Baby Luki is a baby feeding tracker. The current MVP supports:

- **Feed tracking**: start a feeding session, log breast (left/right) or bottle segments with a running timer, and record events (burps, spills, coughs) during the feed
- **Day overview**: see all feeds for a given day, navigate between days with left/right arrows
- **Session detail**: tap a feed to see a timeline of segments and events with durations

## What's next (post-MVP)

- **Sleep & nappy tracking**
- **Daily AI summary**: plain-language insights for exhausted parents ("Luki fed 8 times today, 20% more than yesterday — could be a growth spurt")
- **Pattern detection**: growth spurts, routine changes, regressions
- **Stats & charts**: feeding patterns over time
- **Multi-user auth**: other parents can register and track their own babies

## Architecture

An Expo (React Native) app. All data is stored on-device using SQLite via `expo-sqlite` — nothing leaves the phone. The data model centres on feeding sessions: a FeedingSession groups one or more FeedingSegments (e.g. left breast → right breast → bottle top-up). FeedingEvents (burps, spills, coughs) are point-in-time events linked to a session.

See `docs/` for data model diagrams and UI mockups.

## Tech stack

- Expo SDK 54 / React Native 0.81
- Expo Router (file-based routing)
- expo-sqlite (local on-device storage)
- TypeScript

## Running the app

### Prerequisites

- Node.js 18+
- [Expo Go](https://apps.apple.com/app/expo-go/id982107779) on your iPhone

### Start

```bash
npm install
npm start
```

Scan the QR code with your iPhone camera to open in Expo Go. Your phone and computer must be on the same Wi-Fi.

```bash
npm run ios       # Open in iOS simulator
npm run android   # Open in Android emulator
npm run web       # Open in browser
```

## Build for App Store

```bash
npx eas build --profile production --platform ios
npx eas submit --platform ios
```
