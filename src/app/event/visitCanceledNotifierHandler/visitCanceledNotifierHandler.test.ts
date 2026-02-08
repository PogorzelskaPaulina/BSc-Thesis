import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitCanceled } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";
import { visitCanceledNotifierHandler, Input, Context } from "./visitCanceledNotifierHandler";

const input: Input = {
  visitEventStream: VisitEventStream.create<VisitCanceled>({
    aggregateId: "",
    version: 2,
    timestamp: "",
    event: {
      type: "VISIT_CANCELED",
      payload: {
        id: ""
      }
    }
  })
};

const notifier = createMock<Notifier>({
  notifyAboutVisitCancelation: jest.fn()
});

const context: Context = {
  notifiers: [notifier]
};

describe("visitCanceledNotifierHandler", () => {
  test("should update visit entity with accepted invitation", async () => {
    // act
    await visitCanceledNotifierHandler(input, context);

    // assert
    expect(notifier.notifyAboutVisitCancelation).toHaveBeenCalledWith(input.visitEventStream.event);
  });
});
