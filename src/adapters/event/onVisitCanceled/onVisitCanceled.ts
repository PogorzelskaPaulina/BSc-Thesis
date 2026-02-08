import { EventBridgeHandler } from "aws-lambda";
import { visitCanceledHandler } from "../../../app/event/visitCanceledHandler/visitCanceledHandler";
import { VisitCanceled } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { DynamoRoomReservationRepository } from "../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";

const visitRepository: VisitRepository = new DynamoVisitRepository();
const roomReservationRepository: RoomReservationRepository = new DynamoRoomReservationRepository();

export const handler: EventBridgeHandler<
  "VISIT_CANCELED",
  ReturnType<VisitEventStream<VisitCanceled>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitCanceled>(event.detail);

  await visitCanceledHandler({ visitEventStream }, { visitRepository, roomReservationRepository });
});
