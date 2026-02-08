import { AttendeeRepository } from "../../ports/database/AttendeeRepository";
import { VisitRepository } from "../../ports/database/VisitRepository";
import { Notifier } from "../../ports/notifications/Notifier";
import { SNSNotifier } from "./SNSNotifier/SNSNotifier";
import { MailNotifier } from "./MailNotifier/MailNotifier";

export const getNotifiers = (
  attendeeRepository: AttendeeRepository,
  visitRepository: VisitRepository
): Notifier[] => {
  const mailNotifier = new MailNotifier(attendeeRepository, visitRepository);
  const snsNotifier = new SNSNotifier(attendeeRepository, visitRepository);

  return [mailNotifier, snsNotifier];
};
