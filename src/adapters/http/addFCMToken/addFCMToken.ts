import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { addFCMTokenCommand } from "../../../app/commands/addFCMTokenCommand/addFCMTokenCommand";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { validateAndGetFCMTokenSchema } from "../../../shared/utils/FCMTokenSchema/FCMTokenSchema";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { SNSNotifier } from "../../notifications/SNSNotifier/SNSNotifier";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";

const attendeeRepository = new DynamoAttendeeRepository();
const visitRepository = new DynamoVisitRepository();
const snsNotifier = new SNSNotifier(attendeeRepository, visitRepository);

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  async (event) => {
    return addFCMTokenCommand(
      {
        email: event.requestContext.authorizer.claims.email,
        FCMToken: validateAndGetFCMTokenSchema(event)
      },
      { attendeeRepository, snsNotifier }
    );
  },
  { successCode: HttpStatus.NO_CONTENT }
);
