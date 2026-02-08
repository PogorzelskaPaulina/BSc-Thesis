import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { MailNotifier } from "../../../adapters/notifications/MailNotifier/MailNotifier";
import { EventStore } from "../../../ports/database/EventStore";
import { UnauthorizedException } from "../../../shared/exceptions/UnauthorizedException/UnauthorizedException";

export interface Input {
  requesterEmail: string;
  isAdmin: boolean;
  startDate: string;
  endDate: string;
  requestTime: number;
}

interface Context {
  eventStore: EventStore<VisitEventStream>;
  mailNotifier: MailNotifier;
}

export const requestAuditLogCommand = async (
  { isAdmin, requesterEmail, startDate, endDate, requestTime }: Input,
  { mailNotifier, eventStore }: Context
) => {
  if (!isAdmin) {
    throw new UnauthorizedException();
  }

  const events = await eventStore.getAllEventsBetweenTimestamps(startDate, endDate);

  return mailNotifier.sendAuditLog(requesterEmail, requestTime, JSON.stringify(events));
};
