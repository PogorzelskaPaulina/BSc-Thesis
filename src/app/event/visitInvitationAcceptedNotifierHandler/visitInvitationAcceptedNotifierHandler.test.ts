import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitInvitationAccepted } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";
import {
  visitInvitationAcceptedNotifierHandler,
  Input,
  Context
} from "./visitInvitationAcceptedNotifierHandler";

const input: Input = {
  visitEventStream: VisitEventStream.create<VisitInvitationAccepted>({
    aggregateId: "",
    version: 1,
    isInitialEvent: 1,
    timestamp: "",
    event: {
      type: "VISIT_INVITATION_ACCEPTED" as const,
      payload: {
        id: "",
        invitationId: ""
      }
    }
  })
};

const notifier = createMock<Notifier>({
  notifyAboutVisitInvitationAcceptation: jest.fn()
});

const context: Context = {
  notifiers: [notifier]
};

describe("visitInvitationAcceptedNotifierHandler", () => {
  test("should notify about visit invitation accepted", async () => {
    // act
    await visitInvitationAcceptedNotifierHandler(input, context);

    // assert
    expect(notifier.notifyAboutVisitInvitationAcceptation).toHaveBeenCalledWith(
      input.visitEventStream.event
    );
  });
});
