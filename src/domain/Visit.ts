import dayjs from "dayjs";
import { BadRequestException } from "../shared/exceptions/BadRequestException/BadRequestException";
import { NotFoundException } from "../shared/exceptions/NotFoundException/NotFoundException";
import { PrimitiveValue } from "../shared/types/PrimitiveValue";
import { isVisitRequest } from "../shared/utils/isVisitRequest/isVisitRequest";
import { Uuid } from "../shared/utils/Uuid/Uuid";
import {
  AttendeeType,
  VisitCanceled,
  VisitCreated,
  VisitInvitationAccepted,
  VisitInvitationDeclined,
  VisitRequestAccepted,
  VisitRequestDeclined,
  VisitRequested,
  VisitTimeframeChanged,
  VisitorCheckedIn,
  VisitGuestsChanged
} from "./events/events";
import { NonVisitRequestedState, Room, VisitState } from "./state";
import { VisitId } from "./valueObjects/VisitId/VisitId";
import { VisitTimeframe } from "./valueObjects/VisitTimeframe/VisitTimeframe";
import { NotModifiedException } from "../shared/exceptions/NotModifiedException/NotModifiedException";

interface Guest {
  email: string;
  type: AttendeeType;
}

export class Visit {
  static readonly validityPeriod = 30;

  private static readonly pinCodeLength = 6;

  constructor(private readonly state: VisitState) {}

  private static generatePinCode() {
    const startNumber = 2;

    return Math.random()
      .toString()
      .slice(startNumber, startNumber + Visit.pinCodeLength);
  }

  private static getVisitGuests(guests: Guest[]) {
    return guests.map(({ email, type }) => {
      const baseData = {
        email,
        invitationId: Uuid.generate(),
        accepted: null
      };

      if (type === "employee") {
        return {
          ...baseData,
          type
        };
      }

      return {
        ...baseData,
        type,
        checkedIn: false,
        pinCode: Visit.generatePinCode()
      };
    });
  }

  static create(
    title: string,
    timeframe: PrimitiveValue<VisitTimeframe>,
    hostEmail: string,
    guests: Guest[],
    room?: Room
  ): VisitCreated {
    return {
      type: "VISIT_CREATED",
      payload: {
        id: VisitId.generate(),
        status: "created",
        title,
        timeframe: VisitTimeframe.from(timeframe.start, timeframe.end),
        hostEmail,
        guests: Visit.getVisitGuests(guests),
        room
      }
    };
  }

  private static validateRequestTimeframe(requestDate: string, duration: number) {
    const latestPotentialPickUpDate = dayjs(requestDate)
      .add(duration + Visit.validityPeriod, "minutes")
      .toISOString();

    VisitTimeframe.from(requestDate, latestPotentialPickUpDate);
  }

  static request(
    title: string,
    requestDate: string,
    duration: number,
    hostEmail: string,
    guestEmail: string
  ): VisitRequested {
    Visit.validateRequestTimeframe(requestDate, duration);

    return {
      type: "VISIT_REQUESTED",
      payload: {
        id: VisitId.generate(),
        status: "requested",
        title,
        requestDate,
        duration,
        hostEmail,
        guestEmail
      }
    };
  }

  private validateRequestBeforeAcceptanceOrDecline(message: string) {
    if (this.state.status !== "requested") {
      throw new BadRequestException(message);
    }
  }

  acceptRequest(): VisitRequestAccepted {
    this.validateRequestBeforeAcceptanceOrDecline("This request can't be accepted");

    return {
      type: "VISIT_REQUEST_ACCEPTED",
      payload: {
        id: this.state.id
      }
    };
  }

  declineRequest(): VisitRequestDeclined {
    this.validateRequestBeforeAcceptanceOrDecline("This request can't be declined");

    return {
      type: "VISIT_REQUEST_DECLINED",
      payload: {
        id: this.state.id
      }
    };
  }

  changeTimeframe(timeframe: PrimitiveValue<VisitTimeframe>): VisitTimeframeChanged {
    if (isVisitRequest(this.state)) {
      throw new BadRequestException("Can't change timeframe of visit request");
    }

    const { start, end } = this.state.timeframe.valueOf();

    if (start === timeframe.start && end === timeframe.end) {
      throw new BadRequestException("Timeframe must be different");
    }

    return {
      type: "VISIT_TIMEFRAME_CHANGED",
      payload: {
        id: this.state.id,
        timeframe: VisitTimeframe.from(timeframe.start, timeframe.end)
      }
    };
  }

  private areGuestsNotModified(guests: Guest[]) {
    return (
      JSON.stringify((this.state as NonVisitRequestedState).guests.map(({ email }) => email)) ===
      JSON.stringify(guests.map(({ email }) => email))
    );
  }

  changeGuests(guests: Guest[]): VisitGuestsChanged {
    if (isVisitRequest(this.state)) {
      throw new BadRequestException("Can't change timeframe of visit request");
    }

    if (this.areGuestsNotModified(guests)) {
      throw new NotModifiedException("New guests must be different");
    }

    return {
      type: "VISIT_GUESTS_CHANGED",
      payload: {
        id: this.state.id,
        guests: Visit.getVisitGuests(guests)
      }
    };
  }

  private handleVisitInvitationReply(invitationId: Uuid, accepted: boolean) {
    if (isVisitRequest(this.state)) {
      throw new NotFoundException("Invitation not found");
    }

    const invitation = this.state.guests.find(
      ({ invitationId: guestInvitation }) => invitationId === guestInvitation
    );

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    if (invitation.accepted === accepted) {
      throw new BadRequestException(
        accepted ? "Invitation already accepted" : "Invitation already declined"
      );
    }
  }

  acceptVisitInvitation(invitationId: Uuid): VisitInvitationAccepted {
    this.handleVisitInvitationReply(invitationId, true);

    return {
      type: "VISIT_INVITATION_ACCEPTED",
      payload: {
        id: this.state.id,
        invitationId
      }
    };
  }

  declineVisitInvitation(invitationId: Uuid): VisitInvitationDeclined {
    this.handleVisitInvitationReply(invitationId, false);

    return {
      type: "VISIT_INVITATION_DECLINED",
      payload: {
        id: this.state.id,
        invitationId
      }
    };
  }

  checkInVisitor(invitationId: Uuid): VisitorCheckedIn {
    if (isVisitRequest(this.state)) {
      throw new NotFoundException("Visit not found");
    }

    const guest = this.state.guests.find(
      ({ invitationId: guestInvitation }) => invitationId === guestInvitation
    );

    if (!guest) {
      throw new NotFoundException("Visit not found");
    }

    if (guest.type === "employee") {
      throw new NotFoundException("Visit not found");
    }

    if (guest.checkedIn) {
      throw new NotFoundException("Visit not found");
    }

    if (!this.state.timeframe.isValidCheckInTime()) {
      throw new NotFoundException("Visit not found");
    }

    return {
      type: "VISITOR_CHECKED_IN",
      payload: {
        id: this.state.id,
        invitationId
      }
    };
  }

  cancelVisit(): VisitCanceled {
    if (this.state.status === "canceled") {
      throw new BadRequestException("Visit already canceled");
    }

    if (this.state.status !== "created") {
      throw new BadRequestException("Can't cancel this visit");
    }

    return {
      type: "VISIT_CANCELED",
      payload: {
        id: this.state.id
      }
    };
  }
}
