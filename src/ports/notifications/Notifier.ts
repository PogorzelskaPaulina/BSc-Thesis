import {
  VisitCanceled,
  VisitCreated,
  VisitInvitationAccepted,
  VisitRequested,
  VisitInvitationDeclined,
  VisitTimeframeChanged,
  VisitorCheckedIn,
  VisitGuestsChanged
} from "../../domain/events/events";

export interface Notifier {
  notifyAboutVisitCreation(event: VisitCreated): Promise<void>;
  notifyAboutVisitInvitationAcceptation(event: VisitInvitationAccepted): Promise<void>;
  notifyAboutVisitInvitationDecline(event: VisitInvitationDeclined): Promise<void>;
  notifyAboutVisitCancelation(event: VisitCanceled): Promise<void>;
  notifyAboutVisitRequested(event: VisitRequested): Promise<void>;
  notifyAboutVisitTimeframeChanged(event: VisitTimeframeChanged): Promise<void>;
  notifyAboutVisitorCheckedIn(event: VisitorCheckedIn): Promise<void>;
  notifyAboutGuestsChanged(event: VisitGuestsChanged): Promise<void>;
}
