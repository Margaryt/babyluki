/** Application entry point — starts the Express server. */
import app from './app';
import { env } from './config';

app.listen(env.PORT, () => {
  console.log(`Baby Luki backend running on port ${env.PORT}`);
});
