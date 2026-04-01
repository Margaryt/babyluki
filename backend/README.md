# Baby Luki — Backend

Node.js + Express + TypeScript API with Prisma and PostgreSQL.

## Running locally

Prerequisites: Docker Desktop, Node.js v20+

```bash
# Start Postgres
docker-compose up -d

# Install dependencies
npm install

# Run database migration
npm run db:migrate

# Seed test data (creates a baby named Luki)
npm run db:seed

# Start the dev server (hot-reloads on file changes)
npm run dev
```

The API runs on `http://localhost:3000`. To browse the database visually, run `npm run db:studio` (opens at `http://localhost:5555`).

To drop and recreate the entire local database (useful when testing from a clean slate):

```bash
npx prisma migrate reset
```

## Test baby

The seed creates a baby with a fixed ID you can use for all API calls:

```
BABY=00000000-0000-0000-0000-000000000001
```

All examples below use `$BABY` as shorthand.

---

## Session endpoints

### Start a session

```bash
curl -s -X POST http://localhost:3000/feedings/sessions/$BABY \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Morning feed" }'
```

```json
{
  "id": "a1b2c3...",
  "babyId": "00000000-...",
  "startedAt": "2026-03-13T08:00:00.000Z",
  "endedAt": null,
  "notes": "Morning feed",
  "createdAt": "2026-03-13T08:00:00.000Z",
  "segments": []
}
```

### Session detail

```bash
curl -s http://localhost:3000/feedings/sessions/$SESSION_ID
```

```json
{
  "id": "a1b2c3...",
  "babyId": "00000000-...",
  "startedAt": "2026-03-13T08:00:00.000Z",
  "endedAt": "2026-03-13T08:25:00.000Z",
  "notes": "Morning feed",
  "createdAt": "2026-03-13T08:00:00.000Z",
  "segments": [ "..." ],
  "totalDurationMinutes": 25,
  "activeFeedingMinutes": 22.3,
  "totalBottleMl": 0,
  "burpCount": 1,
  "spillCount": 0,
  "coughCount": 1,
  "events": [
    { "type": "BURP", "timestamp": "2026-03-13T08:23:00.000Z" },
    { "type": "COUGH", "timestamp": "2026-03-13T08:24:00.000Z" }
  ]
}
```

### End a session

```bash
curl -s -X PATCH http://localhost:3000/feedings/sessions/$SESSION_ID/end \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Fed well" }'
```

### Day view (all sessions + summary)

```bash
# Today (default)
curl -s http://localhost:3000/feedings/sessions/day/$BABY

# Specific date
curl -s "http://localhost:3000/feedings/sessions/day/$BABY?date=2026-03-12"
```

```json
{
  "date": "2026-03-13",
  "totalSessions": 3,
  "totalFeedingMinutes": 42.5,
  "totalBottleMl": 120,
  "totalBurps": 4,
  "totalSpills": 2,
  "totalCoughs": 3,
  "sessions": [ "..." ]
}
```

### Statistics

```bash
# Last 7 days (default)
curl -s http://localhost:3000/feedings/sessions/stats/$BABY

# Last 14 days
curl -s "http://localhost:3000/feedings/sessions/stats/$BABY?days=14"
```

```json
{
  "feedingWindows": [
    {
      "date": "2026-03-07",
      "sessions": [
        { "startedAt": "2026-03-07T06:30:00.000Z", "endedAt": "2026-03-07T07:00:00.000Z" },
        { "startedAt": "2026-03-07T10:15:00.000Z", "endedAt": "2026-03-07T10:40:00.000Z" }
      ]
    }
  ],
  "averages": {
    "feedsPerDay": 6.2,
    "avgSessionMinutes": 18.4,
    "avgGapMinutes": 142.5,
    "dailyBottleMl": 240,
    "burpsPerSession": 1.3,
    "spillsPerDay": 1.8,
    "coughsPerDay": 2.1
  }
}
```

### Delete a session

```bash
curl -s -X DELETE http://localhost:3000/feedings/sessions/$SESSION_ID
# 204 No Content
```

---

## Segment endpoints

### Add a segment

```bash
curl -s -X POST http://localhost:3000/feedings/segments/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{ "side": "LEFT" }'
```

