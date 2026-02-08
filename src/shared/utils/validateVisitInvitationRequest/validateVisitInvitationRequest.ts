import { APIGatewayProxyEvent } from "aws-lambda";
import { schema } from "./schema";
import { BadRequestException } from "../../exceptions/BadRequestException/BadRequestException";
import { validateVisitPathParams } from "../validateVisitPathParams/validateVisitPathParams";

export const validateVisitInvitationRequest = (event: APIGatewayProxyEvent) => {
  const { body } = event;

  if (!body) {
    throw new BadRequestException("Missing body or path params");
  }

  const parsedBody: { invitationId: string } = JSON.parse(body);

  const { error } = schema.validate(parsedBody);

  if (error) {
    throw new BadRequestException(error.message);
  }

  validateVisitPathParams(event);

  return {
    invitationId: parsedBody.invitationId,
    visitId: event.pathParameters!.id as string
  };
};
