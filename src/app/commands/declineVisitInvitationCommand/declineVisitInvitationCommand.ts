import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { EventStore } from "../../../ports/database/EventStore";
import { getLatestEventVersion } from "../../../shared/utils/getLatestEventVersion/getLatestEventVersion";
import { getVisitAndEventStream } from "../../../shared/utils/getVisitAndEventStream/getVisitAndEventStream";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";

interface Input {
  visitId: VisitId;
  invitationId: Uuid;
}

interface Context {
  eventStore: EventStore<VisitEventStream>;
}

export const declineVisitInvitationCommand = async (
  { visitId, invitationId }: Input,
  { eventStore }: Context
) => {
  const { visit, eventsStream } = await getVisitAndEventStream(visitId, eventStore);

  const event = visit.declineVisitInvitation(invitationId);

  await eventStore.pushEvent({
    event,
    aggregateId: <string>visitId,
    version: getLatestEventVersion(eventsStream) + 1
  });
};
