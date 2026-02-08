import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitCreated } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";

export interface Input {
  visitEventStream: VisitEventStream<VisitCreated>;
}

export interface Context {
  notifiers: Notifier[];
}

export const visitCreatedNotifierHandler = async (
  { visitEventStream }: Input,
  { notifiers }: Context
) => {
  const notifiersPromises = notifiers.map((notifier) =>
    notifier.notifyAboutVisitCreation(visitEventStream.event)
  );

  await Promise.all(notifiersPromises);
};
