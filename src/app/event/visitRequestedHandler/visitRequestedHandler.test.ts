import { createMock } from "ts-auto-mock";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { Attendee } from "../../../adapters/models/Attendee";
import { VisitRequest } from "../../../adapters/models/VisitRequest";
import { mockStartISODate } from "../../../shared/tests/mockDates";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EmployeeType, VisitRequested, VisitorType } from "../../../domain/events/events";
import { visitRequestedHandler, Context } from "./visitRequestedHandler";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";

const hostEmail = "host@email.com";
const host = Attendee.create({
  email: hostEmail,
  name: "name",
  type: "employee"
}) as Attendee<EmployeeType>;

const guestEmail = "guest1@gmail.com";
const guest = Attendee.create({
  email: guestEmail,
  name: "name",
  type: "visitor"
}) as Attendee<VisitorType>;

const attendeeRepository = createMock<AttendeeRepository>({
  findByEmail: async (email) => {
    if (email === hostEmail) {
      return host;
    }

    return Attendee.create({ email, name: "name", type: "visitor" });
  }
});

const requestRepository = createMock<VisitRequestRepository>({
  create: jest.fn()
});

const visitStreamProps = {
  aggregateId: "id",
  isInitialEvent: 1,
  timestamp: "",
  version: 1,
  event: {
    type: "VISIT_REQUESTED" as const,
    payload: {
      requestDate: mockStartISODate,
      duration: 45,
      guestEmail,
      hostEmail,
      id: "id",
      title: "",
      status: "requested" as const
    }
  }
};

const context: Context = {
  attendeeRepository,
  requestRepository
};

describe("visitRequestedHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create a request with the correct data", async () => {
    // act
    await visitRequestedHandler(
      { visitEventStream: VisitEventStream.create<VisitRequested>(visitStreamProps) },
      context
    );

    expect(requestRepository.create).toHaveBeenNthCalledWith(
      1,
      VisitRequest.create({
        id: visitStreamProps.event.payload.id,
        status: visitStreamProps.event.payload.status,
        title: visitStreamProps.event.payload.title,
        requestDate: visitStreamProps.event.payload.requestDate,
        duration: visitStreamProps.event.payload.duration,
        host: host.toPrimitive(),
        guest: guest.toPrimitive()
      })
    );
  });
});
