import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { getVisitRequestsQuery } from "../../../app/query/getVisitRequestsQuery/getVisitRequestsQuery";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { DynamoVisitRequestRepository } from "../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { schema } from "../getVisits/schema";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { Pagination } from "../../../shared/types/Pagination";

const visitRequestRepository: VisitRequestRepository = new DynamoVisitRequestRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  (event) => {
    const { error } = schema.validate(event.queryStringParameters);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const queryParams = event.queryStringParameters as unknown as Pagination;

    return getVisitRequestsQuery(
      {
        requesterEmail: event.requestContext.authorizer.claims.email,
        isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME)),
        ...queryParams
      },
      { visitRequestRepository }
    );
  },
  { resourcesName: "visitRequests" }
);
