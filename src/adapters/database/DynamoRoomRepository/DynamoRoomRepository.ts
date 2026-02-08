import { DocumentClient } from "aws-sdk/clients/dynamodb";
import joi from "joi";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { Paginated, Pagination } from "../../../shared/types/Pagination";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { Room, RoomProps } from "../../models/Room";
import { DynamoRepository } from "../DynamoRepository/DynamoRepository";

export class DynamoRoomRepository extends DynamoRepository implements RoomRepository {
  constructor() {
    super("ROOM_TABLE");
  }

  async findById(id: Uuid): Promise<Room> {
    const { Item } = await this.documentClient
      .get({
        TableName: this.tableName,
        Key: { id }
      })
      .promise();

    if (!Item) {
      throw new NotFoundException("Room not found");
    }

    return Room.create(Item as RoomProps);
  }

  private static validateKeySchema = (cursor: unknown) => {
    const schema = joi
      .object({
        id: joi.string().uuid().required()
      })
      .required();

    const { error } = schema.validate(cursor);

    if (error) {
      throw new BadRequestException("The provided cursor is invalid");
    }
  };

  private async checkIfNextRoomExists(lastEvaluatedKey: DocumentClient.Key | undefined) {
    if (lastEvaluatedKey === undefined) {
      return false;
    }

    const { Items } = await this.documentClient
      .scan({
        TableName: this.tableName,
        Limit: 1,
        ExclusiveStartKey: lastEvaluatedKey
      })
      .promise();

    return Items?.length === 1;
  }

  async findAll(pagination?: Pagination): Promise<Paginated<Room>> {
    const paginationCursor = DynamoRoomRepository.getPaginationCursor(
      pagination?.cursor,
      (decodedCursor) => DynamoRoomRepository.validateKeySchema(decodedCursor)
    );

    const { Items, LastEvaluatedKey } = await this.documentClient
      .scan({
        TableName: this.tableName,
        Limit: this.getPaginationLimit(pagination?.limit),
        ...(paginationCursor ? { ExclusiveStartKey: paginationCursor } : {})
      })
      .promise();

    const doesNextRoomExist = await this.checkIfNextRoomExists(LastEvaluatedKey);

    return {
      cursor: DynamoRoomRepository.encodeCursor(LastEvaluatedKey, doesNextRoomExist),
      items: Items!.map((item) => Room.create(item as RoomProps))
    };
  }
}
