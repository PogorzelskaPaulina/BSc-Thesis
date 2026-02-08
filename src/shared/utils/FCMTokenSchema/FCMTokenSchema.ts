import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { BadRequestException } from "../../exceptions/BadRequestException/BadRequestException";
import { schema } from "./schema";

export const validateAndGetFCMTokenSchema = (event: APIGatewayProxyWithCognitoAuthorizerEvent) => {
  const { body } = event;

  if (!body) {
    throw new BadRequestException("Missing body");
  }

  const parsedBody = JSON.parse(body);

  const { error } = schema.validate(parsedBody);

  if (error) {
    throw new BadRequestException(error.message);
  }

  return parsedBody.FCMToken as string;
};
