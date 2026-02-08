import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitInvitationAccepted } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";

export interface Input {
  visitEventStream: VisitEventStream<VisitInvitationAccepted>;
}

export interface Context {
  notifiers: Notifier[];
}

export const visitInvitationAcceptedNotifierHandler = async (
  { visitEventStream }: Input,
  { notifiers }: Context
) => {
  const notifiersPromises = notifiers.map((notifier) =>
    notifier.notifyAboutVisitInvitationAcceptation(visitEventStream.event)
  );

  await Promise.all(notifiersPromises);
};
