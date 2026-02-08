import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { Attendee, AttendeeProps } from "../../models/Attendee";
import { DynamoRepository } from "../DynamoRepository/DynamoRepository";
import { SNSPlatformEndpoint } from "../../../ports/database/AttendeeRepository";

export class DynamoAttendeeRepository extends DynamoRepository implements AttendeeRepository {
  constructor() {
    super("ATTENDEE_TABLE");
  }

  async create(attendee: Attendee): Promise<void> {
    await this.documentClient
      .put({
        TableName: this.tableName,
        Item: attendee.toPrimitive(),
        ConditionExpression: "attribute_not_exists(email)"
      })
      .promise();
  }

  private getItemByEmail(email: string) {
    return this.documentClient
      .get({
        TableName: this.tableName,
        Key: { email }
      })
      .promise();
  }

  async findByEmail(email: string): Promise<Attendee> {
    const { Item } = await this.getItemByEmail(email);

    if (!Item) {
      throw new NotFoundException("Attendee not found");
    }

    return Attendee.create(Item as AttendeeProps);
  }

  async findByEmailOrNull(email: string): Promise<Attendee | null> {
    const { Item } = await this.getItemByEmail(email);

    return Item ? Attendee.create(Item as AttendeeProps) : null;
  }

  async addPlatformEndpoint(email: string, platformEndpoint: SNSPlatformEndpoint): Promise<void> {
    await this.documentClient
      .update({
        TableName: this.tableName,
        Key: {
          email
        },
        UpdateExpression:
          "SET snsPlatformEndpoints = list_append(snsPlatformEndpoints, :platformEndpoint)",
        ExpressionAttributeValues: {
          ":platformEndpoint": [platformEndpoint]
        }
      })
      .promise();
  }

  async removePlatformEndpoint(email: string, platformEndpointIndex: number): Promise<void> {
    await this.documentClient
      .update({
        TableName: this.tableName,
        Key: {
          email
        },
        UpdateExpression: `REMOVE snsPlatformEndpoints[${platformEndpointIndex}]`
      })
      .promise();
  }
}
