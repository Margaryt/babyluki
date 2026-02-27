// Feeding controller
import { Request, Response } from 'express';
import { createFeeding } from './feeding.service';
import { CreateFeedingRequest } from './feeding.types';

/**
 * Create a new feeding entry.
 *
 * Attempts to create a feeding using the request body and returns the created record.
 *
 * TO DO: Implement robust error handling:
 * - Prefer a `Result`/`neverthrow` pattern for predictable errors instead of throwing.
 * - Map validation failures to `400 Bad Request` and provide details.
 * - Translate domain-specific errors (e.g. conflicts) to appropriate 4xx codes.
 * - Log unexpected errors and return `500 Internal Server Error` when necessary.
 *
 * @param req - Express `Request` with a `CreateFeedingRequest` body
 * @param res - Express `Response` used to send the created feeding or an error
 * @returns Promise<void>
 */
export const postFeeding = async(
  req: Request<{}, {}, CreateFeedingRequest>,
  res: Response
) => {
  try {
    const feeding = await createFeeding(req.body);
    res.status(201).json(feeding);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create feeding' });
  }
}