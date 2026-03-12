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
curl -s -X POST http://localhost:3000/feeding/sessions/$BABY \
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
curl -s http://localhost:3000/feeding/sessions/$SESSION_ID
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
  "burps": [
    { "timestamp": "2026-03-13T08:23:00.000Z" }
  ]
}
```

### End a session

```bash
curl -s -X PATCH http://localhost:3000/feeding/sessions/$SESSION_ID/end \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Fed well" }'
```

### Day view (all sessions + summary)

```bash
# Today (default)
curl -s http://localhost:3000/feeding/sessions/day/$BABY

# Specific date
curl -s "http://localhost:3000/feeding/sessions/day/$BABY?date=2026-03-12"
```

```json
{
  "date": "2026-03-13",
  "totalSessions": 3,
  "totalFeedingMinutes": 42.5,
  "totalBottleMl": 120,
  "totalBurps": 4,
  "sessions": [ "..." ]
}
```

### Statistics

```bash
# Last 7 days (default)
curl -s http://localhost:3000/feeding/sessions/stats/$BABY

# Last 14 days
curl -s "http://localhost:3000/feeding/sessions/stats/$BABY?days=14"
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
    "burpsPerSession": 1.3
  }
}
```

### Delete a session

```bash
curl -s -X DELETE http://localhost:3000/feeding/sessions/$SESSION_ID
# 204 No Content
```

---

## Segment endpoints

### Add a segment

```bash
curl -s -X POST http://localhost:3000/feeding/segments/$SESSION_ID \
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
curl -s -X POST http://localhost:3000/feeding/segments/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{ "side": "BOTTLE", "volumeMl": 120 }'
```

### Stop a segment

```bash
curl -s -X PATCH http://localhost:3000/feeding/segments/$SEGMENT_ID/stop \
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
curl -s -X DELETE http://localhost:3000/feeding/segments/$SEGMENT_ID
# 204 No Content
```

---

## Burp endpoints

### Log a burp

```bash
# Standalone burp
curl -s -X POST http://localhost:3000/burp/$BABY \
  -H "Content-Type: application/json" \
  -d '{}'

# Burp linked to a feeding session
curl -s -X POST http://localhost:3000/burp/$BABY \
  -H "Content-Type: application/json" \
  -d '{ "sessionId": "a1b2c3..." }'

# Burp with custom timestamp
curl -s -X POST http://localhost:3000/burp/$BABY \
  -H "Content-Type: application/json" \
  -d '{ "timestamp": "2026-03-13T08:23:00.000Z" }'
```

```json
{
  "id": "g7h8i9...",
  "babyId": "00000000-...",
  "sessionId": null,
  "timestamp": "2026-03-13T08:23:00.000Z",
  "createdAt": "2026-03-13T08:23:00.000Z"
}
```

### Get burps by date

```bash
# Today (default)
curl -s http://localhost:3000/burp/$BABY

# Specific date
curl -s "http://localhost:3000/burp/$BABY?date=2026-03-12"
```

### Delete a burp

```bash
curl -s -X DELETE http://localhost:3000/burp/$BURP_ID
# 204 No Content
```

---

## Deployment (Railway)

The app is configured for Railway with a custom start command:

```
npx prisma migrate deploy && npm start
```

Set root directory to `backend/` and add `DATABASE_URL` as a reference variable pointing to the Postgres addon.
