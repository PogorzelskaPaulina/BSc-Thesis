import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { getVisitRequestQuery } from "../../../app/query/getVisitRequestQuery/getVisitRequestQuery";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { DynamoVisitRequestRepository } from "../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { validateVisitPathParams } from "../../../shared/utils/validateVisitPathParams/validateVisitPathParams";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";

const visitRequestRepository: VisitRequestRepository = new DynamoVisitRequestRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware((event) => {
  validateVisitPathParams(event);

  return getVisitRequestQuery(
    {
      id: event.pathParameters!.id as string,
      isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME)),
      requesterEmail: event.requestContext.authorizer.claims.email
    },
    { visitRequestRepository }
  );
});
