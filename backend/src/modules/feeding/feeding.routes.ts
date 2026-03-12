/**
 * Feeding routes.
 *
 * Routes are grouped by resource:
 *   /sessions/* — feeding session lifecycle
 *   /segments/* — segment lifecycle within a session
 *
 * Route order matters: static segments like /day and /stats must
 * come before parameterised segments like /:sessionId, otherwise
 * Express will match "day" or "stats" as a sessionId.
 */
import { Router } from 'express';
import {
  createSession,
  getSessionDetail,
  getDaySessions,
  getStats,
  endSession,
  deleteSession,
  createSegment,
  stopSegment,
  deleteSegment,
} from './feeding.controller';

const router = Router();

/** Session routes — /feeding/sessions/* */
router.post('/sessions/:babyId', createSession);
router.get('/sessions/day/:babyId', getDaySessions);
router.get('/sessions/stats/:babyId', getStats);
router.get('/sessions/:sessionId', getSessionDetail);
router.patch('/sessions/:sessionId/end', endSession);
router.delete('/sessions/:sessionId', deleteSession);

/** Segment routes — /feeding/segments/* */
router.post('/segments/:sessionId', createSegment);
router.patch('/segments/:segmentId/stop', stopSegment);
router.delete('/segments/:segmentId', deleteSegment);

export default router;
