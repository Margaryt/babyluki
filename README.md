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

This is a monorepo with the following structure:

- `backend/` — Node.js + Express + TypeScript API ([setup & API docs](backend/README.md))
- `frontend/` — Expo (React Native) mobile app ([setup & dev docs](frontend/README.md))
- `docs/` — Data model diagrams and UI mockups

The backend uses Prisma as the ORM with PostgreSQL, deployed on Railway. The data model centres on a Baby entity. Feedings use a session/segment pattern — a FeedingSession groups one or more FeedingSegments (e.g. left breast → right breast → bottle top-up). FeedingEvents (burps, spills, and coughs) are point-in-time events linked to a session. All timestamps are provided by the client device to avoid timezone issues between the phone and the server.

The frontend is an Expo SDK 54 app using expo-router for file-based routing, tested via Expo Go on iPhone.
