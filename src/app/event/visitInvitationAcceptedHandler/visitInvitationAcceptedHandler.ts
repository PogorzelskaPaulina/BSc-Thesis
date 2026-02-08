import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitInvitationAccepted } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";

export interface Input {
  visitEventStream: VisitEventStream<VisitInvitationAccepted>;
}

export interface Context {
  visitRepository: VisitRepository;
}

export const visitInvitationAcceptedHandler = (
  { visitEventStream }: Input,
  { visitRepository }: Context
) =>
  visitRepository.setInvitationAcceptance(
    visitEventStream.event.payload.id,
    visitEventStream.event.payload.invitationId,
    true
  );
