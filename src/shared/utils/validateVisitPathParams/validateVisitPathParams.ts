import { APIGatewayProxyEvent } from "aws-lambda";
import { BadRequestException } from "../../exceptions/BadRequestException/BadRequestException";
import { schema } from "./schema";

export const validateVisitPathParams = (event: APIGatewayProxyEvent) => {
  const { pathParameters } = event;

  if (!pathParameters) {
    throw new BadRequestException("Missing params");
  }

  const { error } = schema.validate(pathParameters);

  if (error) {
    throw new BadRequestException(error.message);
  }
};
