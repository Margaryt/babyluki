/**
 * Hiccup routes.
 *
 * Hiccups are duration events with startedAt/endedAt.
 * POST starts a hiccup, PATCH stops it, DELETE removes it.
 */
import { Router } from 'express';
import {
  createHiccup,
  getHiccupsByDate,
  stopHiccup,
  deleteHiccup,
} from './hiccup.controller';

const router = Router();

router.get('/:babyId', getHiccupsByDate);
router.post('/:babyId', createHiccup);
router.patch('/:hiccupId/stop', stopHiccup);
router.delete('/:hiccupId', deleteHiccup);

export default router;
