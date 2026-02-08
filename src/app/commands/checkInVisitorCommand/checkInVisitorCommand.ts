import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EventStore } from "../../../ports/database/EventStore";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { getLatestEventVersion } from "../../../shared/utils/getLatestEventVersion/getLatestEventVersion";
import { getVisitAndEventStream } from "../../../shared/utils/getVisitAndEventStream/getVisitAndEventStream";

export interface Input {
  pinCode: string;
}

export interface Context {
  visitRepository: VisitRepository;
  eventStore: EventStore<VisitEventStream>;
}

export const checkInVisitorCommand = async (
  { pinCode }: Input,
  { eventStore, visitRepository }: Context
) => {
  const { id, guests } = await visitRepository.findByInvitationPinCode(pinCode);

  const { visit, eventsStream } = await getVisitAndEventStream(id, eventStore);

  const guest = guests.find(({ pinCode: guestPinCode }) => pinCode === guestPinCode);

  if (!guest) {
    throw new NotFoundException("Visit not found");
  }

  const event = visit.checkInVisitor(guest.invitationId);

  await eventStore.pushEvent({
    event,
    aggregateId: <string>id,
    version: getLatestEventVersion(eventsStream) + 1
  });
};
