import { VisitEventStream } from "../../adapters/models/VisitEventStream";

export interface Event<T extends VisitEventStream> {
  event: T["event"];
  aggregateId: string;
  version: number;
}

export interface EventStore<T extends VisitEventStream> {
  pushEvent(event: Event<T>): Promise<void>;
  getEvents(aggregateId: string): Promise<T[]>;
  getAllEventsBetweenTimestamps(startDate: string, endDate: string): Promise<T[]>;
}
