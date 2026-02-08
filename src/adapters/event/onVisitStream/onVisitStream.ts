import { DynamoDBStreamHandler } from "aws-lambda";
import { AttributeMap, Converter } from "aws-sdk/clients/dynamodb";
import { visitStreamHandler } from "../../../app/event/visitStreamHandler/visitStreamHandler";
import { EventBroker } from "../../../ports/event/EventBroker";
import { asyncMiddleware } from "../../../shared/utils/asyncMiddleware/asyncMiddleware";
import { notEmpty } from "../../../shared/utils/notEmpty/notEmpty";
import { VisitEventStream, VisitEventStreamProps } from "../../models/VisitEventStream";
import { EventBridgeEventBroker } from "../EventBridgeEventBroker/EventBridgeEventBroker";

const eventBroker: EventBroker = new EventBridgeEventBroker();

export const handler: DynamoDBStreamHandler = asyncMiddleware(async (event) => {
  const streams = event.Records.map((record) => {
    if (record.eventName !== "INSERT") {
      return null;
    }

    return VisitEventStream.create(
      <VisitEventStreamProps>Converter.unmarshall(<AttributeMap>record.dynamodb?.NewImage)
    );
  }).filter(notEmpty);

  await visitStreamHandler({ streams }, { eventBroker });
});
