/**
 * Local SQLite database layer for Baby Luki.
 *
 * All feeding data is stored on-device — nothing leaves the phone.
 * This module mirrors the backend's Prisma data model using expo-sqlite.
 */
import * as SQLite from 'expo-sqlite';

// ---------------------------------------------------------------------------
// Types (same shapes the UI already uses)
// ---------------------------------------------------------------------------

export type SegmentSide = 'LEFT' | 'RIGHT' | 'BOTTLE';
export type FeedingEventType = 'BURP' | 'SPILL' | 'COUGH';

export interface FeedingSegmentResponse {
  id: string;
  sessionId: string;
  order: number;
  side: SegmentSide;
  startedAt: string;
  endedAt: string | null;
  volumeMl: number | null;
  notes: string | null;
  createdAt: string;
}

export interface FeedingSessionResponse {
  id: string;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  createdAt: string;
  segments: FeedingSegmentResponse[];
}

export interface FeedingEventResponse {
  id: string;
  sessionId: string | null;
  type: FeedingEventType;
  timestamp: string;
  createdAt: string;
}

export interface DayViewEvent {
  id: string;
  sessionId: string | null;
  type: FeedingEventType;
  timestamp: string;
}

export interface DayViewResponse {
  date: string;
  totalSessions: number;
  totalFeedingMinutes: number;
  totalBottleMl: number;
  totalBurps: number;
  totalSpills: number;
  totalCoughs: number;
  sessions: FeedingSessionResponse[];
  events: DayViewEvent[];
}

export interface FeedingSessionDetailResponse extends FeedingSessionResponse {
  totalDurationMinutes: number | null;
  activeFeedingMinutes: number;
  totalBottleMl: number;
  burpCount: number;
  spillCount: number;
  coughCount: number;
  events: Array<{ type: FeedingEventType; timestamp: string }>;
}

// ---------------------------------------------------------------------------
// Database singleton
// ---------------------------------------------------------------------------

let _db: SQLite.SQLiteDatabase | null = null;

/** Get (or create) the database connection. */
export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('babyluki.db');
  }
  return _db;
}

// ---------------------------------------------------------------------------
// UUID helper (simple v4-ish)
// ---------------------------------------------------------------------------

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Schema initialisation
// ---------------------------------------------------------------------------

