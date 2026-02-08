import { EventBridgeHandler } from "aws-lambda";
import { visitInvitationDeclinedNotifierHandler } from "../../../app/event/visitInvitationDeclinedNotifierHandler/visitInvitationDeclinedNotifierHandler";
import { VisitInvitationDeclined } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { getNotifiers } from "../../notifications/notifiers";

const dynamoAttendeeRepository = new DynamoAttendeeRepository();
const dynamoVisitRepository = new DynamoVisitRepository();
const notifiers = getNotifiers(dynamoAttendeeRepository, dynamoVisitRepository);

export const handler: EventBridgeHandler<
  "VISIT_INVITATION_DECLINED",
  ReturnType<VisitEventStream<VisitInvitationDeclined>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitInvitationDeclined>(event.detail);

  await visitInvitationDeclinedNotifierHandler({ visitEventStream }, { notifiers });
});
