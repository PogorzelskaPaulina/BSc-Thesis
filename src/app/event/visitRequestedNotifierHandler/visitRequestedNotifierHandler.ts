import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitRequested } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";

export interface Input {
  visitEventStream: VisitEventStream<VisitRequested>;
}

export interface Context {
  notifiers: Notifier[];
}

export const visitRequestedNotifierHandler = async (
  { visitEventStream }: Input,
  { notifiers }: Context
) => {
  const notifiersPromises = notifiers.map((notifier) =>
    notifier.notifyAboutVisitRequested(visitEventStream.event)
  );

  await Promise.all(notifiersPromises);
};
