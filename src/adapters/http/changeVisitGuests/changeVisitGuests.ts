import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { EventStore } from "../../../ports/database/EventStore";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { DynamoVisitEventStore } from "../../database/DynamoVisitEventStore/DynamoVisitEventStore";
import { VisitEventStream } from "../../models/VisitEventStream";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { schema } from "./schema";
import { changeVisitGuestsCommand } from "../../../app/commands/changeVisitGuestsCommand/changeVisitGuestsCommand";
import { validateVisitPathParams } from "../../../shared/utils/validateVisitPathParams/validateVisitPathParams";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";

const visitEventStore: EventStore<VisitEventStream> = new DynamoVisitEventStore();
const attendeeRepository: AttendeeRepository = new DynamoAttendeeRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  async (event) => {
    const { pathParameters, body } = event;

    if (!pathParameters) {
      throw new BadRequestException("Missing params");
    }

    if (!body) {
      throw new BadRequestException("Missing body");
    }

    const parsedBody = JSON.parse(body);

    const { error } = schema.validate(parsedBody);

    if (error) {
      throw new BadRequestException(error.message);
    }

    validateVisitPathParams(event);

    return changeVisitGuestsCommand(
      {
        ...parsedBody,
        id: pathParameters.id as string,
        requesterEmail: event.requestContext.authorizer.claims.email,
        isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME))
      },
      {
        visitEventStore,
        attendeeRepository
      }
    );
  },
  { successCode: HttpStatus.NO_CONTENT }
);
