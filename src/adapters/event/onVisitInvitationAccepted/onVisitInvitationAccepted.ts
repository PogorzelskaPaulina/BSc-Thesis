import { EventBridgeHandler } from "aws-lambda";
import { visitInvitationAcceptedHandler } from "../../../app/event/visitInvitationAcceptedHandler/visitInvitationAcceptedHandler";
import { VisitInvitationAccepted } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";

const visitRepository: VisitRepository = new DynamoVisitRepository();

export const handler: EventBridgeHandler<
  "VISIT_INVITATION_ACCEPTED",
  ReturnType<VisitEventStream<VisitInvitationAccepted>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitInvitationAccepted>(event.detail);

  await visitInvitationAcceptedHandler({ visitEventStream }, { visitRepository });
});