```json
{
  "id": "d4e5f6...",
  "sessionId": "a1b2c3...",
  "order": 1,
  "side": "LEFT",
  "startedAt": "2026-03-13T08:00:05.000Z",
  "endedAt": null,
  "volumeMl": null,
  "createdAt": "2026-03-13T08:00:05.000Z"
}
```

For bottle feeds, include `volumeMl`:

```bash
curl -s -X POST http://localhost:3000/feedings/segments/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{ "side": "BOTTLE", "volumeMl": 120 }'
```

### Stop a segment

```bash
curl -s -X PATCH http://localhost:3000/feedings/segments/$SEGMENT_ID/stop \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Good latch" }'
```

```json
{
  "id": "d4e5f6...",
  "sessionId": "a1b2c3...",
  "order": 1,
  "side": "LEFT",
  "startedAt": "2026-03-13T08:00:05.000Z",
  "endedAt": "2026-03-13T08:12:00.000Z",
  "volumeMl": null,
  "notes": "Good latch",
  "createdAt": "2026-03-13T08:00:05.000Z"
}
```

### Delete a segment

```bash
curl -s -X DELETE http://localhost:3000/feedings/segments/$SEGMENT_ID
# 204 No Content
```

---

## Feeding event endpoints (burps, spills & coughs)

If a feeding session is currently active (not ended), events are automatically linked to it. Otherwise they are standalone.

### Log a feeding event

```bash
# Burp (auto-links to active session if one exists)
curl -s -X POST http://localhost:3000/events/$BABY \
  -H "Content-Type: application/json" \
  -d '{ "type": "BURP" }'

# Spill with custom timestamp
curl -s -X POST http://localhost:3000/events/$BABY \
  -H "Content-Type: application/json" \
  -d '{ "type": "SPILL", "timestamp": "2026-03-13T08:44:00.000Z" }'

# Cough during a feed
curl -s -X POST http://localhost:3000/events/$BABY \
  -H "Content-Type: application/json" \
  -d '{ "type": "COUGH" }'
```

```json
{
  "id": "g7h8i9...",
  "babyId": "00000000-...",
  "sessionId": "a1b2c3...",
  "type": "BURP",
  "timestamp": "2026-03-13T08:23:00.000Z",
  "createdAt": "2026-03-13T08:23:00.000Z"
}
```

### Get events by date

```bash
# All events today (default)
curl -s http://localhost:3000/events/$BABY

# Only spills on a specific date
curl -s "http://localhost:3000/events/$BABY?date=2026-03-12&type=SPILL"
```

### Delete an event

```bash
curl -s -X DELETE http://localhost:3000/events/$EVENT_ID
# 204 No Content
```

---

## Hiccup endpoints

If a feeding session is currently active (not ended), hiccups are automatically linked to it. Otherwise they are standalone.

### Start a hiccup

```bash
# Auto-links to active session if one exists
curl -s -X POST http://localhost:3000/hiccups/$BABY \
  -H "Content-Type: application/json" \
  -d '{}'
```

```json
{
  "id": "j1k2l3...",
  "babyId": "00000000-...",
  "sessionId": null,
  "startedAt": "2026-03-13T10:20:00.000Z",
  "endedAt": null,
  "createdAt": "2026-03-13T10:20:00.000Z"
}
```

### Stop a hiccup

```bash
curl -s -X PATCH http://localhost:3000/hiccups/$HICCUP_ID/stop \
  -H "Content-Type: application/json" \
  -d '{}'
```

```json
{
  "id": "j1k2l3...",
  "babyId": "00000000-...",
  "sessionId": null,
  "startedAt": "2026-03-13T10:20:00.000Z",
  "endedAt": "2026-03-13T10:28:00.000Z",
  "createdAt": "2026-03-13T10:20:00.000Z"
}
```

### Get hiccups by date

```bash
# Today (default)
curl -s http://localhost:3000/hiccups/$BABY

# Specific date
curl -s "http://localhost:3000/hiccups/$BABY?date=2026-03-12"
```

### Delete a hiccup

```bash
curl -s -X DELETE http://localhost:3000/hiccups/$HICCUP_ID
# 204 No Content
```

---

## Deployment (Railway)

The app is configured for Railway with a custom start command:

```
npx prisma migrate deploy && npm start
```

Set root directory to `backend/` and add `DATABASE_URL` as a reference variable pointing to the Postgres addon.
