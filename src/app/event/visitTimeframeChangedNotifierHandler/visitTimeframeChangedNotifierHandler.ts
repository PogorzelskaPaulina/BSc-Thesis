import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitTimeframeChanged } from "../../../domain/events/events";
import { Notifier } from "../../../ports/notifications/Notifier";

export interface Input {
  visitEventStream: VisitEventStream<VisitTimeframeChanged>;
}

export interface Context {
  notifiers: Notifier[];
}

export const visitTimeframeChangedNotifierHandler = async (
  { visitEventStream }: Input,
  { notifiers }: Context
) => {
  const notifiersPromises = notifiers.map((notifier) =>
    notifier.notifyAboutVisitTimeframeChanged(visitEventStream.event)
  );

  await Promise.all(notifiersPromises);
};
