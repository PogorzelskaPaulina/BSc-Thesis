import { VisitEventStream } from "../../../adapters/models/VisitEventStream";

export const getLatestEventVersion = (events: VisitEventStream[]) => {
  let maxVersion = events[0]?.version || 0;

  events.forEach((event) => {
    if (event.version > maxVersion) {
      maxVersion = event.version;
    }
  });

  return maxVersion;
};
