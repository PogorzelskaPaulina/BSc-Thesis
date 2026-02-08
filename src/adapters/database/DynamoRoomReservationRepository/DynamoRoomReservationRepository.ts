import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dayjs from "dayjs";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import {
  RoomReservationRepository,
  RoomReservationCompositeKey
} from "../../../ports/database/RoomReservationRepository";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { RoomReservation, RoomReservationProps } from "../../models/RoomReservation";
import { DynamoRepository } from "../DynamoRepository/DynamoRepository";

export class DynamoRoomReservationRepository
  extends DynamoRepository
  implements RoomReservationRepository
{
  constructor() {
    super("ROOM_RESERVATION_TABLE");
  }

  async create(reservation: RoomReservation): Promise<void> {
    await this.documentClient
      .put({
        TableName: this.tableName,
        Item: reservation.toPrimitive()
      })
      .promise();
  }

  private async findByKey(key: RoomReservationCompositeKey) {
    const { Item } = await this.documentClient
      .get({
        TableName: this.tableName,
        Key: key
      })
      .promise();

    if (!Item) {
      throw new NotFoundException("Room reservation not found");
    }

    return RoomReservation.create(Item as RoomReservationProps);
  }

  async findByVisitIdOrNull(visitId: VisitId): Promise<RoomReservation | null> {
    const { Items } = await this.documentClient
      .query({
        TableName: this.tableName,
        IndexName: "byVisitId",
        KeyConditionExpression: "visitId = :visitId",
        ExpressionAttributeValues: {
          ":visitId": visitId
        }
      })
      .promise();

    if (Items?.length === 0) {
      return null;
    }

    const [roomReservationProps] = Items!;

    return RoomReservation.create(roomReservationProps as RoomReservationProps);
  }

  private static getFormattedDate = (date: string) => dayjs(date).format("DD-MM-YYYY");

  private static mapItemsToRoomReservations(
    items: DocumentClient.ItemList | undefined
  ): RoomReservation[] {
    return items!.map((roomReservation) =>
      RoomReservation.create(roomReservation as RoomReservationProps)
    );
  }

  async findReservations(timeframe: VisitTimeframe): Promise<RoomReservation[]> {
    const { start, end } = timeframe.valueOf();
    const baseDateStart = DynamoRoomReservationRepository.getFormattedDate(start);

    const { Items } = await this.documentClient
      .query({
        TableName: this.tableName,
        KeyConditionExpression: "baseDate = :baseDate and dateStartAndId <= :dateEnd",
        ExpressionAttributeValues: {
          ":baseDate": baseDateStart,
          ":dateStart": start,
          ":dateEnd": end
        },
        FilterExpression: "dateEnd >= :dateStart"
      })
      .promise();

    return DynamoRoomReservationRepository.mapItemsToRoomReservations(Items);
  }

  async findRoomReservations(roomId: Uuid, timeframe: VisitTimeframe): Promise<RoomReservation[]> {
    const { start, end } = timeframe.valueOf();
    const baseDateStart = DynamoRoomReservationRepository.getFormattedDate(start);

    const { Items } = await this.documentClient
      .query({
        TableName: this.tableName,
        IndexName: "byBaseDateRoomIdAndDateStart",
        KeyConditionExpression:
          "baseDateAndRoomId = :baseDateAndRoomId and dateStartAndId <= :dateEnd",
        ExpressionAttributeValues: {
          ":baseDateAndRoomId": `${baseDateStart}#${roomId}`,
          ":dateStart": start,
          ":dateEnd": end
        },
        FilterExpression: "dateEnd >= :dateStart"
      })
      .promise();

    return DynamoRoomReservationRepository.mapItemsToRoomReservations(Items);
  }

  private async setRangeKey(
    key: RoomReservationCompositeKey,
    oldRoomReservation: RoomReservation,
    start: string,
    end: string
  ) {
    const updatedRoomReservation = RoomReservation.createFromVisitEvent({
      ...oldRoomReservation,
      dateStart: start,
      dateEnd: end
    });

    await this.documentClient
      .transactWrite({
        TransactItems: [
          {
            Delete: {
              TableName: this.tableName,
              Key: key
            }
          },
          {
            Put: {
              TableName: this.tableName,
              Item: updatedRoomReservation.toPrimitive()
            }
          }
        ]
      })
      .promise();
  }

  private async setDateEnd(key: RoomReservationCompositeKey, end: string) {
    await this.documentClient
      .update({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: "SET dateEnd = :dateEnd",
        ExpressionAttributeValues: {
          ":dateEnd": end
        }
      })
      .promise();
  }

  async setTimeframe(key: RoomReservationCompositeKey, timeframe: VisitTimeframe): Promise<void> {
    const oldRoomReservation = await this.findByKey(key);

    const { start, end } = timeframe.valueOf();

    if (oldRoomReservation.dateStart !== start) {
      await this.setRangeKey(key, oldRoomReservation, start, end);
    } else {
      await this.setDateEnd(key, end);
    }
  }

  async remove(key: RoomReservationCompositeKey): Promise<void> {
    await this.documentClient
      .delete({
        TableName: this.tableName,
        Key: key
      })
      .promise();
  }
}
