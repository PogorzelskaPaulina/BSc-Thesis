import { createMock } from "ts-auto-mock";
import { createVisitCommand, Input, Context } from "./createVisitCommand";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { EventStore } from "../../../ports/database/EventStore";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { Attendee } from "../../../adapters/models/Attendee";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { mockEndISODate, mockStartISODate } from "../../../shared/tests/mockDates";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { RoomReservation } from "../../../adapters/models/RoomReservation";

const roomId = Uuid.generate();
const occupiedRoomId = Uuid.generate();

const input: Input = {
  title: "",
  timeframe: { start: mockStartISODate, end: mockEndISODate },
  requesterEmail: "host@example.com",
  guestsEmails: [],
  roomId: undefined,
  isAdmin: false
};

const notStoredGuestEmail = "not-stored@example.com";

const attendeeRepository = createMock<AttendeeRepository>({
  findByEmailOrNull: async (email) => {
    if (email === notStoredGuestEmail) {
      return null;
    }

    return Attendee.create({ email, name: "name", type: "visitor" });
  },
  create: jest.fn()
});

const visitEventStore = createMock<EventStore<VisitEventStream>>({
  pushEvent: jest.fn()
});

const roomRepository = createMock<RoomRepository>();

const roomReservationRepository = createMock<RoomReservationRepository>({
  findRoomReservations: async (id) => {
    if (id === occupiedRoomId) {
      return [
        RoomReservation.createFromVisitEvent({
          roomId: occupiedRoomId,
          visitId: "",
          dateEnd: mockEndISODate,
          dateStart: mockStartISODate
        })
      ];
    }

    return [];
  }
});

const context: Context = {
  attendeeRepository,
  visitEventStore,
  roomRepository,
  roomReservationRepository
};

const expectedOutput = {
  aggregateId: expect.any(String),
  event: {
    payload: {
      guests: input.guestsEmails,
      hostEmail: input.requesterEmail,
      id: expect.any(String),
      room: undefined,
      status: "created",
      timeframe: VisitTimeframe.from(input.timeframe.start, input.timeframe.end),
      title: input.title
    },
    type: "VISIT_CREATED"
  },
  version: 1
};

describe("createVisitCommand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("should create a visit successfully", async () => {
    // act
    const id = await createVisitCommand(input, context);

    // assert
    expect(typeof id).toBe("string");
    expect(visitEventStore.pushEvent).toHaveBeenNthCalledWith(1, expectedOutput);
  });

  test("should create a guest if is not stored yet", async () => {
    // arrange
    const inputWithGuest: Input = {
      ...input,
      guestsEmails: [notStoredGuestEmail]
    };
    const expectedOutputWithGuest = {
      ...expectedOutput,
      event: {
        ...expectedOutput.event,
        payload: {
          ...expectedOutput.event.payload,
          guests: [
            {
              accepted: null,
              email: inputWithGuest.guestsEmails[0],
              invitationId: expect.any(String),
              checkedIn: false,
              pinCode: expect.any(String),
              type: "visitor"
            }
          ]
        }
      }
    };

    // act
    const id = await createVisitCommand(inputWithGuest, context);

    // assert
    expect(attendeeRepository.create).toHaveBeenNthCalledWith(1, {
      email: notStoredGuestEmail,
      name: null,
      type: "visitor"
    });
    expect(visitEventStore.pushEvent).toHaveBeenNthCalledWith(1, expectedOutputWithGuest);
    expect(typeof id).toBe("string");
  });

  test("should create visit event with reserved room status if room is available within specified timeframe", async () => {
    // arrange
    const inputWithRoom: Input = {
      ...input,
      roomId
    };
    const expectedOutputWithRoom = {
      ...expectedOutput,
      event: {
        ...expectedOutput.event,
        payload: {
          ...expectedOutput.event.payload,
          room: {
            id: roomId,
            isReservedForThisVisit: true
          }
        }
      }
    };

    // act
    const id = await createVisitCommand(inputWithRoom, context);

    expect(visitEventStore.pushEvent).toHaveBeenNthCalledWith(1, expectedOutputWithRoom);
    expect(typeof id).toBe("string");
  });

  test("should create visit event with not reserved room status if room is not available within specified timeframe", async () => {
    // arrange
    const inputWithRoom: Input = {
      ...input,
      roomId: occupiedRoomId
    };
    const expectedOutputWithRoom = {
      ...expectedOutput,
      event: {
        ...expectedOutput.event,
        payload: {
          ...expectedOutput.event.payload,
          room: {
            id: occupiedRoomId,
            isReservedForThisVisit: false
          }
        }
      }
    };

    // act
    const id = await createVisitCommand(inputWithRoom, context);

    expect(visitEventStore.pushEvent).toHaveBeenNthCalledWith(1, expectedOutputWithRoom);
    expect(typeof id).toBe("string");
  });
});
