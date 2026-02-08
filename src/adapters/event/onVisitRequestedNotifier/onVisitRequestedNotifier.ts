import { EventBridgeHandler } from "aws-lambda";
import { visitRequestedNotifierHandler } from "../../../app/event/visitRequestedNotifierHandler/visitRequestedNotifierHandler";
import { VisitRequested } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { getNotifiers } from "../../notifications/notifiers";

const dynamoAttendeeRepository = new DynamoAttendeeRepository();
const dynamoVisitRepository = new DynamoVisitRepository();
const notifiers = getNotifiers(dynamoAttendeeRepository, dynamoVisitRepository);

export const handler: EventBridgeHandler<
  "VISIT_REQUESTED",
  ReturnType<VisitEventStream<VisitRequested>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitRequested>(event.detail);

  await visitRequestedNotifierHandler({ visitEventStream }, { notifiers });
});
