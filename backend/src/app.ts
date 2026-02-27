import express from 'express';
import cors from 'cors';
import feedingRoutes from './modules/feeding/feeding.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/feeding', feedingRoutes);

export default app;
