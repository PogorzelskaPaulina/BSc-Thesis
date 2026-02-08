import { EventBridgeHandler } from "aws-lambda";
import { visitInvitationDeclinedHandler } from "../../../app/event/visitInvitationDeclinedHandler/visitInvitationDeclinedHandler";
import { VisitInvitationDeclined } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";

const visitRepository: VisitRepository = new DynamoVisitRepository();

export const handler: EventBridgeHandler<
  "VISIT_INVITATION_DECLINED",
  ReturnType<VisitEventStream<VisitInvitationDeclined>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitInvitationDeclined>(event.detail);

  await visitInvitationDeclinedHandler({ visitEventStream }, { visitRepository });
});
