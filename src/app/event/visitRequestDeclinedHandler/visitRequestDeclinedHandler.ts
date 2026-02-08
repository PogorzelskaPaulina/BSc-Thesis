import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitRequestDeclined } from "../../../domain/events/events";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";

export interface Input {
  visitEventStream: VisitEventStream<VisitRequestDeclined>;
}

export interface Context {
  visitRequestRepository: VisitRequestRepository;
}

export const visitRequestDeclinedHandler = async (
  { visitEventStream }: Input,
  { visitRequestRepository }: Context
) => visitRequestRepository.decline(visitEventStream.event.payload.id);
