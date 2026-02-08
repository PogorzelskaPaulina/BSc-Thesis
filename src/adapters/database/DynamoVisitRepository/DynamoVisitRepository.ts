import { DocumentClient } from "aws-sdk/clients/dynamodb";
import joi from "joi";
import dayjs from "dayjs";
import { NonVisitRequestedStatus } from "../../../domain/state";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { Paginated, Pagination } from "../../../shared/types/Pagination";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { Visit, VisitProps } from "../../models/Visit";
import { DynamoRepository } from "../DynamoRepository/DynamoRepository";
import { Visit as DomainVisit } from "../../../domain/Visit";
import { PrimitiveEntityValue } from "../../../shared/types/PrimitiveEntityValue";
import { Guest } from "../../models/Guest";

interface ChangedGuests {
  removed: PrimitiveEntityValue<Guest>[];
  unchanged: PrimitiveEntityValue<Guest>[];
  added: PrimitiveEntityValue<Guest>[];
}

export class DynamoVisitRepository extends DynamoRepository implements VisitRepository {
  private readonly separator = "#";

  private readonly baseKeySchema = {
    startDate: joi.string().isoDate().required(),
    id: joi.string().uuid().required(),
    type: joi.string().equal("visit").required()
  };

  constructor() {
    super("VISIT_TABLE");
  }

  private getFormattedPin(pin: string, date: string | Date) {
    return `${pin}${this.separator}${dayjs(date).format("DD-MM-YYYY")}`;
  }

  private static getInvitationExpirationDate(end: string) {
    return dayjs(end).add(DomainVisit.validityPeriod, "minutes").unix();
  }

  private createPinRecord(visit: Visit, pinCode: string) {
    const { start, end } = visit.timeframe.valueOf();

    return {
      id: visit.id,
      type: pinCode,
      pinAndBaseDate: this.getFormattedPin(pinCode!, start),
      expirationTime: DynamoVisitRepository.getInvitationExpirationDate(end)
    };
  }

