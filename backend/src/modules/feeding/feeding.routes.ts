/**
 * Feeding routes.
 *
 * All routes are scoped to a specific baby via :babyId in the URL.
 * This keeps the API consistent across POST and GET, and supports
 * parents with multiple babies. When we add auth, :babyId will be removed
 * from the URL and instead will be determined from the authenticated user's
 * babies. For now, we keep it in the URL for simplicity, but it should be
 * noted that in a production environment, this would need to be validated
 * against the authenticated user's babies via middleware.
 */
import { Router } from 'express';
import { postFeeding, getFeedingsByDate } from './feeding.controller';

const router = Router();

router.post('/:babyId', postFeeding);
router.get('/:babyId', getFeedingsByDate);

export default router;