import { EventBridgeHandler } from "aws-lambda";
import { visitCreatedNotifierHandler } from "../../../app/event/visitCreatedNotifierHandler/visitCreatedNotifierHandler";
import { VisitCreated } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { getNotifiers } from "../../notifications/notifiers";

const dynamoAttendeeRepository = new DynamoAttendeeRepository();
const dynamoVisitRepository = new DynamoVisitRepository();
const notifiers = getNotifiers(dynamoAttendeeRepository, dynamoVisitRepository);

export const handler: EventBridgeHandler<
  "VISIT_CREATED",
  ReturnType<VisitEventStream<VisitCreated>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitCreated>(event.detail);

  await visitCreatedNotifierHandler({ visitEventStream }, { notifiers });
});
