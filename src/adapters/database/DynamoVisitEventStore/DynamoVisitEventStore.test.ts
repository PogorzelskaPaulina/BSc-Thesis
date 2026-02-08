import { DynamoVisitEventStore } from "./DynamoVisitEventStore";
import { Event } from "../../../ports/database/EventStore";
import { PrimitiveEvent, VisitEventStream } from "../../models/VisitEventStream";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { mockStartISODate, mockEndISODate } from "../../../shared/tests/mockDates";
import { transformToPrimitive } from "../../../shared/utils/transformToPrimitive/transformToPrimitive";
import {
  VisitCreated,
  VisitInvitationAccepted,
  VisitRequested
} from "../../../domain/events/events";

const event: Event<VisitEventStream<VisitCreated>> = {
  aggregateId: "id",
  event: {
    type: "VISIT_CREATED",
    payload: {
      id: "id",
      status: "created",
      guests: [
        {
          invitationId: "invitationId",
          email: "guest@email.com",
          accepted: null,
          type: "visitor",
          checkedIn: false,
          pinCode: ""
        }
      ],
      hostEmail: "email@email.com",
      timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
      title: "title"
    }
  },
  version: 1
};

const event2: Event<VisitEventStream<VisitInvitationAccepted>> = {
  aggregateId: "id",
  event: {
    type: "VISIT_INVITATION_ACCEPTED",
    payload: {
      id: "id",
      invitationId: "invitationId"
    }
  },
  version: 2
};

const event3: Event<VisitEventStream<VisitCreated>> = {
  aggregateId: "id-2",
  version: 1,
  event: {
    type: "VISIT_CREATED",
    payload: {
      id: "id-2",
      status: "created",
      guests: [],
      hostEmail: "email@email.com",
      timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
      title: "title"
    }
  }
};

const event4: Event<VisitEventStream<VisitRequested>> = {
  aggregateId: "id",
  event: {
    type: "VISIT_REQUESTED",
    payload: {
      id: "id",
      status: "requested",
      duration: 45,
      guestEmail: "guest@email.com",
      hostEmail: "email@email.com",
      requestDate: mockStartISODate,
      title: "title"
    }
  },
  version: 4
};

let dynamoVisitEventStore: DynamoVisitEventStore;

const getEventStream = (eventToParse: Event<VisitEventStream>) => {
  return VisitEventStream.create({
    ...eventToParse,
    timestamp: expect.any(String),
    event: {
      type: eventToParse.event.type,
      payload: transformToPrimitive(eventToParse.event.payload)
    } as PrimitiveEvent
  });
};

describe("DynamoVisitEventStore", () => {
  beforeAll(() => {
    // arrange
    process.env.VISITS_EVENT_STORE_TABLE = "test-visit-event-store-table";

    dynamoVisitEventStore = new DynamoVisitEventStore();
  });

  test("should push events to event store and query them", async () => {
    // act
    await dynamoVisitEventStore.pushEvent(event);
    await dynamoVisitEventStore.pushEvent(event2);
    await dynamoVisitEventStore.pushEvent(event3);
    await dynamoVisitEventStore.pushEvent(event4);

    const events = await dynamoVisitEventStore.getEvents(event.aggregateId);
    const events2 = await dynamoVisitEventStore.getEvents(event3.aggregateId);

    // assert
    expect(events).toStrictEqual([
      getEventStream(event),
      getEventStream(event2),
      getEventStream(event4)
    ]);
    expect(events2).toStrictEqual([getEventStream(event3)]);
  });

  test("should throw error when getting events if aggregate id does not exist", async () => {
    await expect(dynamoVisitEventStore.getEvents("not-existig-id")).rejects.toThrow(
      "Visit not found"
    );
  });
});
