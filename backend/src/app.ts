/** Express application setup — middleware and route registration. */
import express from 'express';
import cors from 'cors';
import feedingRoutes from './modules/feeding/feeding.routes';
import burpRoutes from './modules/burp/burp.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/feedings', feedingRoutes);
app.use('/burps', burpRoutes);

export default app;
