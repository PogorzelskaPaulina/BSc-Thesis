import { EventBridgeHandler } from "aws-lambda";
import { VisitorCheckedIn } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { getNotifiers } from "../../notifications/notifiers";
import { visitorCheckedInNotifierHandler } from "../../../app/event/visitorCheckedInNotifier/visitorCheckedInNotifier";

const dynamoAttendeeRepository = new DynamoAttendeeRepository();
const dynamoVisitRepository = new DynamoVisitRepository();
const notifiers = getNotifiers(dynamoAttendeeRepository, dynamoVisitRepository);

export const handler: EventBridgeHandler<
  "VISITOR_CHECKED_IN",
  ReturnType<VisitEventStream<VisitorCheckedIn>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitorCheckedIn>(event.detail);

  await visitorCheckedInNotifierHandler({ visitEventStream }, { notifiers });
});
