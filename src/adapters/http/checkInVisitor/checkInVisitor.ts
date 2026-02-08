import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { schema } from "./schema";
import {
  Input,
  checkInVisitorCommand
} from "../../../app/commands/checkInVisitorCommand/checkInVisitorCommand";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { EventStore } from "../../../ports/database/EventStore";
import { VisitEventStream } from "../../models/VisitEventStream";
import { DynamoVisitEventStore } from "../../database/DynamoVisitEventStore/DynamoVisitEventStore";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";

const eventStore: EventStore<VisitEventStream> = new DynamoVisitEventStore();
const visitRepository: VisitRepository = new DynamoVisitRepository();

const regex = /^\d{6}$/;

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  async (event) => {
    const { body } = event;

    if (!body) {
      throw new BadRequestException("Missing body");
    }

    const parsedBody: Input = JSON.parse(body);

    const { error } = schema.validate(parsedBody);

    if (error || !regex.test(parsedBody.pinCode)) {
      throw new BadRequestException(error?.message || "Provided pin code is invalid");
    }

    return checkInVisitorCommand(parsedBody, { eventStore, visitRepository });
  },
  { successCode: HttpStatus.NO_CONTENT }
);