/** Create tables if they don't exist. Call once on app start. */
export function initDatabase(): void {
  const db = getDb();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS feeding_session (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feeding_segment (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      side TEXT NOT NULL CHECK (side IN ('LEFT', 'RIGHT', 'BOTTLE')),
      started_at TEXT NOT NULL,
      ended_at TEXT,
      volume_ml INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES feeding_session(id) ON DELETE CASCADE,
      UNIQUE (session_id, "order")
    );

    CREATE TABLE IF NOT EXISTS feeding_event (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      type TEXT NOT NULL CHECK (type IN ('BURP', 'SPILL', 'COUGH')),
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES feeding_session(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_session_started ON feeding_session(started_at);
    CREATE INDEX IF NOT EXISTS idx_segment_session ON feeding_segment(session_id, started_at);
    CREATE INDEX IF NOT EXISTS idx_event_timestamp ON feeding_event(timestamp);
    CREATE INDEX IF NOT EXISTS idx_event_session ON feeding_event(session_id);
  `);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function getSegmentsForSession(db: SQLite.SQLiteDatabase, sessionId: string): FeedingSegmentResponse[] {
  const rows = db.getAllSync<{
    id: string;
    session_id: string;
    order: number;
    side: string;
    started_at: string;
    ended_at: string | null;
    volume_ml: number | null;
    notes: string | null;
    created_at: string;
  }>(
    'SELECT * FROM feeding_segment WHERE session_id = ? ORDER BY "order" ASC',
    [sessionId]
  );

  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    order: r.order,
    side: r.side as SegmentSide,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    volumeMl: r.volume_ml,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

function getEventsForSession(db: SQLite.SQLiteDatabase, sessionId: string): FeedingEventResponse[] {
  const rows = db.getAllSync<{
    id: string;
    session_id: string | null;
    type: string;
    timestamp: string;
    created_at: string;
  }>(
    'SELECT * FROM feeding_event WHERE session_id = ? ORDER BY timestamp ASC',
    [sessionId]
  );

  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    type: r.type as FeedingEventType,
    timestamp: r.timestamp,
    createdAt: r.created_at,
  }));
}

function sessionWithSegments(
  db: SQLite.SQLiteDatabase,
  row: { id: string; started_at: string; ended_at: string | null; notes: string | null; created_at: string }
): FeedingSessionResponse {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    notes: row.notes,
    createdAt: row.created_at,
    segments: getSegmentsForSession(db, row.id),
  };
}

// ---------------------------------------------------------------------------
// Session operations
// ---------------------------------------------------------------------------

/** Create a new feeding session. Throws if one is already active. */
export function startSession(startedAt: string, notes?: string): FeedingSessionResponse {
  const db = getDb();

  // Check for already-active session
  const active = db.getFirstSync<{ id: string }>(
    'SELECT id FROM feeding_session WHERE ended_at IS NULL LIMIT 1'
  );
  if (active) {
    throw new Error('A feeding session is already active. End it before starting a new one.');
  }

  const id = uuid();
  const now = new Date().toISOString();

  db.runSync(
    'INSERT INTO feeding_session (id, started_at, ended_at, notes, created_at) VALUES (?, ?, NULL, ?, ?)',
    [id, startedAt, notes ?? null, now]
  );

  return {
    id,
    startedAt,
    endedAt: null,
    notes: notes ?? null,
    createdAt: now,
    segments: [],
  };
}

/** End a feeding session. */
export function endSession(sessionId: string, endedAt: string, notes?: string): FeedingSessionResponse {
  const db = getDb();

  if (notes != null) {
    db.runSync(
      'UPDATE feeding_session SET ended_at = ?, notes = ? WHERE id = ?',
      [endedAt, notes, sessionId]
    );
  } else {
    db.runSync(
      'UPDATE feeding_session SET ended_at = ? WHERE id = ?',
      [endedAt, sessionId]
    );
  }

  const row = db.getFirstSync<{
    id: string; started_at: string; ended_at: string | null; notes: string | null; created_at: string;
  }>('SELECT * FROM feeding_session WHERE id = ?', [sessionId]);

  if (!row) throw new Error(`Session ${sessionId} not found`);
  return sessionWithSegments(db, row);
}

/** Get a session by ID. */
export function getSession(sessionId: string): FeedingSessionResponse | null {
  const db = getDb();
  const row = db.getFirstSync<{
    id: string; started_at: string; ended_at: string | null; notes: string | null; created_at: string;
  }>('SELECT * FROM feeding_session WHERE id = ?', [sessionId]);

  if (!row) return null;
  return sessionWithSegments(db, row);
}

/** Permanently delete a session and all its segments and events. */
export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.runSync('DELETE FROM feeding_event WHERE session_id = ?', [sessionId]);
  db.runSync('DELETE FROM feeding_segment WHERE session_id = ?', [sessionId]);
  db.runSync('DELETE FROM feeding_session WHERE id = ?', [sessionId]);
}

// ---------------------------------------------------------------------------
// Segment operations
// ---------------------------------------------------------------------------

/** Add a segment to a session. */
export function addSegment(
  sessionId: string,
  side: SegmentSide,
  startedAt: string,
  volumeMl?: number
): FeedingSegmentResponse {
  const db = getDb();

  // Get next order number
  const last = db.getFirstSync<{ max_order: number | null }>(
    'SELECT MAX("order") as max_order FROM feeding_segment WHERE session_id = ?',
    [sessionId]
  );
  const nextOrder = (last?.max_order ?? 0) + 1;

  const id = uuid();
  const now = new Date().toISOString();

  db.runSync(
    'INSERT INTO feeding_segment (id, session_id, "order", side, started_at, ended_at, volume_ml, notes, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, ?)',
    [id, sessionId, nextOrder, side, startedAt, volumeMl ?? null, now]
  );

  return {
    id,
    sessionId,
    order: nextOrder,
    side,
    startedAt,
    endedAt: null,
    volumeMl: volumeMl ?? null,
    notes: null,
    createdAt: now,
  };
}

/** Stop a segment. */
export function stopSegment(
  segmentId: string,
  endedAt: string,
  notes?: string
): FeedingSegmentResponse {
  const db = getDb();

  if (notes != null) {
    db.runSync(
      'UPDATE feeding_segment SET ended_at = ?, notes = ? WHERE id = ?',
      [endedAt, notes, segmentId]
    );
  } else {
    db.runSync(
      'UPDATE feeding_segment SET ended_at = ? WHERE id = ?',
      [endedAt, segmentId]
    );
  }

  const row = db.getFirstSync<{
    id: string; session_id: string; order: number; side: string;
    started_at: string; ended_at: string | null; volume_ml: number | null;
    notes: string | null; created_at: string;
  }>('SELECT * FROM feeding_segment WHERE id = ?', [segmentId]);

  if (!row) throw new Error(`Segment ${segmentId} not found`);

  return {
    id: row.id,
    sessionId: row.session_id,
    order: row.order,
    side: row.side as SegmentSide,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    volumeMl: row.volume_ml,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Event operations
// ---------------------------------------------------------------------------

/** Log a feeding event (burp, spill, cough). Auto-links to active session. */
export function logEvent(type: FeedingEventType, timestamp?: string): FeedingEventResponse {
  const db = getDb();
  const ts = timestamp ?? new Date().toISOString();

  // Auto-link to active session
  const active = db.getFirstSync<{ id: string }>(
    'SELECT id FROM feeding_session WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1'
  );

  const id = uuid();
  const now = new Date().toISOString();
  const sessionId = active?.id ?? null;

  db.runSync(
    'INSERT INTO feeding_event (id, session_id, type, timestamp, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, sessionId, type, ts, now]
  );

  return {
    id,
    sessionId,
    type,
    timestamp: ts,
    createdAt: now,
  };
}

// ---------------------------------------------------------------------------
// Day view query
// ---------------------------------------------------------------------------

/**
 * Get all sessions + events for a local calendar date (YYYY-MM-DD).
 * All times are already in local timezone (stored as ISO strings from the device clock).
 */
export function getDayView(date: string): DayViewResponse {
  const db = getDb();

  // Parse YYYY-MM-DD and build local day boundaries
  const [y, m, d] = date.split('-').map(Number);
  const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
  const startIso = startOfDay.toISOString();
  const endIso = endOfDay.toISOString();

  // Fetch sessions in range
  const sessionRows = db.getAllSync<{
    id: string; started_at: string; ended_at: string | null; notes: string | null; created_at: string;
  }>(
    'SELECT * FROM feeding_session WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC',
    [startIso, endIso]
  );

  const sessions = sessionRows.map((r) => sessionWithSegments(db, r));

  // Fetch events in range
  const eventRows = db.getAllSync<{
    id: string; session_id: string | null; type: string; timestamp: string; created_at: string;
  }>(
    'SELECT * FROM feeding_event WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
    [startIso, endIso]
  );

  const events: DayViewEvent[] = eventRows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    type: r.type as FeedingEventType,
    timestamp: r.timestamp,
  }));

  // Compute aggregates
  let totalFeedingMinutes = 0;
  let totalBottleMl = 0;
  for (const s of sessions) {
    for (const seg of s.segments) {
      if (seg.endedAt) {
        totalFeedingMinutes += (new Date(seg.endedAt).getTime() - new Date(seg.startedAt).getTime()) / 60_000;
      }
      totalBottleMl += seg.volumeMl ?? 0;
    }
  }

  const totalBurps = events.filter((e) => e.type === 'BURP').length;
  const totalSpills = events.filter((e) => e.type === 'SPILL').length;
  const totalCoughs = events.filter((e) => e.type === 'COUGH').length;

  return {
    date,
    totalSessions: sessions.length,
    totalFeedingMinutes: round(totalFeedingMinutes),
    totalBottleMl: round(totalBottleMl),
    totalBurps,
    totalSpills,
    totalCoughs,
    sessions,
    events,
  };
}

// ---------------------------------------------------------------------------
// Session detail query
// ---------------------------------------------------------------------------

/** Get detailed session view with computed summary fields. */
export function getSessionDetail(sessionId: string): FeedingSessionDetailResponse | null {
  const db = getDb();
  const row = db.getFirstSync<{
    id: string; started_at: string; ended_at: string | null; notes: string | null; created_at: string;
  }>('SELECT * FROM feeding_session WHERE id = ?', [sessionId]);

  if (!row) return null;

  const session = sessionWithSegments(db, row);
  const events = getEventsForSession(db, sessionId);

  const totalDurationMinutes = session.endedAt
    ? (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60_000
    : null;

  let activeFeedingMinutes = 0;
  let totalBottleMl = 0;
  for (const seg of session.segments) {
    if (seg.endedAt) {
      activeFeedingMinutes += (new Date(seg.endedAt).getTime() - new Date(seg.startedAt).getTime()) / 60_000;
    }
    totalBottleMl += seg.volumeMl ?? 0;
  }

  const burpCount = events.filter((e) => e.type === 'BURP').length;
  const spillCount = events.filter((e) => e.type === 'SPILL').length;
  const coughCount = events.filter((e) => e.type === 'COUGH').length;

  return {
    ...session,
    totalDurationMinutes: totalDurationMinutes !== null ? round(totalDurationMinutes) : null,
    activeFeedingMinutes: round(activeFeedingMinutes),
    totalBottleMl: round(totalBottleMl),
    burpCount,
    spillCount,
    coughCount,
    events: events.map((e) => ({
      type: e.type,
      timestamp: e.timestamp,
    })),
  };
}
