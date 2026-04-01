# Baby Luki

I'm a backend engineer and a new mom. Baby Luki is a project where I'm combining both of those worlds — building a real app for tracking my baby's daily rhythms while learning how to integrate AI into a product. It started because I wanted something simple to log feedings at 3am, and grew into a project I'm genuinely excited about: an app that helps tired parents understand what's going on with their baby, not just record data.

## What the app will do (end goal)

Baby Luki is a baby tracking app with an AI layer that turns raw data into useful insights for parents. The full vision:

- **Track everything**: feedings (breast/bottle), sleep, and nappy changes — logged quickly from a phone
- **Daily summary**: at the end of each day, the app summarizes what happened in plain language for an exhausted parent ("Luki fed 8 times today, 20% more than yesterday — could be a growth spurt")
- **AI insights**: detect patterns like growth spurts, routine changes, or regressions, and explain what to expect in the coming days
- **Routine tracking**: visualize feeding and sleep patterns over time to see whether the baby is establishing a routine
- **Multi-user**: other parents can register and track their own babies

## Architecture

This is a monorepo with the following structure:

- `backend/` — Node.js + Express + TypeScript API ([setup & API docs](backend/README.md))
- `frontend/` — Mobile app (coming soon)
- `docs/` — Data model diagrams and UI mockups — open `docs/ui-mockup-complete.html` in a browser to see all screens

The backend uses Prisma as the ORM with PostgreSQL. The data model centres on a Baby entity. Feedings use a session/segment pattern — a FeedingSession groups one or more FeedingSegments (e.g. left breast → right breast → bottle top-up). FeedingEvents (burps, spills, and coughs) are point-in-time events that can be standalone or linked to a session. Hiccups are duration events with startedAt/endedAt. Sleep and Nappy are simpler flat models. When auth is added later, babies will be linked to users.

## Building in thin slices

I'm building this incrementally, one working slice at a time:

1. **Slice 1** (current): Feeding module with Postgres persistence, local dev setup, no auth, no frontend
2. **Slice 2**: Deploy backend + DB to Railway, basic PWA frontend
3. **Slice 3**: Sleep + nappy modules
4. **Slice 4**: Daily summary screen (manual stats, no AI yet)
5. **Slice 5**: User auth
6. **Slice 6**: Native mobile app via Expo + TestFlight
7. **Slice 7**: AI daily summary + growth spurt detection

Each slice is a usable increment — the goal is to be using the app on my phone as early as possible.
