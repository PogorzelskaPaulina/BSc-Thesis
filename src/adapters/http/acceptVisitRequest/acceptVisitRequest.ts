import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { acceptVisitRequestCommand } from "../../../app/commands/acceptVisitRequestCommand/acceptVisitRequestCommand";
import { EventStore } from "../../../ports/database/EventStore";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { validateVisitPathParams } from "../../../shared/utils/validateVisitPathParams/validateVisitPathParams";
import { DynamoVisitEventStore } from "../../database/DynamoVisitEventStore/DynamoVisitEventStore";
import { VisitEventStream } from "../../models/VisitEventStream";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";

const eventStore: EventStore<VisitEventStream> = new DynamoVisitEventStore();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  (event) => {
    validateVisitPathParams(event);

    return acceptVisitRequestCommand(
      {
        id: event.pathParameters!.id as string,
        isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME)),
        requesterEmail: event.requestContext.authorizer.claims.email
      },
      { eventStore }
    );
  },
  { successCode: HttpStatus.NO_CONTENT }
);
