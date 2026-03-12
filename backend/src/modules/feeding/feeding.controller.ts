/** Feeding controller — handles HTTP requests and delegates to the service layer. */
import { Request, Response } from 'express';
import {
  startSession,
  endFeedingSession,
  removeFeedingSession,
  removeFeedingSegment,
  addSegment,
  stopFeedingSegment,
  getSessions,
} from './feeding.service';
import {
  CreateSessionRequest,
  EndSessionRequest,
  CreateSegmentRequest,
  StopSegmentRequest,
} from './feeding.types';

// ---------------------------------------------------------------------------
// Session handlers
// ---------------------------------------------------------------------------

/**
 * POST /:babyId
 * Creates a new feeding session for the given baby.
 */
export const postSession = async (
  req: Request<{ babyId: string }, {}, CreateSessionRequest>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const session = await startSession({ ...req.body, babyId });
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create feeding session' });
  }
};

/**
 * PATCH /:babyId/:sessionId/end
 * Ends an active feeding session.
 */
export const patchEndSession = async (
  req: Request<{ babyId: string; sessionId: string }, {}, EndSessionRequest>,
  res: Response
) => {
  try {
    const { babyId, sessionId } = req.params;
    const session = await endFeedingSession({ ...req.body, babyId, sessionId });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to end feeding session' });
  }
};

/**
 * GET /:babyId?date=YYYY-MM-DD
 * Returns all feeding sessions for a baby on a given date. Defaults to today.
 */
export const getSessionsByDate = async (
  req: Request<{ babyId: string }, {}, {}, { date?: string }>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const sessions = await getSessions(babyId, date);
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feeding sessions' });
  }
};

/**
 * DELETE /:babyId/:sessionId
 * Deletes a feeding session and all its segments.
 */
export const deleteSessionHandler = async (
  req: Request<{ babyId: string; sessionId: string }>,
  res: Response
) => {
  try {
    const { babyId, sessionId } = req.params;
    await removeFeedingSession(sessionId, babyId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete feeding session' });
  }
};

// ---------------------------------------------------------------------------
// Segment handlers
// ---------------------------------------------------------------------------

/**
 * POST /:babyId/:sessionId/segment
 * Starts a new segment within an active session.
 */
export const postSegment = async (
  req: Request<{ babyId: string; sessionId: string }, {}, CreateSegmentRequest>,
  res: Response
) => {
  try {
    const { babyId, sessionId } = req.params;
    const segment = await addSegment({ ...req.body, babyId, sessionId });
    res.status(201).json(segment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create segment' });
  }
};

/**
 * PATCH /:babyId/:sessionId/segment/:segmentId/stop
 * Stops an active segment.
 */
export const patchStopSegment = async (
  req: Request<{ babyId: string; sessionId: string; segmentId: string }, {}, StopSegmentRequest>,
  res: Response
) => {
  try {
    const { babyId, sessionId, segmentId } = req.params;
    const segment = await stopFeedingSegment({ ...req.body, babyId, sessionId, segmentId });
    res.json(segment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop segment' });
  }
};

/**
 * DELETE /:babyId/segment/:segmentId
 * Deletes a single segment. Ownership is validated via the parent session.
 */
export const deleteSegmentHandler = async (
  req: Request<{ babyId: string; segmentId: string }>,
  res: Response
) => {
  try {
    const { babyId, segmentId } = req.params;
    await removeFeedingSegment(segmentId, babyId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
};