import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitCreated } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";
import { mockStartISODate, mockEndISODate } from "../../../shared/tests/mockDates";
import { visitCreatedNotifierHandler, Input, Context } from "./visitCreatedNotifierHandler";

const input: Input = {
  visitEventStream: VisitEventStream.create<VisitCreated>({
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
};

const notifier = createMock<Notifier>({
  notifyAboutVisitCreation: jest.fn()
});

const context: Context = {
  notifiers: [notifier]
};

describe("visitCreatedNotifierHandler", () => {
  test("should notify about created visit", async () => {
    // act
    await visitCreatedNotifierHandler(input, context);

    // assert
    expect(notifier.notifyAboutVisitCreation).toHaveBeenCalledWith(input.visitEventStream.event);
  });
});
