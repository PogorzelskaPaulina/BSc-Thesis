import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EventStore } from "../../../ports/database/EventStore";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { mockEndISODate, mockStartISODate } from "../../../shared/tests/mockDates";
import { cancelVisitCommand } from "./cancelVisitCommand";

const pushEventMock = jest.fn();
const visitId = "id";
const hostEmail = "host@email.com";

const eventStore = createMock<EventStore<VisitEventStream>>({
  getEvents: async (id) => [
    VisitEventStream.create({
      aggregateId: id,
      isInitialEvent: 1,
      timestamp: mockStartISODate,
      version: 1,
      event: {
        type: "VISIT_CREATED",
        payload: {
          id,
          guests: [],
          hostEmail,
          status: "created",
          timeframe: { start: mockStartISODate, end: mockEndISODate },
          title: "title"
        }
      }
    })
  ],
  pushEvent: pushEventMock
});

describe("cancelVisitCommand", () => {
  beforeEach(() => jest.clearAllMocks());

  test("should throw an error when requester is not the visit creator and not an admin", async () => {
    // act, assert
    await expect(
      cancelVisitCommand(
        { visitId, isAdmin: false, requesterEmail: "different-email@email.com" },
        { eventStore }
      )
    ).rejects.toThrow(NotFoundException);
  });

  test("should cancel visit when requester is not the visit creator but an admin", async () => {
    await cancelVisitCommand(
      { visitId, isAdmin: true, requesterEmail: "different-email@email.com" },
      { eventStore }
    );

    // assert
    expect(pushEventMock).toHaveBeenNthCalledWith(1, {
      aggregateId: visitId,
      event: {
        payload: {
          id: visitId
        },
        type: "VISIT_CANCELED"
      },
      version: 2
    });
  });

  test("should cancel visit when requester is the visit creator and not an admin", async () => {
    await cancelVisitCommand(
      { visitId, isAdmin: false, requesterEmail: hostEmail },
      { eventStore }
    );

    // assert
    expect(pushEventMock).toHaveBeenNthCalledWith(1, {
      aggregateId: visitId,
      event: {
        payload: {
          id: visitId
        },
        type: "VISIT_CANCELED"
      },
      version: 2
    });
  });

  test("should cancel visit when requester email is the visit creator and an admin", async () => {
    await cancelVisitCommand({ visitId, isAdmin: true, requesterEmail: hostEmail }, { eventStore });

    // assert
    expect(pushEventMock).toHaveBeenNthCalledWith(1, {
      aggregateId: visitId,
      event: {
        payload: {
          id: visitId
        },
        type: "VISIT_CANCELED"
      },
      version: 2
    });
  });
});
