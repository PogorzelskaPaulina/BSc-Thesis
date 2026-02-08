import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { EventStore } from "../../../ports/database/EventStore";
import { PrimitiveValue } from "../../../shared/types/PrimitiveValue";
import { getVisitAndEventStream } from "../../../shared/utils/getVisitAndEventStream/getVisitAndEventStream";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { getLatestEventVersion } from "../../../shared/utils/getLatestEventVersion/getLatestEventVersion";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";

export interface Input {
  id: Uuid;
  timeframe: PrimitiveValue<VisitTimeframe>;
  requesterEmail: string;
  isAdmin: boolean;
}

export interface Context {
  visitEventStore: EventStore<VisitEventStream>;
}

export const changeVisitTimeframeCommand = async (
  { id, timeframe, requesterEmail, isAdmin }: Input,
  { visitEventStore }: Context
) => {
  const { visit, eventsStream } = await getVisitAndEventStream(
    id,
    visitEventStore,
    (visitState) => {
      if (visitState.hostEmail !== requesterEmail && !isAdmin) {
        throw new NotFoundException("Visit not found");
      }
    }
  );

  const event = visit.changeTimeframe(timeframe);

  await visitEventStore.pushEvent({
    event,
    aggregateId: <string>id,
    version: getLatestEventVersion(eventsStream) + 1
  });
};
