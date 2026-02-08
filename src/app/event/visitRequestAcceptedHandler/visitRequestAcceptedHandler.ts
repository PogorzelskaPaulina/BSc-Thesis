import dayjs from "dayjs";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitRequestAccepted } from "../../../domain/events/events";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { Guest } from "../../../adapters/models/Guest";
import { Visit } from "../../../adapters/models/Visit";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { REQUESTED_VISIT_GUEST_INVITATION_ID } from "../../../shared/utils/constants/constants";

export interface Input {
  visitEventStream: VisitEventStream<VisitRequestAccepted>;
}

export interface Context {
  visitRequestRepository: VisitRequestRepository;
  visitRepository: VisitRepository;
}

export const visitRequestAcceptedHandler = async (
  { visitEventStream }: Input,
  { visitRequestRepository, visitRepository }: Context
) => {
  const visitRequest = await visitRequestRepository.findById(visitEventStream.event.payload.id);

  const guest = Guest.create({
    ...visitRequest.guest,
    accepted: true,
    invitationId: REQUESTED_VISIT_GUEST_INVITATION_ID
  });

  const visit = Visit.create({
    status: "accepted",
    host: visitRequest.host,
    guests: [guest],
    id: visitRequest.id,
    timeframe: {
      start: dayjs(visitEventStream.timestamp).toISOString(),
      end: dayjs(visitEventStream.timestamp).add(visitRequest.duration, "minutes").toISOString()
    },
    title: visitRequest.title
  });

  await visitRepository.create(visit);

  await visitRequestRepository.remove(visitEventStream.event.payload.id);
};
