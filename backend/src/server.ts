/** Application entry point — starts the Express server. */
import app from './app';
import { env } from './config';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Baby Luki backend running on 0.0.0.0:${env.PORT}`);
});
