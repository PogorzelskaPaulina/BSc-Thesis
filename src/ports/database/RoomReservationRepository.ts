import { RoomReservation } from "../../adapters/models/RoomReservation";
import { VisitId } from "../../domain/valueObjects/VisitId/VisitId";
import { VisitTimeframe } from "../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { Uuid } from "../../shared/utils/Uuid/Uuid";

export interface RoomReservationCompositeKey {
  baseDate: string;
  dateStartAndId: string;
}

export interface RoomReservationRepository {
  create(reservation: RoomReservation): Promise<void>;
  findByVisitIdOrNull(visitId: VisitId): Promise<RoomReservation | null>;
  findRoomReservations(roomId: Uuid, timeframe: VisitTimeframe): Promise<RoomReservation[]>;
  findReservations(timeframe: VisitTimeframe): Promise<RoomReservation[]>;
  setTimeframe(key: RoomReservationCompositeKey, timeframe: VisitTimeframe): Promise<void>;
  remove(key: RoomReservationCompositeKey): Promise<void>;
}
