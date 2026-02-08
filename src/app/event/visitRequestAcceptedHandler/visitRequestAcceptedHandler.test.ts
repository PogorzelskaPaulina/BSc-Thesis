import { createMock } from "ts-auto-mock";
import { Attendee } from "../../../adapters/models/Attendee";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitRequest } from "../../../adapters/models/VisitRequest";
import { EmployeeType, VisitRequestAccepted, VisitorType } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { mockStartISODate } from "../../../shared/tests/mockDates";
import { visitRequestAcceptedHandler, Input, Context } from "./visitRequestAcceptedHandler";

const input: Input = {
  visitEventStream: VisitEventStream.create<VisitRequestAccepted>({
    aggregateId: "",
    version: 2,
    timestamp: mockStartISODate,
    event: {
      type: "VISIT_REQUEST_ACCEPTED",
      payload: {
        id: "id"
      }
    }
  })
};

const visitRepository = createMock<VisitRepository>({
  create: jest.fn()
});

const visitRequestRepository = createMock<VisitRequestRepository>({
  remove: jest.fn(),
  findById: jest.fn(async () =>
    VisitRequest.create({
      status: "requested",
      requestDate: mockStartISODate,
      duration: 30,
      host: Attendee.create({
        email: "email",
        name: "name",
        type: "employee"
      }) as Attendee<EmployeeType>,
      guest: Attendee.create({
        email: "email",
        name: "name",
        type: "visitor"
      }) as Attendee<VisitorType>,
      title: "",
      id: "id"
    })
  )
});

const context: Context = {
  visitRepository,
  visitRequestRepository
};

describe("visitInvitationAcceptedHandler", () => {
  test("should update visit entity with accepted invitation", async () => {
    // act
    await visitRequestAcceptedHandler(input, context);

    // assert
    expect(visitRequestRepository.remove).toHaveBeenCalledWith("id");
  });
});
