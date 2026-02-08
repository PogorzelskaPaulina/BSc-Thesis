import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitInvitationAccepted } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { visitInvitationAcceptedHandler, Input, Context } from "./visitInvitationAcceptedHandler";

const input: Input = {
  visitEventStream: VisitEventStream.create<VisitInvitationAccepted>({
    aggregateId: "",
    version: 2,
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

const visitRepository = createMock<VisitRepository>({
  setInvitationAcceptance: jest.fn()
});

const context: Context = {
  visitRepository
};

describe("visitInvitationAcceptedHandler", () => {
  test("should update visit entity with accepted invitation", async () => {
    // act
    await visitInvitationAcceptedHandler(input, context);

    // assert
    expect(visitRepository.setInvitationAcceptance).toHaveBeenCalledWith(
      input.visitEventStream.event.payload.id,
      input.visitEventStream.event.payload.invitationId,
      true
    );
  });
});
