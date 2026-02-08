import { Uuid } from "../shared/utils/Uuid/Uuid";
import { Guest } from "./events/events";
import { VisitId } from "./valueObjects/VisitId/VisitId";
import { VisitTimeframe } from "./valueObjects/VisitTimeframe/VisitTimeframe";

export interface Room {
  id: Uuid;
  isReservedForThisVisit: boolean;
}

export type NonVisitRequestedStatus = "created" | "accepted" | "canceled";

export interface NonVisitRequestedState {
  readonly id: VisitId;
  readonly status: NonVisitRequestedStatus;
  readonly title: string;
  readonly timeframe: VisitTimeframe;
  readonly hostEmail: string;
  readonly guests: Guest[];
  readonly room?: Room;
}

export type VisitRequestedStatus = "requested" | "declined" | "accepted";

export interface VisitRequestedState {
  readonly id: VisitId;
  readonly status: VisitRequestedStatus;
  readonly title: string;
  readonly requestDate: string;
  readonly duration: number;
  readonly hostEmail: string;
  readonly guestEmail: string;
}

export type VisitStatus = NonVisitRequestedStatus | VisitRequestedStatus;

export type VisitState = VisitRequestedState | NonVisitRequestedState;
