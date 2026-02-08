import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { schema } from "./schema";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import {
  Input,
  requestAuditLogCommand
} from "../../../app/commands/requestAuditLogCommand/requestAuditLogCommand";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { DynamoVisitEventStore } from "../../database/DynamoVisitEventStore/DynamoVisitEventStore";
import { EventStore } from "../../../ports/database/EventStore";
import { VisitEventStream } from "../../models/VisitEventStream";
import { MailNotifier } from "../../notifications/MailNotifier/MailNotifier";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";

const eventStore: EventStore<VisitEventStream> = new DynamoVisitEventStore();
const attendeeRepository = new DynamoAttendeeRepository();
const visitRepository = new DynamoVisitRepository();
const mailNotifier = new MailNotifier(attendeeRepository, visitRepository);

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  async (event) => {
    const { body } = event;

    if (!body) {
      throw new BadRequestException("Missing body");
    }

    const parsedBody: Omit<Input, "isAdmin"> = JSON.parse(body);

    const { error } = schema.validate(parsedBody);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return requestAuditLogCommand(
      {
        isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME)),
        ...parsedBody,
        requesterEmail: event.requestContext.authorizer.claims.email,
        requestTime: event.requestContext.requestTimeEpoch
      },
      { eventStore, mailNotifier }
    );
  },
  {
    successCode: HttpStatus.NO_CONTENT
  }
);
