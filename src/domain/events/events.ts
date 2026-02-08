import { Uuid } from "../../shared/utils/Uuid/Uuid";
import { NonVisitRequestedState, VisitRequestedState } from "../state";
import { VisitId } from "../valueObjects/VisitId/VisitId";
import { VisitTimeframe } from "../valueObjects/VisitTimeframe/VisitTimeframe";

export type EmployeeType = "employee";

export type VisitorType = "visitor";

export type AttendeeType = EmployeeType | VisitorType;

export interface Employee {
  email: string;
  invitationId: Uuid;
  accepted: null | boolean;
  type: EmployeeType;
}

export interface Visitor extends Omit<Employee, "type"> {
  checkedIn: boolean;
  type: VisitorType;
  pinCode: string;
}

export type Guest = Employee | Visitor;

export interface VisitCreated {
  type: "VISIT_CREATED";
  payload: NonVisitRequestedState;
}

export interface VisitRequested {
  type: "VISIT_REQUESTED";
  payload: VisitRequestedState;
}

export interface VisitRequestAccepted {
  type: "VISIT_REQUEST_ACCEPTED";
  payload: {
    readonly id: VisitId;
  };
}

export interface VisitRequestDeclined {
  type: "VISIT_REQUEST_DECLINED";
  payload: {
    readonly id: VisitId;
  };
}

export interface VisitInvitationAccepted {
  type: "VISIT_INVITATION_ACCEPTED";
  payload: {
    readonly id: VisitId;
    readonly invitationId: Uuid;
  };
}

export interface VisitInvitationDeclined {
  type: "VISIT_INVITATION_DECLINED";
  payload: {
    readonly id: VisitId;
    readonly invitationId: Uuid;
  };
}

export interface VisitCanceled {
  type: "VISIT_CANCELED";
  payload: {
    readonly id: VisitId;
  };
}

export interface VisitTimeframeChanged {
  type: "VISIT_TIMEFRAME_CHANGED";
  payload: {
    readonly id: VisitId;
    readonly timeframe: VisitTimeframe;
  };
}

export interface VisitGuestsChanged {
  type: "VISIT_GUESTS_CHANGED";
  payload: {
    readonly id: VisitId;
    readonly guests: Guest[];
  };
}

export interface VisitorCheckedIn {
  type: "VISITOR_CHECKED_IN";
  payload: {
    readonly id: VisitId;
    readonly invitationId: Uuid;
  };
}

export type VisitEvent =
  | VisitCreated
  | VisitInvitationAccepted
  | VisitInvitationDeclined
  | VisitCanceled
  | VisitRequested
  | VisitRequestAccepted
  | VisitRequestDeclined
  | VisitTimeframeChanged
  | VisitorCheckedIn
  | VisitGuestsChanged;
