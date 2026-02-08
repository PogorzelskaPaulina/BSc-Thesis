import "reflect-metadata";
import { Exclude, Expose } from "class-transformer";
import {
  VisitCreated,
  VisitEvent,
  VisitInvitationAccepted,
  VisitInvitationDeclined,
  VisitCanceled,
  VisitRequested,
  VisitRequestAccepted,
  VisitRequestDeclined,
  VisitTimeframeChanged,
  VisitorCheckedIn,
  VisitGuestsChanged
} from "../../domain/events/events";
import { Entity } from "./Entity";
import { PrimitiveValue } from "../../shared/types/PrimitiveValue";
import { transformToPrimitive } from "../../shared/utils/transformToPrimitive/transformToPrimitive";
import { VisitTimeframe } from "../../domain/valueObjects/VisitTimeframe/VisitTimeframe";

interface PrimitiveVisitCreated {
  type: VisitCreated["type"];
  payload: Omit<VisitCreated["payload"], "timeframe"> & {
    timeframe: PrimitiveValue<VisitCreated["payload"]["timeframe"]>;
  };
}

interface PrimitiveVisitTimeframeChanged {
  type: VisitTimeframeChanged["type"];
  payload: Omit<VisitTimeframeChanged["payload"], "timeframe"> & {
    timeframe: PrimitiveValue<VisitTimeframeChanged["payload"]["timeframe"]>;
  };
}

export type PrimitiveEvent<T extends VisitEvent = VisitEvent> = T extends VisitRequested
  ? VisitRequested
  : T extends VisitCreated
  ? PrimitiveVisitCreated
  : T extends VisitTimeframeChanged
  ? PrimitiveVisitTimeframeChanged
  : T extends VisitGuestsChanged
  ? VisitGuestsChanged
  : T extends VisitInvitationAccepted
  ? VisitInvitationAccepted
  : T extends VisitInvitationDeclined
  ? VisitInvitationDeclined
  : T extends VisitRequestAccepted
  ? VisitRequestAccepted
  : T extends VisitRequestDeclined
  ? VisitRequestDeclined
  : T extends VisitorCheckedIn
  ? VisitorCheckedIn
  : VisitCanceled;

export interface VisitEventStreamProps<T extends VisitEvent = VisitEvent> {
  event: PrimitiveEvent<T>;
  aggregateId: string;
  version: number;
  isInitialEvent?: number;
  timestamp?: string;
}

@Exclude()
export class VisitEventStream<T extends VisitEvent = VisitEvent>
  implements Entity<VisitEventStreamProps<T>>
{
  private static getTransformedEventPayload({
    event
  }: VisitEventStreamProps): VisitEvent["payload"] {
    switch (event.type) {
      case "VISIT_CREATED":
        return {
          ...event.payload,
          timeframe: VisitTimeframe.from(event.payload.timeframe.start, event.payload.timeframe.end)
        };
      default:
        return event.payload;
    }
  }

  static create<T extends VisitEvent = VisitEvent>(
    data: VisitEventStreamProps<T>,
    isAuditLogStream = false
  ) {
    const object = new VisitEventStream<T>();

    Object.assign(object, {
      ...data,
      event: {
        type: data.event.type,
        payload: isAuditLogStream
          ? data.event.payload
          : VisitEventStream.getTransformedEventPayload(data)
      },
      timestamp: data.timestamp || new Date().toISOString(),
      ...(data.version === 1 ? { isInitialEvent: 1 } : {})
    });

    return object;
  }

  @Expose()
  event: T;

  @Expose()
  aggregateId: string;

  version: number;

  isInitialEvent?: number;

  @Expose()
  timestamp: string;

  toPrimitive() {
    return {
      event: {
        type: this.event.type,
        payload: transformToPrimitive(this.event.payload)
      } as VisitEventStreamProps<T>["event"],
      aggregateId: this.aggregateId,
      version: this.version,
      isInitialEvent: this.isInitialEvent,
      timestamp: this.timestamp,
      adminRead: 1
    };
  }
}
