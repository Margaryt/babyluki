/** Hiccup controller — handles HTTP requests and delegates to the service layer. */
import { Request, Response } from 'express';
import {
  startHiccup,
  stopHiccupEpisode,
  removeHiccup,
  getHiccups,
} from './hiccup.service';
import { CreateHiccupRequest, StopHiccupRequest } from './hiccup.types';

/**
 * POST /:babyId
 * Starts a hiccup episode. Optional sessionId in the body links it to a feeding session.
 */
export const createHiccup = async (
  req: Request<{ babyId: string }, {}, CreateHiccupRequest>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const hiccup = await startHiccup({ ...req.body, babyId });
    res.status(201).json(hiccup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start hiccup' });
  }
};

/**
 * PATCH /:hiccupId/stop
 * Stops an active hiccup episode.
 */
export const stopHiccup = async (
  req: Request<{ hiccupId: string }, {}, StopHiccupRequest>,
  res: Response
) => {
  try {
    const { hiccupId } = req.params;
    const hiccup = await stopHiccupEpisode(hiccupId, req.body?.endedAt);
    res.json(hiccup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop hiccup' });
  }
};

/**
 * GET /:babyId?date=YYYY-MM-DD
 * Returns all hiccups for a baby on a given date. Defaults to today.
 */
export const getHiccupsByDate = async (
  req: Request<{ babyId: string }, {}, {}, { date?: string }>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const hiccups = await getHiccups(babyId, date);
    res.json(hiccups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hiccups' });
  }
};

/**
 * DELETE /:hiccupId
 * Deletes a single hiccup.
 */
export const deleteHiccup = async (
  req: Request<{ hiccupId: string }>,
  res: Response
) => {
  try {
    const { hiccupId } = req.params;
    await removeHiccup(hiccupId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete hiccup' });
  }
};
