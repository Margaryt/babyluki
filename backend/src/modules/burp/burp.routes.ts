/**
 * Burp routes.
 *
 * All burps go through POST /:babyId with an optional sessionId in
 * the request body. This keeps the API surface small and consistent.
 */
import { Router } from 'express';
import { postBurp, getBurpsByDate, deleteBurpHandler } from './burp.controller';

const router = Router();

router.get('/:babyId', getBurpsByDate);
router.post('/:babyId', postBurp);
router.delete('/:burpId', deleteBurpHandler);

export default router;
