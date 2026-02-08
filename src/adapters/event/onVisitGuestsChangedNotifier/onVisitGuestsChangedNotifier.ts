import { EventBridgeHandler } from "aws-lambda";
import { visitGuestsChangedNotifierHandler } from "../../../app/event/visitGuestsChangedNotifierHandler/visitGuestsChangedNotifierHandler";
import { VisitGuestsChanged } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { getNotifiers } from "../../notifications/notifiers";

const dynamoAttendeeRepository = new DynamoAttendeeRepository();
const dynamoVisitRepository = new DynamoVisitRepository();
const notifiers = getNotifiers(dynamoAttendeeRepository, dynamoVisitRepository);

export const handler: EventBridgeHandler<
  "VISIT_GUESTS_CHANGED",
  ReturnType<VisitEventStream<VisitGuestsChanged>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitGuestsChanged>(event.detail);

  await visitGuestsChangedNotifierHandler({ visitEventStream }, { notifiers });
});
