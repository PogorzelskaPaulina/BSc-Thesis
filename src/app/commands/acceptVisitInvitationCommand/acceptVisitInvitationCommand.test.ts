import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { EventStore } from "../../../ports/database/EventStore";
import { mockEndISODate, mockStartISODate } from "../../../shared/tests/mockDates";
import { acceptVisitInvitationCommand } from "./acceptVisitInvitationCommand";

const pushEventMock = jest.fn();
const visitId = "id";
const invitationId = "invitationId";

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
          guests: [
            {
              accepted: null,
              email: "guest@email.com",
              invitationId,
              type: "visitor",
              checkedIn: false,
              pinCode: ""
            }
          ],
          hostEmail: "host@email.com",
          status: "created",
          timeframe: { start: mockStartISODate, end: mockEndISODate },
          title: "title"
        }
      }
    })
  ],
  pushEvent: pushEventMock
});

describe("acceptVisitInvitationCommand", () => {
  test("should accept visit invitation and push event to event store", async () => {
    // act
    await acceptVisitInvitationCommand({ visitId, invitationId }, { eventStore });

    // assert
    expect(pushEventMock).toHaveBeenNthCalledWith(1, {
      aggregateId: visitId,
      event: {
        payload: {
          id: visitId,
          invitationId
        },
        type: "VISIT_INVITATION_ACCEPTED"
      },
      version: 2
    });
  });
});
