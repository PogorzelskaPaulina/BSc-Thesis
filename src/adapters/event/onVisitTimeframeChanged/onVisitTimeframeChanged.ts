import { EventBridgeHandler } from "aws-lambda";
import { visitTimeframeChangedHandler } from "../../../app/event/visitTimeframeChangedHandler/visitTimeframeChangedHandler";
import { VisitTimeframeChanged } from "../../../domain/events/events";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoRoomReservationRepository } from "../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";

const visitRepository: VisitRepository = new DynamoVisitRepository();
const roomReservationRepository: RoomReservationRepository = new DynamoRoomReservationRepository();

export const handler: EventBridgeHandler<
  "VISIT_TIMEFRAME_CHANGED",
  ReturnType<VisitEventStream<VisitTimeframeChanged>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitTimeframeChanged>(event.detail);

  await visitTimeframeChangedHandler(
    { visitEventStream },
    { visitRepository, roomReservationRepository }
  );
});
