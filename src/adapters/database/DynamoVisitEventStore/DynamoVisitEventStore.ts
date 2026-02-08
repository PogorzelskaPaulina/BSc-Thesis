import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { EventStore, Event } from "../../../ports/database/EventStore";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { transformToPrimitive } from "../../../shared/utils/transformToPrimitive/transformToPrimitive";
import {
  PrimitiveEvent,
  VisitEventStream,
  VisitEventStreamProps
} from "../../models/VisitEventStream";
import { DynamoRepository } from "../DynamoRepository/DynamoRepository";

export class DynamoVisitEventStore
  extends DynamoRepository
  implements EventStore<VisitEventStream>
{
  constructor() {
    super("VISITS_EVENT_STORE_TABLE");
  }

  async pushEvent({ aggregateId, event, version }: Event<VisitEventStream>) {
    const visitEventStream = VisitEventStream.create({
      aggregateId,
      event: {
        payload: transformToPrimitive(event.payload),
        type: event.type
      } as PrimitiveEvent,
      version
    });

    await this.documentClient
      .put({
        TableName: this.tableName,
        Item: visitEventStream.toPrimitive()
      })
      .promise();
  }

  private async checkIfAggregateExists(aggregateId: string) {
    const { Item } = await this.documentClient
      .get({
        TableName: this.tableName,
        Key: {
          aggregateId,
          version: 1
        }
      })
      .promise();

    if (!Item) {
      throw new NotFoundException("Visit not found");
    }
  }

  private static mapItemsToVisitEventStreams(
    items: DocumentClient.ItemList | undefined,
    isAuditLogStream = false
  ): VisitEventStream[] {
    return items!.map(({ adminRead, ...visitEventStream }) =>
      VisitEventStream.create(visitEventStream as VisitEventStreamProps, isAuditLogStream)
    );
  }

  async getEvents(aggregateId: string): Promise<VisitEventStream[]> {
    await this.checkIfAggregateExists(aggregateId);

    const { Items } = await this.documentClient
      .query({
        TableName: this.tableName,
        KeyConditionExpression: "aggregateId = :aggregateId",
        ExpressionAttributeValues: {
          ":aggregateId": aggregateId
        }
      })
      .promise();

    return DynamoVisitEventStore.mapItemsToVisitEventStreams(Items);
  }

  async getAllEventsBetweenTimestamps(
    startDate: string,
    endDate: string
  ): Promise<VisitEventStream[]> {
    const { Items } = await this.documentClient
      .query({
        TableName: this.tableName,
        IndexName: "byAdminReadAndTimestamp",
        KeyConditionExpression:
          "adminRead = :adminRead  AND #timestamp BETWEEN :startDate and :endDate",
        ExpressionAttributeValues: {
          ":adminRead": 1,
          ":startDate": startDate,
          ":endDate": endDate
        },
        ExpressionAttributeNames: {
          "#timestamp": "timestamp"
        }
      })
      .promise();

    return DynamoVisitEventStore.mapItemsToVisitEventStreams(Items, true);
  }
}
