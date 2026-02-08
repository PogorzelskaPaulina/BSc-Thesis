import { EventBridgeHandler } from "aws-lambda";
import { visitRequestAcceptedHandler } from "../../../app/event/visitRequestAcceptedHandler/visitRequestAcceptedHandler";
import { VisitRequestAccepted } from "../../../domain/events/events";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { DynamoVisitRequestRepository } from "../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository";
import { VisitEventStream } from "../../models/VisitEventStream";

const visitRepository = new DynamoVisitRepository();
const visitRequestRepository = new DynamoVisitRequestRepository();

export const handler: EventBridgeHandler<
  "VISIT_REQUEST_ACCEPTED",
  ReturnType<VisitEventStream<VisitRequestAccepted>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitRequestAccepted>(event.detail);

  await visitRequestAcceptedHandler(
    { visitEventStream },
    { visitRepository, visitRequestRepository }
  );
});
