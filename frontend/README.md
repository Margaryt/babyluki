# Baby Luki — Frontend

Expo (React Native) app with three tabs: Day, Feed, Stats.

## Prerequisites

- Node.js 18+
- [Expo Go](https://apps.apple.com/app/expo-go/id982107779) on your phone
- For development: Phone and computer on the same Wi-Fi (for local dev)

## Start

```bash
# Install dependencies
npm install

# Run against production backend (Railway)
npm start

# Run against local backend (localhost:3000)
npm run start:local
```

Scan the QR code with your iPhone camera (not the Expo Go app) to open.

There are also platform-specific scripts that auto-open the app on a specific target:

```bash
npm run android   # Start and open in Android emulator
npm run ios       # Start and open in iOS simulator
npm run web       # Start and open in browser
```

## API URL

The app talks to `https://babyluki-production.up.railway.app` by default (set in `constants/Api.ts`). The `start:local` script reads from `.env.localdev` (git-ignored) to override this.

**Important:** We use `.env.localdev` instead of `.env.local` because Expo auto-loads `.env.local` files, which would override the production URL even when running `npm start`.

To set up local development, create a `.env.localdev` file with your machine's LAN IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.YOUR_IP:3000
```

Find your IP with `ipconfig getifaddr en0` on Mac.

**Switching between local and prod:** After switching API targets, force-close Expo Go on your phone and re-scan the QR code. Expo Go can cache the old JS bundle in memory.

## Build for App Store

```bash
npx eas build --profile production --platform ios
npx eas submit --platform ios
```

## Tech stack

- Expo SDK 54 / React Native 0.81
- Expo Router (file-based routing)
- TypeScript
