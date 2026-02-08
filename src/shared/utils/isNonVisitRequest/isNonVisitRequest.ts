import { NonVisitRequestedState, VisitState } from "../../../domain/state";

export const isNonVisitRequest = (state: VisitState): state is NonVisitRequestedState =>
  state.status === "created" || state.status === "accepted" || state.status === "canceled";
