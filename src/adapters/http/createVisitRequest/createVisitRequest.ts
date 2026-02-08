import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { createVisitRequestCommand } from "../../../app/commands/createVisitRequestCommand/createVisitRequestCommand";
import { EventStore } from "../../../ports/database/EventStore";
import { DynamoVisitEventStore } from "../../database/DynamoVisitEventStore/DynamoVisitEventStore";
import { Input } from "../../../app/commands/createVisitRequestCommand/createVisitRequestCommand";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { VisitEventStream } from "../../models/VisitEventStream";
import { schema } from "./schema";

const visitEventStore: EventStore<VisitEventStream> = new DynamoVisitEventStore();
const attendeeRepository: AttendeeRepository = new DynamoAttendeeRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  async (event) => {
    const { body } = event;

    if (!body) {
      throw new BadRequestException("Missing body");
    }

    const parsedBody: Input = JSON.parse(body);

    const { error } = schema.validate(parsedBody);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const result = await createVisitRequestCommand(parsedBody, {
      visitEventStore,
      attendeeRepository
    });

    return { id: result };
  }
);
