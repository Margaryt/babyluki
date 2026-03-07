/** Typed environment variables, loaded from `.env` via dotenv. */
import 'dotenv/config';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: parseInt(process.env.PORT || '3000', 10),
};
