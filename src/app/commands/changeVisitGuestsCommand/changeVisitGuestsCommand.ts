import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EventStore } from "../../../ports/database/EventStore";
import { getVisitAndEventStream } from "../../../shared/utils/getVisitAndEventStream/getVisitAndEventStream";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { getLatestEventVersion } from "../../../shared/utils/getLatestEventVersion/getLatestEventVersion";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { getGuestTypeAndHandleCheck } from "../../../shared/utils/getGuestTypeAndHandleCheck/getGuestTypeAndHandleCheck";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";

export interface Input {
  id: Uuid;
  guestsEmails: string[];
  requesterEmail: string;
  isAdmin: boolean;
}

export interface Context {
  visitEventStore: EventStore<VisitEventStream>;
  attendeeRepository: AttendeeRepository;
}

export const changeVisitGuestsCommand = async (
  { id, guestsEmails, requesterEmail, isAdmin }: Input,
  { visitEventStore, attendeeRepository }: Context
) => {
  const { visit, eventsStream } = await getVisitAndEventStream(
    id,
    visitEventStore,
    (visitState) => {
      if (visitState.hostEmail !== requesterEmail && !isAdmin) {
        throw new NotFoundException("Visit not found");
      }
    }
  );

  const guestsPromises = guestsEmails.map(async (guestEmail) => {
    const type = await getGuestTypeAndHandleCheck(
      { email: guestEmail, name: null },
      attendeeRepository
    );
    return { email: guestEmail, type };
  });

  const guests = await Promise.all(guestsPromises);

  const event = visit.changeGuests(guests);

  await visitEventStore.pushEvent({
    event,
    aggregateId: <string>id,
    version: getLatestEventVersion(eventsStream) + 1
  });
};
