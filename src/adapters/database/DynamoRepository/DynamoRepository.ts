import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { dynamoDbTestConfig } from "../../../shared/tests/dynamoDbTestConfig";
import { Pagination } from "../../../shared/types/Pagination";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";

export abstract class DynamoRepository {
  protected readonly defaultLimit = 25;

  private readonly maxLimit = 50;

  protected readonly documentClient = new DocumentClient(
    process.env.JEST_WORKER_ID ? dynamoDbTestConfig : {}
  );

  protected readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = checkForEnv(process.env[tableName]);
  }

  protected getPaginationLimit = (limit?: string) => {
    if (!limit) {
      return this.maxLimit;
    }

    const parsedLimit = parseInt(limit, 10);

    if (parsedLimit > this.maxLimit) {
      throw new BadRequestException(`You cannot request more than ${this.maxLimit} items.`);
    }

    return parsedLimit;
  };

  protected static encodeCursor = (
    cursor: DocumentClient.Key | undefined,
    nextItemExists: boolean
  ) => {
    if (nextItemExists && cursor) {
      return encodeURIComponent(JSON.stringify(cursor));
    }

    return null;
  };

  protected static decodeCursor = (encodedCursor: string) => {
    try {
      return JSON.parse(decodeURIComponent(encodedCursor));
    } catch (err: unknown) {
      throw new BadRequestException("The provided cursor is invalid");
    }
  };

  protected static getPaginationCursor = (
    cursor: Pagination["cursor"],
    validation: (decodedCursor: string) => void
  ) => {
    if (!cursor) {
      return undefined;
    }

    const decodedCursor = DynamoRepository.decodeCursor(cursor);

    validation(decodedCursor);

    return decodedCursor;
  };
}
