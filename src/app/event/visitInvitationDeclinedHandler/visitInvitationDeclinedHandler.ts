import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitInvitationDeclined } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";

export interface Input {
  visitEventStream: VisitEventStream<VisitInvitationDeclined>;
}

export interface Context {
  visitRepository: VisitRepository;
}

export const visitInvitationDeclinedHandler = (
  { visitEventStream }: Input,
  { visitRepository }: Context
) =>
  visitRepository.setInvitationAcceptance(
    visitEventStream.event.payload.id,
    visitEventStream.event.payload.invitationId,
    false
  );
