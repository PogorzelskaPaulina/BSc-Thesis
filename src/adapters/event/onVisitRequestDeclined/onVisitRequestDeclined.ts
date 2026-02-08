import { EventBridgeHandler } from "aws-lambda";
import { visitRequestDeclinedHandler } from "../../../app/event/visitRequestDeclinedHandler/visitRequestDeclinedHandler";
import { VisitRequestDeclined } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoVisitRequestRepository } from "../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository";
import { VisitEventStream } from "../../models/VisitEventStream";

const visitRequestRepository = new DynamoVisitRequestRepository();

export const handler: EventBridgeHandler<
  "VISIT_REQUEST_DECLINED",
  ReturnType<VisitEventStream<VisitRequestDeclined>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitRequestDeclined>(event.detail);

  await visitRequestDeclinedHandler({ visitEventStream }, { visitRequestRepository });
});
