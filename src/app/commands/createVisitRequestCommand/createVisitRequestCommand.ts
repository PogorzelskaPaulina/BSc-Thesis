import { EventStore } from "../../../ports/database/EventStore";
import { Visit } from "../../../domain/Visit";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { getGuestTypeAndHandleCheck } from "../../../shared/utils/getGuestTypeAndHandleCheck/getGuestTypeAndHandleCheck";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";

interface Guest {
  email: string;
  name: string;
}

export interface Context {
  visitEventStore: EventStore<VisitEventStream>;
  attendeeRepository: AttendeeRepository;
}

export interface Input {
  title: string;
  duration: number;
  hostEmail: string;
  guest: Guest;
}

export const createVisitRequestCommand = async (
  { title, duration, hostEmail, guest }: Input,
  { visitEventStore, attendeeRepository }: Context
) => {
  const requestDate = new Date().toISOString();

  await getGuestTypeAndHandleCheck(guest, attendeeRepository);

  const event = Visit.request(title, requestDate, duration, hostEmail, guest.email);

  await visitEventStore.pushEvent({
    event,
    aggregateId: <string>event.payload.id,
    version: 1
  });

  return event.payload.id;
};
