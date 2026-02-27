// Feeding routes
import { Router } from 'express';
import { postFeeding } from './feeding.controller';

const router = Router();

router.post('/', postFeeding);

export default router;