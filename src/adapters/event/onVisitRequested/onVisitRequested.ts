import { EventBridgeHandler } from "aws-lambda";
import { visitRequestedHandler } from "../../../app/event/visitRequestedHandler/visitRequestedHandler";
import { VisitRequested } from "../../../domain/events/events";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRequestRepository } from "../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository";
import { VisitEventStream } from "../../models/VisitEventStream";

const requestRepository: VisitRequestRepository = new DynamoVisitRequestRepository();
const attendeeRepository: AttendeeRepository = new DynamoAttendeeRepository();

export const handler: EventBridgeHandler<
  "VISIT_REQUESTED",
  ReturnType<VisitEventStream<VisitRequested>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitRequested>(event.detail);

  await visitRequestedHandler({ visitEventStream }, { requestRepository, attendeeRepository });
});
