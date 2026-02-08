import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { getUserQuery } from "../../../app/query/getUserQuery/getUserQuery";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";

const attendeeRepository = new DynamoAttendeeRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(async (event) =>
  getUserQuery({ email: event.requestContext.authorizer.claims.email }, { attendeeRepository })
);
