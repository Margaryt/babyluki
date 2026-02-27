// Feeding types
export type FeedingType = 'breast' | 'bottle';

export interface CreateFeedingRequest {
  startedAt: string;      // ISO string
  endedAt: string;       // ISO string
  type: FeedingType;
  notes?: string;
}

export interface Feeding {
  id: string;
  startedAt: string;
  endedAt: string;
  type: FeedingType;
  notes?: string;
  createdAt: string;
}