import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { getVisitQuery } from "../../../app/query/getVisitQuery/getVisitQuery";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { validateVisitPathParams } from "../../../shared/utils/validateVisitPathParams/validateVisitPathParams";

const visitRepository: VisitRepository = new DynamoVisitRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware((event) => {
  validateVisitPathParams(event);

  return getVisitQuery(
    {
      id: event.pathParameters!.id as string,
      isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME)),
      requesterEmail: event.requestContext.authorizer.claims.email
    },
    { visitRepository }
  );
});
