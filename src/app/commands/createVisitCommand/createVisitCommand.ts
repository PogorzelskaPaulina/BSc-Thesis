import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { Room } from "../../../domain/state";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { Visit } from "../../../domain/Visit";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { EventStore } from "../../../ports/database/EventStore";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { PrimitiveValue } from "../../../shared/types/PrimitiveValue";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { getGuestTypeAndHandleCheck } from "../../../shared/utils/getGuestTypeAndHandleCheck/getGuestTypeAndHandleCheck";
import { UnauthorizedException } from "../../../shared/exceptions/UnauthorizedException/UnauthorizedException";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";

export interface Input {
  title: string;
  timeframe: PrimitiveValue<VisitTimeframe>;
  requesterEmail: string;
  guestsEmails: string[];
  isAdmin: boolean;
  roomId?: Uuid;
  hostEmail?: string;
}

export interface Context {
  visitEventStore: EventStore<VisitEventStream>;
  attendeeRepository: AttendeeRepository;
  roomRepository: RoomRepository;
  roomReservationRepository: RoomReservationRepository;
}

const getRoomOrUndefined = async (
  timeframe: PrimitiveValue<VisitTimeframe>,
  roomRepository: RoomRepository,
  roomReservationRepository: RoomReservationRepository,
  id?: Uuid
): Promise<Room | undefined> => {
  if (!id) {
    return undefined;
  }

  await roomRepository.findById(id);

  const visitTimeframe = VisitTimeframe.from(timeframe.start, timeframe.end);

  const reservations = await roomReservationRepository.findRoomReservations(id, visitTimeframe);

  const isRoomTaken = reservations.some((reservation) => reservation.roomId === id);

  return { id, isReservedForThisVisit: !isRoomTaken };
};

const getEmail = (isAdmin: boolean, requesterEmail: string, hostEmail?: string) => {
  if (!hostEmail) {
    return requesterEmail;
  }

  if (hostEmail !== requesterEmail && !isAdmin) {
    throw new UnauthorizedException();
  }

  return hostEmail;
};

export const createVisitCommand = async (
  { title, timeframe, requesterEmail, guestsEmails, isAdmin, roomId, hostEmail }: Input,
  { visitEventStore, attendeeRepository, roomRepository, roomReservationRepository }: Context
) => {
  const email = getEmail(isAdmin, requesterEmail, hostEmail);

  const foundHost = await attendeeRepository.findByEmail(email);

  if (foundHost.type !== "employee") {
    throw new BadRequestException("Provided email is not assigned to employee");
  }

  const guestsPromises = guestsEmails.map(async (guestEmail) => {
    const type = await getGuestTypeAndHandleCheck(
      { email: guestEmail, name: null },
      attendeeRepository
    );
    return { email: guestEmail, type };
  });

  const guests = await Promise.all(guestsPromises);

  const room = await getRoomOrUndefined(
    timeframe,
    roomRepository,
    roomReservationRepository,
    roomId
  );

  const event = Visit.create(title, timeframe, email, guests, room);

  await visitEventStore.pushEvent({
    event,
    aggregateId: <string>event.payload.id,
    version: 1
  });

  return event.payload.id;
};
