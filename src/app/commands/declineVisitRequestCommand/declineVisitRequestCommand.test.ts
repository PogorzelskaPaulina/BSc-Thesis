import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitRequested } from "../../../domain/events/events";
import { EventStore } from "../../../ports/database/EventStore";
import { mockStartISODate } from "../../../shared/tests/mockDates";
import { declineVisitRequestCommand } from "./declineVisitRequestCommand";

const pushEventMock = jest.fn();
const requestId = "id";
const hostEmail = "host@email.com";

const eventStore = createMock<EventStore<VisitEventStream>>({
  getEvents: async (id) => [
    VisitEventStream.create<VisitRequested>({
      aggregateId: id,
      isInitialEvent: 1,
      timestamp: mockStartISODate,
      version: 1,
      event: {
        type: "VISIT_REQUESTED",
        payload: {
          id,
          guestEmail: "guest@email.com",
          hostEmail,
          status: "requested",
          requestDate: mockStartISODate,
          duration: 30,
          title: "title"
        }
      }
    })
  ],
  pushEvent: pushEventMock
});

describe("acceptVisitRequestCommand", () => {
  test("should decline visit request and push event to event store", async () => {
    // act
    await declineVisitRequestCommand(
      { id: requestId, isAdmin: true, requesterEmail: hostEmail },
      { eventStore }
    );

    // assert
    expect(pushEventMock).toHaveBeenNthCalledWith(1, {
      aggregateId: requestId,
      event: {
        payload: {
          id: requestId
        },
        type: "VISIT_REQUEST_DECLINED"
      },
      version: 2
    });
  });
});
