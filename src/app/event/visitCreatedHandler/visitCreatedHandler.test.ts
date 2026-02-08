import { createMock } from "ts-auto-mock";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { visitCreatedHandler, Input, Context } from "./visitCreatedHandler";
import { Attendee } from "../../../adapters/models/Attendee";
import { Visit } from "../../../adapters/models/Visit";
import { Room } from "../../../adapters/models/Room";
import { mockEndISODate, mockStartISODate } from "../../../shared/tests/mockDates";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { Guest } from "../../../adapters/models/Guest";
import { EmployeeType, VisitCreated } from "../../../domain/events/events";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { VisitRoom } from "../../../adapters/models/VisitRoom";

const hostEmail = "host@email.com";
const host = Attendee.create({
  email: hostEmail,
  name: "name",
  type: "employee"
}) as Attendee<EmployeeType>;

const attendeeRepository = createMock<AttendeeRepository>({
  findByEmail: async (email) => {
    if (email === hostEmail) {
      return host;
    }

    return Attendee.create({ email, name: "name", type: "visitor" });
  }
});
const visitRepository = createMock<VisitRepository>({
  create: jest.fn()
});

const roomId = "room-id";

const roomRepository = createMock<RoomRepository>({
  findById: jest.fn().mockImplementation(() => Room.create({ id: roomId, name: "name" }))
});

const roomReservationRepository = createMock<RoomReservationRepository>({
  create: jest.fn()
});

const visitStreamProps = {
  aggregateId: "id",
  isInitialEvent: 1,
  timestamp: "",
  version: 1,
  event: {
    type: "VISIT_CREATED" as const,
    payload: {
      id: "id",
      hostEmail,
      guests: [],
      status: "created" as const,
      timeframe: { start: mockStartISODate, end: mockEndISODate },
      title: ""
    }
  }
};

const context: Context = {
  attendeeRepository,
  visitRepository,
  roomRepository,
  roomReservationRepository
};

describe("visitCreatedHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create a visit with the correct data", async () => {
    // act
    await visitCreatedHandler(
      { visitEventStream: VisitEventStream.create<VisitCreated>(visitStreamProps) },
      context
    );

    // assert
    expect(visitRepository.create).toHaveBeenNthCalledWith(
      1,
      Visit.create({
        guests: [],
        host: host.toPrimitive(),
        id: visitStreamProps.event.payload.id,
        status: visitStreamProps.event.payload.status,
        timeframe: visitStreamProps.event.payload.timeframe,
        title: visitStreamProps.event.payload.title
      })
    );
  });

  test("should create a visit with attendees", async () => {
    // arrange
    const invitationId = "invitationId";
    const inputWithAttendees: Input = {
      visitEventStream: VisitEventStream.create<VisitCreated>({
        ...visitStreamProps,
        event: {
          ...visitStreamProps.event,
          payload: {
            ...visitStreamProps.event.payload,
            guests: [
              {
                accepted: null,
                email: "guest@email.com",
                invitationId,
                type: "visitor",
                checkedIn: false,
                pinCode: ""
              }
            ]
          }
        }
      })
    };

    // act
    await visitCreatedHandler(inputWithAttendees, context);

    // assert
    expect(visitRepository.create).toHaveBeenNthCalledWith(
      1,
      Visit.create({
        guests: [
          Guest.create({
            email: inputWithAttendees.visitEventStream.event.payload.guests[0].email,
            name: "name",
            type: "visitor",
            accepted: null,
            invitationId,
            pinCode: ""
          })
        ],
        host: host.toPrimitive(),
        id: visitStreamProps.event.payload.id,
        status: visitStreamProps.event.payload.status,
        timeframe: visitStreamProps.event.payload.timeframe,
        title: visitStreamProps.event.payload.title
      })
    );
  });

  test("should not fetch room details if room is not specified", async () => {
    // act
    await visitCreatedHandler(
      { visitEventStream: VisitEventStream.create<VisitCreated>(visitStreamProps) },
      context
    );

    // assert
    expect(roomRepository.findById).not.toHaveBeenCalled();
  });

  test("should not create a room reservation if room is not specified", async () => {
    // act
    await visitCreatedHandler(
      { visitEventStream: VisitEventStream.create<VisitCreated>(visitStreamProps) },
      context
    );

    // assert
    expect(roomReservationRepository.create).not.toHaveBeenCalled();
  });

  test("should create a visit with room if specified and create room reservation", async () => {
    // arrange
    const inputWithRoom: Input = {
      visitEventStream: VisitEventStream.create<VisitCreated>({
        ...visitStreamProps,
        event: {
          ...visitStreamProps.event,
          payload: {
            ...visitStreamProps.event.payload,
            room: {
              id: roomId,
              isReservedForThisVisit: true
            }
          }
        }
      })
    };

    // act
    await visitCreatedHandler(inputWithRoom, context);

    // assert
    expect(roomRepository.findById).toHaveBeenNthCalledWith(
      1,
      inputWithRoom.visitEventStream.event.payload.room?.id
    );
    expect(roomReservationRepository.create).toHaveBeenNthCalledWith(1, {
      id: expect.any(String),
      dateStart: inputWithRoom.visitEventStream.event.payload.timeframe.valueOf().start,
      dateEnd: inputWithRoom.visitEventStream.event.payload.timeframe.valueOf().end,
      roomId: inputWithRoom.visitEventStream.event.payload.room?.id,
      visitId: inputWithRoom.visitEventStream.event.payload.id
    });
    expect(visitRepository.create).toHaveBeenNthCalledWith(
      1,
      Visit.create({
        guests: [],
        host: host.toPrimitive(),
        id: visitStreamProps.event.payload.id,
        room: VisitRoom.create({
          id: roomId,
          isReservedForThisVisit:
            inputWithRoom.visitEventStream.event.payload.room!.isReservedForThisVisit,
          name: "name"
        }),
        status: visitStreamProps.event.payload.status,
        timeframe: visitStreamProps.event.payload.timeframe,
        title: visitStreamProps.event.payload.title
      })
    );
  });
});
