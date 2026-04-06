/** FeedingEvent controller — handles HTTP requests and delegates to the service layer. */
import { Request, Response } from 'express';
import { logEvent, removeEvent, getEvents } from './feeding-event.service';
import { CreateFeedingEventRequest, FeedingEventType } from './feeding-event.types';

/**
 * POST /:babyId
 * Logs a feeding event. Requires `type` (BURP, SPILL, or COUGH) in the body.
 * Automatically linked to the active feeding session if one exists.
 */
export const createEvent = async (
  req: Request<{ babyId: string }, {}, CreateFeedingEventRequest>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const { type } = req.body;

    if (!type || !['BURP', 'SPILL', 'COUGH'].includes(type)) {
      res.status(400).json({ error: 'type must be BURP, SPILL, or COUGH' });
      return;
    }

    const event = await logEvent({ ...req.body, babyId });
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log feeding event' });
  }
};

/**
 * GET /:babyId?date=YYYY-MM-DD&type=BURP
 * Returns all feeding events for a baby on a given date. Defaults to today.
 * Optional type filter.
 */
export const getEventsByDate = async (
  req: Request<{ babyId: string }, {}, {}, { date?: string; type?: string }>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    // Parse YYYY-MM-DD as local date (new Date('YYYY-MM-DD') is UTC, causing day-boundary bugs)
    let date = new Date();
    if (req.query.date) {
      const [y, m, d] = req.query.date.split('-').map(Number);
      date = new Date(y, m - 1, d);
    }
    const type = req.query.type as FeedingEventType | undefined;
    const events = await getEvents(babyId, date, type);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feeding events' });
  }
};

/**
 * DELETE /:eventId
 * Deletes a single feeding event.
 */
export const deleteEvent = async (
  req: Request<{ eventId: string }>,
  res: Response
) => {
  try {
    const { eventId } = req.params;
    await removeEvent(eventId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete feeding event' });
  }
};
