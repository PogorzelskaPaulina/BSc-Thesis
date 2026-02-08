import { EventBridgeHandler } from "aws-lambda";
import { visitInvitationAcceptedNotifierHandler } from "../../../app/event/visitInvitationAcceptedNotifierHandler/visitInvitationAcceptedNotifierHandler";
import { VisitInvitationAccepted } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { getNotifiers } from "../../notifications/notifiers";

const dynamoAttendeeRepository = new DynamoAttendeeRepository();
const dynamoVisitRepository = new DynamoVisitRepository();
const notifiers = getNotifiers(dynamoAttendeeRepository, dynamoVisitRepository);

export const handler: EventBridgeHandler<
  "VISIT_INVITATION_ACCEPTED",
  ReturnType<VisitEventStream<VisitInvitationAccepted>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitInvitationAccepted>(event.detail);

  await visitInvitationAcceptedNotifierHandler({ visitEventStream }, { notifiers });
});
