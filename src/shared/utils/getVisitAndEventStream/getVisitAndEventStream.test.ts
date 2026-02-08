import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitCreated, VisitInvitationAccepted } from "../../../domain/events/events";
import { VisitState } from "../../../domain/state";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { Visit } from "../../../domain/Visit";
import { EventStore } from "../../../ports/database/EventStore";
import { BadRequestException } from "../../exceptions/BadRequestException/BadRequestException";
import { mockEndISODate, mockStartISODate } from "../../tests/mockDates";
import { getVisitAndEventStream } from "./getVisitAndEventStream";

const visitCreatedEventStream = VisitEventStream.create<VisitCreated>({
  aggregateId: "id",
  event: {
    type: "VISIT_CREATED",
    payload: {
      title: "",
      guests: [{ email: "", invitationId: "invitationId", accepted: null, type: "employee" }],
      hostEmail: "",
      id: "id",
      status: "created",
      timeframe: { start: mockStartISODate, end: mockEndISODate }
    }
  },
  version: 1
});
const visitInvitationAcceptedEventStream = VisitEventStream.create<VisitInvitationAccepted>({
  aggregateId: "id",
  event: {
    type: "VISIT_INVITATION_ACCEPTED",
    payload: {
      id: "",
      invitationId: "invitationId"
    }
  },
  version: 2
});

const expectedVisit = new Visit({
  id: "id",
  guests: [{ accepted: true, email: "", invitationId: "invitationId", type: "employee" }],
  hostEmail: "",
  status: "created",
  timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
  title: ""
});

const visitEventStore = createMock<EventStore<VisitEventStream>>({
  getEvents: async () => [visitCreatedEventStream, visitInvitationAcceptedEventStream]
});

describe("getVisitAndEventStream", () => {
  test("should return visit and event stream", async () => {
    // act
    const { visit, eventsStream } = await getVisitAndEventStream("id", visitEventStore);

    // assert
    expect(visit).toStrictEqual(expectedVisit);
    expect(eventsStream).toStrictEqual([
      visitCreatedEventStream,
      visitInvitationAcceptedEventStream
    ]);
  });

  test("should invoke validator when provided and invoke it before visit creation", async () => {
    // arrange
    const validator = (visitState: VisitState) => {
      if (visitState.status.valueOf() === "created") {
        throw new BadRequestException("");
      }
    };

    // act, assert
    await expect(getVisitAndEventStream("id", visitEventStore, validator)).rejects.toThrow(
      BadRequestException
    );
  });

  test("should invoke state validator with visit state and return correct visit when ", async () => {
    // arrange
    const validator = () => {
      // successful validation
    };

    // act
    const { visit, eventsStream } = await getVisitAndEventStream("id", visitEventStore, validator);

    // assert
    expect(visit).toStrictEqual(expectedVisit);
    expect(eventsStream).toStrictEqual([
      visitCreatedEventStream,
      visitInvitationAcceptedEventStream
    ]);
  });
});
