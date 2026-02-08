import { VisitRequestedState, VisitState } from "../../../domain/state";

export const isVisitRequest = (state: VisitState): state is VisitRequestedState =>
  state.status === "requested" || state.status === "declined";
