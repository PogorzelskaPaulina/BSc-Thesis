export interface Event {
  type: string;
  payload: unknown;
  source: string;
}

export interface EventBroker {
  publishEvents(event: Event[]): Promise<void>;
}
