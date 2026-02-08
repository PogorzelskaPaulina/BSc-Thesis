import { EventBridgeHandler } from "aws-lambda";
import { visitCreatedHandler } from "../../../app/event/visitCreatedHandler/visitCreatedHandler";
import { VisitCreated } from "../../../domain/events/events";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoRoomRepository } from "../../database/DynamoRoomRepository/DynamoRoomRepository";
import { DynamoRoomReservationRepository } from "../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";

const visitRepository: VisitRepository = new DynamoVisitRepository();
const attendeeRepository: AttendeeRepository = new DynamoAttendeeRepository();
const roomRepository: RoomRepository = new DynamoRoomRepository();
const roomReservationRepository: RoomReservationRepository = new DynamoRoomReservationRepository();

export const handler: EventBridgeHandler<
  "VISIT_CREATED",
  ReturnType<VisitEventStream<VisitCreated>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitCreated>(event.detail);

  await visitCreatedHandler(
    { visitEventStream },
    { visitRepository, attendeeRepository, roomRepository, roomReservationRepository }
  );
});
