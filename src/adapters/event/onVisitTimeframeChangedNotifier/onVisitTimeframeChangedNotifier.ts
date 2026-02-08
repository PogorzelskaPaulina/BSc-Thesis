import { EventBridgeHandler } from "aws-lambda";
import { visitTimeframeChangedNotifierHandler } from "../../../app/event/visitTimeframeChangedNotifierHandler/visitTimeframeChangedNotifierHandler";
import { VisitTimeframeChanged } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { getNotifiers } from "../../notifications/notifiers";

const dynamoAttendeeRepository = new DynamoAttendeeRepository();
const dynamoVisitRepository = new DynamoVisitRepository();
const notifiers = getNotifiers(dynamoAttendeeRepository, dynamoVisitRepository);

export const handler: EventBridgeHandler<
  "VISIT_TIMEFRAME_CHANGED",
  ReturnType<VisitEventStream<VisitTimeframeChanged>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitTimeframeChanged>(event.detail);

  await visitTimeframeChangedNotifierHandler({ visitEventStream }, { notifiers });
});
