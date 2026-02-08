import EventBridge from "aws-sdk/clients/eventbridge";
import { Event, EventBroker } from "../../../ports/event/EventBroker";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { sliceIntoChunks } from "../../../shared/utils/sliceIntoChunks/sliceIntoChunks";

export class EventBridgeEventBroker implements EventBroker {
  private readonly client = new EventBridge();

  private readonly eventBusName = checkForEnv(process.env.EVENT_BUS);

  private readonly MAX_BATCH_SIZE = 10;

  async publishEvents(events: Event[]) {
    const chunked = sliceIntoChunks(events, this.MAX_BATCH_SIZE);

    const promises = chunked.map((chunks) =>
      this.client
        .putEvents({
          Entries: chunks.map(({ type, payload, source }) => ({
            DetailType: type,
            Detail: JSON.stringify(payload),
            EventBusName: this.eventBusName,
            Source: source
          }))
        })
        .promise()
    );

    await Promise.all(promises);
  }
}
