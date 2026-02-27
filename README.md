# Baby Luki

This app helps parents track their baby's feeding and sleeping cycles.

## Structure
- `backend/`: API and data storage
- `frontend/`: User interface
- `docs/`: Documentation

## Features
- Log feeding times and amounts
- Track sleep cycles
- View history and statistics

## Example: Create a feeding

Use the following example to create a feeding entry (the API runs on port 3000):

```bash
curl -X POST http://localhost:3000/feeding \
	-H "Content-Type: application/json" \
	-d '{
		"startedAt":"2026-02-28T09:00:00.000Z",
		"endedAt":"2026-02-28T09:20:00.000Z",
		"type":"breast",
		"notes":"Baby fed well, fell asleep"
	}'
```

## Start the backend (development)

Start the backend in development mode using the `start:dev` script defined in `backend/package.json`:

```bash
cd backend
npm install    # if you haven't already
npm run start:dev
```

This runs `npx ts-node src/server.ts` under the hood.
