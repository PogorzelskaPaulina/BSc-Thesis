import { VisitRequest } from "../../../adapters/models/VisitRequest";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EmployeeType, VisitRequested, VisitorType } from "../../../domain/events/events";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { Attendee } from "../../../adapters/models/Attendee";

export interface Input {
  visitEventStream: VisitEventStream<VisitRequested>;
}

export interface Context {
  requestRepository: VisitRequestRepository;
  attendeeRepository: AttendeeRepository;
}

const getVisitGuest = (guestsEmail: string, attendeeRepository: AttendeeRepository) => {
  return attendeeRepository.findByEmail(guestsEmail);
};

export const visitRequestedHandler = async (
  { visitEventStream: visitRequest }: Input,
  { requestRepository, attendeeRepository }: Context
) => {
  const { hostEmail, guestEmail, ...requestData } = visitRequest.toPrimitive().event.payload;

  const guest = (await getVisitGuest(guestEmail, attendeeRepository)) as Attendee<VisitorType>;
  const host = (await attendeeRepository.findByEmail(hostEmail)) as Attendee<EmployeeType>;

  const requestedVisit = VisitRequest.create({
    ...requestData,
    guest,
    host
  });

  await requestRepository.create(requestedVisit);
};
