import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { cancelVisitCommand } from "../../../app/commands/cancelVisitCommand/cancelVisitCommand";
import { EventStore } from "../../../ports/database/EventStore";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { validateVisitPathParams } from "../../../shared/utils/validateVisitPathParams/validateVisitPathParams";
import { DynamoVisitEventStore } from "../../database/DynamoVisitEventStore/DynamoVisitEventStore";
import { VisitEventStream } from "../../models/VisitEventStream";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";

const visitEventStore: EventStore<VisitEventStream> = new DynamoVisitEventStore();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  async (event) => {
    validateVisitPathParams(event);

    return cancelVisitCommand(
      {
        visitId: event.pathParameters!.id as string,
        isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME)),
        requesterEmail: event.requestContext.authorizer.claims.email
      },
      { eventStore: visitEventStore }
    );
  },
  { successCode: HttpStatus.NO_CONTENT }
);
