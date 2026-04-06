/** Express application setup — middleware and route registration. */
import express from 'express';
import cors from 'cors';
import feedingRoutes from './modules/feeding/feeding.routes';
import feedingEventRoutes from './modules/feeding-event/feeding-event.routes';
const app = express();

app.use(cors());
app.use(express.json());

app.use('/feedings', feedingRoutes);
app.use('/events', feedingEventRoutes);

export default app;
