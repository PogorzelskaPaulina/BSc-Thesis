import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitGuestsChanged } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { getVisitGuests } from "../../../shared/utils/getVisitGuests/getVisitGuest";

export interface Input {
  visitEventStream: VisitEventStream<VisitGuestsChanged>;
}

export interface Context {
  visitRepository: VisitRepository;
  attendeeRepository: AttendeeRepository;
}

export const visitGuestsChangedHandler = async (
  { visitEventStream }: Input,
  { visitRepository, attendeeRepository }: Context
) => {
  const { id, guests } = visitEventStream.event.payload;

  const visitGuests = await getVisitGuests(guests, attendeeRepository);

  await visitRepository.setVisitGuests(id, visitGuests);
};
