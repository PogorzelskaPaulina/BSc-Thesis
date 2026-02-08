import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitorCheckedIn } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";

export interface Input {
  visitEventStream: VisitEventStream<VisitorCheckedIn>;
}

export interface Context {
  notifiers: Notifier[];
}

export const visitorCheckedInNotifierHandler = async (
  { visitEventStream }: Input,
  { notifiers }: Context
) => {
  const notifiersPromises = notifiers.map((notifier) =>
    notifier.notifyAboutVisitorCheckedIn(visitEventStream.event)
  );

  await Promise.all(notifiersPromises);
};
