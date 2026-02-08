import { createMock } from "ts-auto-mock";
import dayjs from "dayjs";
import { EventStore } from "../../../ports/database/EventStore";
import { createVisitRequestCommand, Input, Context } from "./createVisitRequestCommand";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { Attendee } from "../../../adapters/models/Attendee";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { mockStartISODate } from "../../../shared/tests/mockDates";

const input: Input = {
  title: "",
  duration: 45,
  hostEmail: "host@example.com",
  guest: { name: "name", email: "" }
};

const visitEventStore = createMock<EventStore<VisitEventStream>>({
  pushEvent: jest.fn()
});

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

const context: Context = { visitEventStore, attendeeRepository };

const expectedOutput = {
  aggregateId: expect.any(String),
  event: {
    payload: {
      guestEmail: input.guest,
      hostEmail: input.hostEmail,
      id: expect.any(String),
      status: "requested",
      duration: input.duration,
      title: input.title
    },
    type: "VISIT_REQUESTED"
  },
  version: 1
};

const staticTime = dayjs(mockStartISODate).toDate();

describe("createVisitRequestCommand", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(staticTime.getTime()));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should request a visit successfully", async () => {
    // act
    const id = await createVisitRequestCommand(input, context);

    // assert
    expect(typeof id).toBe("string");
    expect(visitEventStore.pushEvent);
  });

  test("should create a guest if is not stored yet", async () => {
    // arrange
    const inputWithGuest: Input = {
      ...input,
      guest: { email: notStoredGuestEmail, name: "name" }
    };
    const expectedOutputWithGuest = {
      ...expectedOutput,
      event: {
        ...expectedOutput.event,
        payload: {
          ...expectedOutput.event.payload,
          guestEmail: inputWithGuest.guest.email,
          requestDate: staticTime.toISOString()
        }
      }
    };
    // act
    const id = await createVisitRequestCommand(inputWithGuest, context);

    // assert
    expect(attendeeRepository.create).toHaveBeenNthCalledWith(1, {
      email: notStoredGuestEmail,
      name: "name",
      type: "visitor"
    });
    expect(visitEventStore.pushEvent).toHaveBeenNthCalledWith(1, expectedOutputWithGuest);
    expect(typeof id).toBe("string");
  });
});
