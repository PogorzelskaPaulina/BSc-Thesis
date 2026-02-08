import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitCanceled } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";

export interface Input {
  visitEventStream: VisitEventStream<VisitCanceled>;
}

export interface Context {
  notifiers: Notifier[];
}

export const visitCanceledNotifierHandler = async (
  { visitEventStream }: Input,
  { notifiers }: Context
) => {
  const notifiersPromises = notifiers.map((notifier) =>
    notifier.notifyAboutVisitCancelation(visitEventStream.event)
  );

  await Promise.all(notifiersPromises);
};
