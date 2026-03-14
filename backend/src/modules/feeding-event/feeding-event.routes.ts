/**
 * FeedingEvent routes.
 *
 * Covers both burps and spills via a `type` field in the request body.
 * All events go through POST /:babyId with a required `type` and
 * optional `sessionId`. This keeps the API surface small and consistent.
 */
import { Router } from 'express';
import { createEvent, getEventsByDate, deleteEvent } from './feeding-event.controller';

const router = Router();

router.get('/:babyId', getEventsByDate);
router.post('/:babyId', createEvent);
router.delete('/:eventId', deleteEvent);

export default router;
