import { EventBridgeHandler } from "aws-lambda";
import { VisitGuestsChanged } from "../../../domain/events/events";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { visitGuestsChangedHandler } from "../../../app/event/visitGuestsChangedHandler/visitGuestsChangedHandler";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";

const visitRepository: VisitRepository = new DynamoVisitRepository();
const attendeeRepository: AttendeeRepository = new DynamoAttendeeRepository();

export const handler: EventBridgeHandler<
  "VISIT_GUESTS_CHANGED",
  ReturnType<VisitEventStream<VisitGuestsChanged>["toPrimitive"]>,
  void
> = asyncMiddleware(async (event) => {
  const visitEventStream = VisitEventStream.create<VisitGuestsChanged>(event.detail);

  await visitGuestsChangedHandler({ visitEventStream }, { visitRepository, attendeeRepository });
});
