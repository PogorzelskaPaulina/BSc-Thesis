import { Room } from "../../../adapters/models/Room";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { Pagination } from "../../../shared/types/Pagination";

export interface Input extends Pagination {
  startDate: string;
  endDate: string;
}

interface Context {
  roomRepository: RoomRepository;
  roomReservationRepository: RoomReservationRepository;
}

export const getRoomsQuery = async (
  { startDate, endDate, ...pagination }: Input,
  { roomRepository, roomReservationRepository }: Context
) => {
  const timeframe = VisitTimeframe.from(startDate, endDate);

  const { cursor, items } = await roomRepository.findAll(pagination);

  const roomReservations = await roomReservationRepository.findReservations(timeframe);

  return {
    cursor,
    rooms: items.map((room) => {
      const isReserved = roomReservations.some(
        (roomReservation) => roomReservation.roomId === room.id
      );

      return Room.create({ ...room, isAvailable: !isReserved });
    })
  };
};
