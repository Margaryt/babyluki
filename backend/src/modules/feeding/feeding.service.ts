// Feeding service
import { CreateFeedingRequest, Feeding } from './feeding.types';
import { saveFeeding } from './feeding.db';

export async function createFeeding(
  input: CreateFeedingRequest
): Promise<Feeding> {
  // TO DO: Validate domain rules here later (not controller)
  
  const feeding: Feeding = {
    id: crypto.randomUUID(),
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    type: input.type,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };

  // For now this just echoes back
  await saveFeeding(feeding);

  return feeding;
}