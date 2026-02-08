import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { Guest } from "../../../domain/events/events";
import { VisitState } from "../../../domain/state";
import { isVisitRequest } from "../isVisitRequest/isVisitRequest";
import { Uuid } from "../Uuid/Uuid";

const acceptOrDeclineGuestInvitation = (guests: Guest[], invitationId: Uuid, accepted: boolean) => {
  return guests.map((guest) => {
    if (guest.invitationId === invitationId) {
      return { ...guest, accepted };
    }

    return guest;
  });
};

export const constructState = (events: VisitEventStream[]): VisitState => {
  return events.reduce<VisitState>((state, { event }) => {
    switch (event?.type) {
      case "VISIT_REQUESTED":
        return event.payload;
      case "VISIT_REQUEST_ACCEPTED":
        if (state.status !== "requested") {
          throw new Error("Corrupted visit state");
        }

        return {
          ...state,
          status: "accepted"
        };
      case "VISIT_TIMEFRAME_CHANGED":
        if (isVisitRequest(state)) {
          throw new Error("Corrupted visit state");
        }

        return {
          ...state,
          timeframe: event.payload.timeframe
        };
      case "VISIT_REQUEST_DECLINED":
        if (state.status !== "requested") {
          throw new Error("Corrupted visit state");
        }

        return {
          ...state,
          status: "declined"
        };
      case "VISIT_CREATED":
        return event.payload;
      case "VISIT_INVITATION_ACCEPTED": {
        if (isVisitRequest(state)) {
          throw new Error("Corrupted visit state");
        }

        return {
          ...state,
          guests: acceptOrDeclineGuestInvitation(state.guests, event.payload.invitationId, true)
        };
      }
      case "VISIT_INVITATION_DECLINED": {
        if (isVisitRequest(state)) {
          throw new Error("Corrupted visit state");
        }

        return {
          ...state,
          guests: acceptOrDeclineGuestInvitation(state.guests, event.payload.invitationId, false)
        };
      }
      case "VISIT_CANCELED": {
        if (state.status !== "created") {
          throw new Error("Corrupted visit state");
        }

        return {
          ...state,
          status: "canceled"
        };
      }

      case "VISITOR_CHECKED_IN": {
        if (isVisitRequest(state)) {
          throw new Error("Corrupted visit state");
        }

        return {
          ...state,
          guests: state.guests.map((guest) => {
            if (guest.invitationId === event.payload.invitationId) {
              return { ...guest, checkedIn: true };
            }

            return guest;
          })
        };
      }

      default:
        return state;
    }
  }, {} as VisitState);
};