  async create(visit: Visit): Promise<void> {
    const conditionExpression = "attribute_not_exists(id) and attribute_not_exists(#type)";

    const expressionAttributeNames = {
      "#type": "type"
    };

    await this.documentClient
      .transactWrite({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: visit.toPrimitive(),
              ConditionExpression: conditionExpression,
              ExpressionAttributeNames: expressionAttributeNames
            }
          },
          ...visit.guests
            .filter(({ type }) => type === "visitor")
            .map(({ pinCode }) => ({
              Put: {
                TableName: this.tableName,
                Item: this.createPinRecord(visit, pinCode!),
                ConditionExpression: conditionExpression,
                ExpressionAttributeNames: expressionAttributeNames
              }
            }))
        ]
      })
      .promise();
  }

  async findById(id: VisitId): Promise<Visit> {
    const { Item } = await this.documentClient
      .get({
        TableName: this.tableName,
        Key: { id, type: "visit" }
      })
      .promise();

    if (!Item) {
      throw new NotFoundException("Visit not found");
    }

    return Visit.create(Item as VisitProps);
  }

  async findByInvitationPinCode(pin: string): Promise<Visit> {
    const { Items } = await this.documentClient
      .query({
        TableName: this.tableName,
        IndexName: "byPinAndBaseDate",
        KeyConditionExpression: "pinAndBaseDate = :pinAndBaseDate",
        ExpressionAttributeValues: {
          ":pinAndBaseDate": this.getFormattedPin(pin, new Date())
        }
      })
      .promise();

    if (!Items || Items?.length === 0) {
      throw new NotFoundException("Visit not found");
    }

    return this.findById(Items[0].id);
  }

  private static mapItemsToVisits(items: DocumentClient.ItemList | undefined): Visit[] {
    return items!.map((visit) => Visit.create(visit as VisitProps));
  }

  private validateKeySchema = (cursor: unknown) => {
    const schema = joi
      .object({
        ...this.baseKeySchema,
        hostEmail: joi.string().email().required()
      })
      .required();

    const { error } = schema.validate(cursor);

    if (error) {
      throw new BadRequestException("The provided cursor is invalid");
    }
  };

  private getHostQueryProperties = (email: string, limit: number) => ({
    TableName: this.tableName,
    IndexName: "byHostEmailAndStartDate",
    KeyConditionExpression: "hostEmail = :hostEmail and startDate >= :startDate",
    Limit: limit,
    ExpressionAttributeValues: {
      ":hostEmail": email,
      ":startDate": new Date().toISOString()
    }
  });

  private async checkIfNextHostVisitExists(
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

  async findHostUpcomingVisits(email: string, pagination?: Pagination): Promise<Paginated<Visit>> {
    const paginationCursor = DynamoVisitRepository.getPaginationCursor(
      pagination?.cursor,
      (decodedCursor) => this.validateKeySchema(decodedCursor)
    );

    const { Items, LastEvaluatedKey } = await this.documentClient
      .query({
        ...this.getHostQueryProperties(email, this.getPaginationLimit(pagination?.limit)),
        ...(paginationCursor ? { ExclusiveStartKey: paginationCursor } : {})
      })
      .promise();

    const doesNextVisitExist = await this.checkIfNextHostVisitExists(email, LastEvaluatedKey);

    return {
      cursor: DynamoVisitRepository.encodeCursor(LastEvaluatedKey, doesNextVisitExist),
      items: DynamoVisitRepository.mapItemsToVisits(Items)
    };
  }

  private getAdminQueryProperties = (limit: number) => ({
    TableName: this.tableName,
    IndexName: "byTypeAndStartDate",
    KeyConditionExpression: "#type = :type and startDate >= :startDate",
    Limit: limit,
    ExpressionAttributeValues: {
      ":type": "visit",
      ":startDate": new Date().toISOString()
    },
    ExpressionAttributeNames: {
      "#type": "type"
    }
  });

  private async checkIfNextVisitExists(lastEvaluatedKey: DocumentClient.Key | undefined) {
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

  private validateAdminKeySchema = (cursor: unknown) => {
    const schema = joi.object(this.baseKeySchema).required();

    const { error } = schema.validate(cursor);

    if (error) {
      throw new BadRequestException("The provided cursor is invalid");
    }
  };

  async findAllUpcomingVisits(pagination?: Pagination): Promise<Paginated<Visit>> {
    const paginationCursor = DynamoVisitRepository.getPaginationCursor(
      pagination?.cursor,
      (decodedCursor) => this.validateAdminKeySchema(decodedCursor)
    );

    const { Items, LastEvaluatedKey } = await this.documentClient
      .query({
        ...this.getAdminQueryProperties(this.getPaginationLimit(pagination?.limit)),
        ...(paginationCursor ? { ExclusiveStartKey: paginationCursor } : {})
      })
      .promise();

    const doesNextVisitExist = await this.checkIfNextVisitExists(LastEvaluatedKey);

    return {
      cursor: DynamoVisitRepository.encodeCursor(LastEvaluatedKey, doesNextVisitExist),
      items: DynamoVisitRepository.mapItemsToVisits(Items)
    };
  }

  async setInvitationAcceptance(id: VisitId, invitationId: Uuid, accepted: boolean): Promise<void> {
    const visit = await this.findById(id);

    await this.documentClient
      .update({
        TableName: this.tableName,
        Key: {
          id,
          type: "visit"
        },
        UpdateExpression: "SET guests = :guests",
        ExpressionAttributeValues: {
          ":guests": visit.guests.map((guest) => {
            if (guest.invitationId === invitationId) {
              return { ...guest, accepted };
            }

            return guest;
          })
        }
      })
      .promise();
  }

  async cancelVisit(id: VisitId): Promise<void> {
    const status: NonVisitRequestedStatus = "canceled";

    await this.documentClient
      .update({
        TableName: this.tableName,
        Key: { id, type: "visit" },
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

  private async getVisitInvitations(id: VisitId) {
    const { Items } = await this.documentClient
      .query({
        TableName: this.tableName,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
          ":id": id
        }
      })
      .promise();

    if (!Items) {
      return [];
    }

    return Items.filter(({ type }) => type !== "visit");
  }

  async setVisitTimeframe(id: VisitId, timeframe: VisitTimeframe): Promise<void> {
    const invitations = await this.getVisitInvitations(id);

    const { start, end } = timeframe.valueOf();

    await this.documentClient
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: this.tableName,
              Key: {
                id,
                type: "visit"
              },
              UpdateExpression: "SET timeframe = :timeframe, startDate = :start",
              ExpressionAttributeValues: {
                ":timeframe": {
                  start,
                  end
                },
                ":start": start
              }
            }
          },
          ...invitations.map(({ type }) => ({
            Update: {
              TableName: this.tableName,
              Key: {
                id,
                type
              },
              UpdateExpression: "SET expirationTime = :expirationTime",
              ExpressionAttributeValues: {
                ":expirationTime": DynamoVisitRepository.getInvitationExpirationDate(end)
              }
            }
          }))
        ]
      })
      .promise();
  }

  private static getChangedGuests(
    oldGuests: PrimitiveEntityValue<Guest>[],
    newGuests: PrimitiveEntityValue<Guest>[]
  ) {
    return Array.from(new Set([...oldGuests, ...newGuests])).reduce<ChangedGuests>(
      (prev, current) => {
        if (!newGuests.includes(current)) {
          return { ...prev, removed: [...prev.removed, current] };
        }

        if (!oldGuests.includes(current)) {
          return { ...prev, added: [...prev.added, current] };
        }

        return { ...prev, unchanged: [...prev.unchanged, current] };
      },
      { removed: [], unchanged: [], added: [] }
    );
  }

  async setVisitGuests(id: VisitId, guests: PrimitiveEntityValue<Guest>[]): Promise<void> {
    const visit = await this.findById(id);

    const expressionAttributeNames = {
      "#type": "type"
    };

    const { removed, added } = DynamoVisitRepository.getChangedGuests(
      visit.guests.filter((guest) => guest.type === "visitor"),
      guests.filter((guest) => guest.type === "visitor")
    );

    await this.documentClient
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: this.tableName,
              Key: { id, type: "visit" },
              UpdateExpression: "SET #guests = :guests",
              ExpressionAttributeNames: {
                "#guests": "guests"
              },
              ConditionExpression: "id = :id",
              ExpressionAttributeValues: {
                ":guests": guests,
                ":id": id
              }
            }
          },
          ...added.map(({ pinCode }) => ({
            Put: {
              TableName: this.tableName,
              Item: this.createPinRecord(visit, pinCode!),
              ConditionExpression: "attribute_not_exists(id) and attribute_not_exists(#type)",
              ExpressionAttributeNames: expressionAttributeNames
            }
          })),
          ...removed.map(({ pinCode }) => ({
            Delete: {
              TableName: this.tableName,
              Key: {
                id: visit.id,
                type: pinCode
              },
              ConditionExpression: "attribute_exists(id) and attribute_exists(#type)",
              ExpressionAttributeNames: expressionAttributeNames
            }
          }))
        ]
      })
      .promise();
  }
}
