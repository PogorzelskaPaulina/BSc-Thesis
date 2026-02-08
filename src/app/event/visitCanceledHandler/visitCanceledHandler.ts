import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitCanceled } from "../../../domain/events/events";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";

export interface Input {
  visitEventStream: VisitEventStream<VisitCanceled>;
}

export interface Context {
  visitRepository: VisitRepository;
  roomReservationRepository: RoomReservationRepository;
}

export const visitCanceledHandler = async (
  { visitEventStream }: Input,
  { visitRepository, roomReservationRepository }: Context
) => {
  const { id } = visitEventStream.event.payload;

  const roomReservation = await roomReservationRepository.findByVisitIdOrNull(id);

  if (roomReservation) {
    await roomReservationRepository.remove(roomReservation.getCompositeKey());
  }

  await visitRepository.cancelVisit(visitEventStream.event.payload.id);
};
