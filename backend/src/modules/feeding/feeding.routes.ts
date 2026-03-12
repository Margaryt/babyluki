/**
 * Feeding routes.
 *
 * All routes are scoped to a specific baby via :babyId in the URL.
 * This keeps the API consistent across all endpoints, and supports
 * parents with multiple babies. When we add auth, :babyId will be removed
 * from the URL and instead will be determined from the authenticated user's
 * babies via middleware.
 */
import { Router } from 'express';
import {
  postSession,
  patchEndSession,
  deleteSessionHandler,
  postSegment,
  patchStopSegment,
  deleteSegmentHandler,
  getSessionsByDate,
} from './feeding.controller';

const router = Router();

/** Session routes. */
router.post('/:babyId', postSession);
router.get('/:babyId', getSessionsByDate);
router.patch('/:babyId/:sessionId/end', patchEndSession);
router.delete('/:babyId/:sessionId', deleteSessionHandler);

/** Segment routes. */
router.post('/:babyId/:sessionId/segment', postSegment);
router.patch('/:babyId/:sessionId/segment/:segmentId/stop', patchStopSegment);
router.delete('/:babyId/segment/:segmentId', deleteSegmentHandler);

export default router;