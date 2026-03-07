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

- `backend/` — Node.js + Express + TypeScript API
- `frontend/` — Mobile app (coming soon)
- `docs/` — Documentation

The backend uses Prisma as the ORM with PostgreSQL. The data model has four core entities: Baby, Feeding, Sleep, and Nappy. All events are linked to a Baby, and when auth is added later, babies will be linked to users.

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

## Running locally

Prerequisites: Docker Desktop, Node.js v20+

```bash
cd backend

# Start Postgres
docker-compose up -d

# Install dependencies
npm install

# Run database migration (name it "init" when prompted)
npm run db:migrate

# Seed test data (creates a baby named Luki)
npm run db:seed

# Start the dev server (hot-reloads on file changes)
npm run start:dev
```

The API runs on `http://localhost:3000`. To browse the database visually, run `npm run db:studio` (opens at `http://localhost:5555`).

### Example requests

Create a feeding:

```bash
curl -X POST http://localhost:3000/feeding/00000000-0000-0000-0000-000000000001 \
  -H "Content-Type: application/json" \
  -d '{
    "startedAt": "2026-03-07T09:00:00.000Z",
    "endedAt": "2026-03-07T09:20:00.000Z",
    "type": "BREAST"
  }'
```

Get today's feedings:

```bash
curl http://localhost:3000/feeding/00000000-0000-0000-0000-000000000001
```
