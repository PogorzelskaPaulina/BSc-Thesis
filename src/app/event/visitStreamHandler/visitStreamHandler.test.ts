import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitCreated } from "../../../domain/events/events";
import { EventBroker } from "../../../ports/event/EventBroker";
import { mockStartISODate, mockEndISODate } from "../../../shared/tests/mockDates";
import { visitStreamHandler, Input, Context } from "./visitStreamHandler";

const input: Input = {
  streams: [
    VisitEventStream.create<VisitCreated>({
      aggregateId: "",
      version: 1,
      isInitialEvent: 1,
      timestamp: "",
      event: {
        type: "VISIT_CREATED" as const,
        payload: {
          id: "",
          status: "created",
          title: "",
          timeframe: { start: mockStartISODate, end: mockEndISODate },
          hostEmail: "",
          guests: []
        }
      }
    })
  ]
};

const eventBroker = createMock<EventBroker>({
  publishEvents: jest.fn()
});

const context: Context = {
  eventBroker
};

describe("visitStreamHandler", () => {
  test("should publish events for all given visit streams", async () => {
    // act
    await visitStreamHandler(input, context);

    // assert
    expect(eventBroker.publishEvents).toHaveBeenCalledWith([
      {
        payload: input.streams[0].toPrimitive(),
        source: "onVisitStream",
        type: input.streams[0].event.type
      }
    ]);
  });
});
