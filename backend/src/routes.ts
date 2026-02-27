// Main routes
import { Router } from 'express';

const router = Router();

// Define your routes here
router.get('/', (req, res) => {
  res.send('API is working!');
});

export default router;