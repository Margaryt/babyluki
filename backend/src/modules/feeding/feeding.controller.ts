/** Feeding controller — handles HTTP requests and delegates to the service layer. */
import { Request, Response } from 'express';
import * as feedingService from './feeding.service';
import {
  CreateSessionRequest,
  EndSessionRequest,
  CreateSegmentRequest,
  StopSegmentRequest,
} from './feeding.types';

// ---------------------------------------------------------------------------
// Session handlers
// ---------------------------------------------------------------------------

/** POST /sessions/:babyId */
export const createSession = async (
  req: Request<{ babyId: string }, {}, CreateSessionRequest>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const session = await feedingService.startSession({ ...req.body, babyId });
    res.status(201).json(session);
  } catch (err: any) {
    if (err.message?.includes('already active')) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create feeding session' });
  }
};

/** GET /sessions/day/:babyId?date=YYYY-MM-DD */
export const getDaySessions = async (
  req: Request<{ babyId: string }, {}, {}, { date?: string }>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const dayView = await feedingService.getDayView(babyId, date);
    res.json(dayView);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feeding sessions' });
  }
};

/** GET /sessions/stats/:babyId?days=7 */
export const getStats = async (
  req: Request<{ babyId: string }, {}, {}, { days?: string }>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const days = req.query.days ? parseInt(req.query.days, 10) : 7;
    const stats = await feedingService.getStats(babyId, days);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feeding statistics' });
  }
};

/** GET /sessions/:sessionId */
export const getSessionDetail = async (
  req: Request<{ sessionId: string }>,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    const detail = await feedingService.getSessionDetail(sessionId);
    res.json(detail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session detail' });
  }
};

/** PATCH /sessions/:sessionId/end */
export const endSession = async (
  req: Request<{ sessionId: string }, {}, EndSessionRequest>,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    const session = await feedingService.endFeedingSession(sessionId, req.body.notes);
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to end feeding session' });
  }
};

/** DELETE /sessions/:sessionId */
export const deleteSession = async (
  req: Request<{ sessionId: string }>,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    await feedingService.removeFeedingSession(sessionId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete feeding session' });
  }
};

// ---------------------------------------------------------------------------
// Segment handlers
// ---------------------------------------------------------------------------

/** POST /segments/:sessionId */
export const createSegment = async (
  req: Request<{ sessionId: string }, {}, CreateSegmentRequest>,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    const segment = await feedingService.addSegment({ ...req.body, sessionId });
    res.status(201).json(segment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create segment' });
  }
};

/** PATCH /segments/:segmentId/stop */
export const stopSegment = async (
  req: Request<{ segmentId: string }, {}, StopSegmentRequest>,
  res: Response
) => {
  try {
    const { segmentId } = req.params;
    const segment = await feedingService.stopFeedingSegment(segmentId, req.body.notes);
    res.json(segment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop segment' });
  }
};

/** DELETE /segments/:segmentId */
export const deleteSegment = async (
  req: Request<{ segmentId: string }>,
  res: Response
) => {
  try {
    const { segmentId } = req.params;
    await feedingService.removeFeedingSegment(segmentId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
};
