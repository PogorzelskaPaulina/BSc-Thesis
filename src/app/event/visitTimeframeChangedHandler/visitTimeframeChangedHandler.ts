import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitTimeframeChanged } from "../../../domain/events/events";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";

export interface Input {
  visitEventStream: VisitEventStream<VisitTimeframeChanged>;
}

export interface Context {
  visitRepository: VisitRepository;
  roomReservationRepository: RoomReservationRepository;
}

export const visitTimeframeChangedHandler = async (
  { visitEventStream }: Input,
  { visitRepository, roomReservationRepository }: Context
) => {
  const { id, timeframe } = visitEventStream.event.payload;

  const roomReservation = await roomReservationRepository.findByVisitIdOrNull(id);

  if (roomReservation) {
    await roomReservationRepository.setTimeframe(roomReservation.getCompositeKey(), timeframe);
  }

  await visitRepository.setVisitTimeframe(id, timeframe);
};
