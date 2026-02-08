import { omit } from "underscore";
import { Visit } from "../../../adapters/models/Visit";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EmployeeType, VisitCreated } from "../../../domain/events/events";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { Attendee } from "../../../adapters/models/Attendee";
import { Room } from "../../../domain/state";
import { VisitRoom } from "../../../adapters/models/VisitRoom";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { RoomReservation } from "../../../adapters/models/RoomReservation";
import { getVisitGuests } from "../../../shared/utils/getVisitGuests/getVisitGuest";

export interface Input {
  visitEventStream: VisitEventStream<VisitCreated>;
}

export interface Context {
  visitRepository: VisitRepository;
  attendeeRepository: AttendeeRepository;
  roomRepository: RoomRepository;
  roomReservationRepository: RoomReservationRepository;
}

const getVisitRoom = async (room: Room | undefined, roomRepository: RoomRepository) => {
  if (!room) {
    return undefined;
  }

  const foundRoom = await roomRepository.findById(room.id);

  return VisitRoom.create({ ...foundRoom, isReservedForThisVisit: room.isReservedForThisVisit });
};

const handleRoomReservationCreation = async (
  visit: VisitEventStream<VisitCreated>,
  roomReservationRepository: RoomReservationRepository
) => {
  const primitiveVisit = visit.toPrimitive().event.payload;

  const roomReservation = RoomReservation.createFromVisitEvent({
    dateStart: primitiveVisit.timeframe.start,
    dateEnd: primitiveVisit.timeframe.end,
    roomId: primitiveVisit.room!.id,
    visitId: primitiveVisit.id
  });

  await roomReservationRepository.create(roomReservation);
};

export const visitCreatedHandler = async (
  { visitEventStream: visit }: Input,
  { visitRepository, attendeeRepository, roomRepository, roomReservationRepository }: Context
) => {
  const {
    event: {
      payload: { guests, hostEmail, room }
    }
  } = visit;

  const visitGuests = await getVisitGuests(guests, attendeeRepository);
  const host = (await attendeeRepository.findByEmail(hostEmail)) as Attendee<EmployeeType>;
  const visitRoom = await getVisitRoom(room, roomRepository);

  if (visitRoom) {
    await handleRoomReservationCreation(visit, roomReservationRepository);
  }

  const visitToCreate = Visit.create({
    ...omit(visit.toPrimitive().event.payload, "room"),
    guests: visitGuests,
    room: visitRoom,
    host
  });

  await visitRepository.create(visitToCreate);
};
