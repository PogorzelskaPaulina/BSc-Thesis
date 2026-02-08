import joi from "joi";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dayjs from "dayjs";
import { DynamoRepository } from "../DynamoRepository/DynamoRepository";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { VisitRequest, VisitRequestProps } from "../../models/VisitRequest";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { Paginated, Pagination } from "../../../shared/types/Pagination";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { VisitRequestedStatus } from "../../../domain/state";
import { Visit } from "../../../domain/Visit";

export class DynamoVisitRequestRepository
  extends DynamoRepository
  implements VisitRequestRepository
{
  private readonly baseKeySchema = {
    requestDate: joi.string().isoDate().required(),
    id: joi.string().uuid().required()
  };

  constructor() {
    super("VISIT_REQUEST_TABLE");
  }

  async create(request: VisitRequest): Promise<void> {
    await this.documentClient
      .put({
        TableName: this.tableName,
        Item: request.toPrimitive(),
        ConditionExpression: "attribute_not_exists(id)"
      })
      .promise();
  }

  private static mapItemsToVisitRequests(
    items: DocumentClient.ItemList | undefined
  ): VisitRequest[] {
    return items!.map((request) => VisitRequest.create(request as VisitRequestProps));
  }

  private validateKeySchema = (cursor: unknown) => {
    const schema = joi
      .object({
        hostEmail: joi.string().email().required(),
        ...this.baseKeySchema
      })
      .required();

    const { error } = schema.validate(cursor);

    if (error) {
      throw new BadRequestException("The provided cursor is invalid");
    }
  };

  private getHostQueryProperties = (email: string, limit: number) => ({
    TableName: this.tableName,
    IndexName: "byHostEmailAndRequestDate",
    KeyConditionExpression:
      "hostEmail = :hostEmail AND requestDate BETWEEN :lowerRequestLimitTime and :currentTime",
    ExpressionAttributeValues: {
      ":hostEmail": email,
      ":lowerRequestLimitTime": dayjs().subtract(Visit.validityPeriod, "minutes").toISOString(),
      ":currentTime": dayjs().toISOString()
    },
    Limit: limit
  });

  private async checkIfNextHostVisitRequestExists(
    email: string,
    lastEvaluatedKey: DocumentClient.Key | undefined
  ) {
    if (lastEvaluatedKey === undefined) {
      return false;
    }

    const { Items } = await this.documentClient
      .query({
        ...this.getHostQueryProperties(email, 1),
        ExclusiveStartKey: lastEvaluatedKey
      })
      .promise();

    return Items?.length === 1;
  }

  async findAllHostActiveRequests(
    email: string,
    pagination?: Pagination
  ): Promise<Paginated<VisitRequest>> {
    const paginationCursor = DynamoVisitRequestRepository.getPaginationCursor(
      pagination?.cursor,
      (decodedCursor) => this.validateKeySchema(decodedCursor)
    );

    const { Items, LastEvaluatedKey } = await this.documentClient
      .query({
        ...this.getHostQueryProperties(email, this.getPaginationLimit(pagination?.limit)),
        ...(paginationCursor ? { ExclusiveStartKey: paginationCursor } : {})
      })
      .promise();

    const doesNextVisitRequestExist = await this.checkIfNextHostVisitRequestExists(
      email,
      LastEvaluatedKey
    );

    return {
      cursor: DynamoVisitRequestRepository.encodeCursor(
        LastEvaluatedKey,
        doesNextVisitRequestExist
      ),
      items: DynamoVisitRequestRepository.mapItemsToVisitRequests(Items)
    };
  }

  private validateAdminKeySchema = (cursor: unknown) => {
    const schema = joi
      .object({
        baseRequestDate: joi.string().required(),
        ...this.baseKeySchema
      })
      .required();

    const { error } = schema.validate(cursor);

    if (error) {
      throw new BadRequestException("The provided cursor is invalid");
    }
  };

  private getAdminQueryProperties = (limit: number) => ({
    TableName: this.tableName,
    IndexName: "byRequestDate",
    KeyConditionExpression:
      "baseRequestDate = :baseRequestDate AND requestDate BETWEEN :lowerRequestLimitTime and :currentTime",
    ExpressionAttributeValues: {
      ":baseRequestDate": dayjs().format("DD-MM-YYYY"),
      ":lowerRequestLimitTime": dayjs().subtract(Visit.validityPeriod, "minutes").toISOString(),
      ":currentTime": dayjs().toISOString()
    },
    Limit: limit
  });

  private async checkIfNextAdminVisitRequestExists(
    lastEvaluatedKey: DocumentClient.Key | undefined
  ) {
    if (lastEvaluatedKey === undefined) {
      return false;
    }

    const { Items } = await this.documentClient
      .query({
        ...this.getAdminQueryProperties(1),
        ExclusiveStartKey: lastEvaluatedKey
      })
      .promise();

    return Items?.length === 1;
  }

  async findAllActiveRequests(pagination?: Pagination): Promise<Paginated<VisitRequest>> {
    const paginationCursor = DynamoVisitRequestRepository.getPaginationCursor(
      pagination?.cursor,
      (decodedCursor) => this.validateAdminKeySchema(decodedCursor)
    );

    const { Items, LastEvaluatedKey } = await this.documentClient
      .query({
        ...this.getAdminQueryProperties(this.getPaginationLimit(pagination?.limit)),
        ...(paginationCursor ? { ExclusiveStartKey: paginationCursor } : {})
      })
      .promise();

    const doesNextVisitRequestExist = await this.checkIfNextAdminVisitRequestExists(
      LastEvaluatedKey
    );

    return {
      cursor: DynamoVisitRequestRepository.encodeCursor(
        LastEvaluatedKey,
        doesNextVisitRequestExist
      ),
      items: DynamoVisitRequestRepository.mapItemsToVisitRequests(Items)
    };
  }

  async findById(id: VisitId): Promise<VisitRequest> {
    const { Item } = await this.documentClient
      .get({
        TableName: this.tableName,
        Key: { id }
      })
      .promise();

    if (!Item) {
      throw new NotFoundException("Visit request not found");
    }

    return VisitRequest.create(Item as VisitRequestProps);
  }

  async remove(id: VisitId): Promise<void> {
    await this.documentClient
      .delete({
        TableName: this.tableName,
        Key: { id },
        ConditionExpression: "attribute_exists(id)"
      })
      .promise();
  }

  async decline(id: VisitId): Promise<void> {
    const status: VisitRequestedStatus = "declined";

    await this.documentClient
      .update({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ConditionExpression: "id = :id",
        ExpressionAttributeValues: {
          ":status": status,
          ":id": id
        }
      })
      .promise();
  }
}
