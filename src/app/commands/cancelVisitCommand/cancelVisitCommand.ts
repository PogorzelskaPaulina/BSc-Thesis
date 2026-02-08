import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { EventStore } from "../../../ports/database/EventStore";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { getLatestEventVersion } from "../../../shared/utils/getLatestEventVersion/getLatestEventVersion";
import { getVisitAndEventStream } from "../../../shared/utils/getVisitAndEventStream/getVisitAndEventStream";

interface Input {
  visitId: VisitId;
  isAdmin: boolean;
  requesterEmail: string;
}

interface Context {
  eventStore: EventStore<VisitEventStream>;
}

export const cancelVisitCommand = async (
  { visitId, requesterEmail, isAdmin }: Input,
  { eventStore }: Context
) => {
  const { visit, eventsStream } = await getVisitAndEventStream(
    visitId,
    eventStore,
    (visitState) => {
      if (visitState.hostEmail !== requesterEmail && !isAdmin) {
        throw new NotFoundException("Visit not found");
      }
    }
  );

  const event = visit.cancelVisit();

  await eventStore.pushEvent({
    event,
    aggregateId: <string>visitId,
    version: getLatestEventVersion(eventsStream) + 1
  });
};
