import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitState } from "../../../domain/state";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { Visit } from "../../../domain/Visit";
import { EventStore } from "../../../ports/database/EventStore";
import { constructState } from "../constructState/constructState";

export const getVisitAndEventStream = async (
  id: VisitId,
  eventStore: EventStore<VisitEventStream>,
  validator?: (visitState: VisitState) => void
) => {
  const eventsStream = await eventStore.getEvents(id as string);

  const visitState = constructState(eventsStream);

  if (validator) {
    validator(visitState);
  }

  const visit = new Visit(visitState);

  return {
    eventsStream,
    visit
  };
};
