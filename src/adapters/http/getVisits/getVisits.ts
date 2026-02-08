import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { getVisitsQuery } from "../../../app/query/getVisitsQuery/getVisitsQuery";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { Pagination } from "../../../shared/types/Pagination";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { DynamoVisitRepository } from "../../database/DynamoVisitRepository/DynamoVisitRepository";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { schema } from "./schema";

const visitRepository: VisitRepository = new DynamoVisitRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  (event) => {
    const { error } = schema.validate(event.queryStringParameters);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const queryParams = event.queryStringParameters as unknown as Pagination;

    return getVisitsQuery(
      {
        isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME)),
        requesterEmail: event.requestContext.authorizer.claims.email,
        ...queryParams
      },
      { visitRepository }
    );
  },
  { resourcesName: "visits" }
);
