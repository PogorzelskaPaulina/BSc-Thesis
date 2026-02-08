import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitGuestsChanged } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";

export interface Input {
  visitEventStream: VisitEventStream<VisitGuestsChanged>;
}

export interface Context {
  notifiers: Notifier[];
}

export const visitGuestsChangedNotifierHandler = async (
  { visitEventStream }: Input,
  { notifiers }: Context
) => {
  const notifiersPromises = notifiers.map((notifier) =>
    notifier.notifyAboutGuestsChanged(visitEventStream.event)
  );

  await Promise.all(notifiersPromises);
};
