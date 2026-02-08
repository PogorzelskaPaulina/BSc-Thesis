import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EventStore } from "../../../ports/database/EventStore";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { getLatestEventVersion } from "../../../shared/utils/getLatestEventVersion/getLatestEventVersion";
import { getVisitAndEventStream } from "../../../shared/utils/getVisitAndEventStream/getVisitAndEventStream";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";

interface Input {
  id: Uuid;
  requesterEmail: string;
  isAdmin: boolean;
}

interface Context {
  eventStore: EventStore<VisitEventStream>;
}

export const acceptVisitRequestCommand = async (
  { id, requesterEmail, isAdmin }: Input,
  { eventStore }: Context
) => {
  const { visit, eventsStream } = await getVisitAndEventStream(id, eventStore, (state) => {
    if (state.hostEmail !== requesterEmail && !isAdmin) {
      throw new NotFoundException("Visit request not found");
    }
  });

  const event = visit.acceptRequest();

  await eventStore.pushEvent({
    event,
    aggregateId: <string>id,
    version: getLatestEventVersion(eventsStream) + 1
  });
};
