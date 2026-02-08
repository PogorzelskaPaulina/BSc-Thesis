import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitInvitationDeclined } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";

export interface Input {
  visitEventStream: VisitEventStream<VisitInvitationDeclined>;
}

export interface Context {
  notifiers: Notifier[];
}

export const visitInvitationDeclinedNotifierHandler = async (
  { visitEventStream }: Input,
  { notifiers }: Context
) => {
  const notifiersPromises = notifiers.map((notifier) =>
    notifier.notifyAboutVisitInvitationDecline(visitEventStream.event)
  );

  await Promise.all(notifiersPromises);
};
