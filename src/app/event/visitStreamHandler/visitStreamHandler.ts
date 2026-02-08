import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EventBroker } from "../../../ports/event/EventBroker";

export interface Input {
  streams: VisitEventStream[];
}

export interface Context {
  eventBroker: EventBroker;
}

export const visitStreamHandler = ({ streams }: Input, { eventBroker }: Context) =>
  eventBroker.publishEvents(
    streams.map((stream) => ({
      type: stream.event.type,
      source: "onVisitStream",
      payload: stream.toPrimitive()
    }))
  );
