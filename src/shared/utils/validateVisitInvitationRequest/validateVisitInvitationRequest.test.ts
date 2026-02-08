import { APIGatewayProxyEvent } from "aws-lambda";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { BadRequestException } from "../../exceptions/BadRequestException/BadRequestException";
import { Uuid } from "../Uuid/Uuid";
import { validateVisitInvitationRequest } from "./validateVisitInvitationRequest";

const visitId = VisitId.generate();
const invitationId = Uuid.generate();

describe("validateVisitInvitationRequest", () => {
  test("should throw bad request exception when body is empty", () => {
    // arrange
    const event = { body: null } as APIGatewayProxyEvent;

    // act, assert
    expect(() => validateVisitInvitationRequest(event)).toThrow(BadRequestException);
  });

  test("should throw bad request exception when body is invalid but pathParameters are valid", () => {
    // arrange
    const event = {
      body: '{"invitationId": "id"}',
      pathParameters: { id: visitId }
    } as unknown as APIGatewayProxyEvent;

    // act, assert
    expect(() => validateVisitInvitationRequest(event)).toThrow(BadRequestException);
  });

  test("should throw bad request exception when path params are empty", () => {
    // arrange
    const event = { pathParameters: null } as APIGatewayProxyEvent;

    // act, assert
    expect(() => validateVisitInvitationRequest(event)).toThrow(BadRequestException);
  });

  test("should throw bad request exception when path params are invalid but body is valid", () => {
    // arrange
    const event = {
      body: `{ "invitationId": "${invitationId}" }`,
      pathParameters: { id: "id" }
    } as unknown as APIGatewayProxyEvent;

    // act, assert
    expect(() => validateVisitInvitationRequest(event)).toThrow(BadRequestException);
  });

  test("should throw bad request exception when path params and body are invalid", () => {
    // arrange
    const event = {
      body: `{ "invitationId": "id" }`,
      pathParameters: { id: "id" }
    } as unknown as APIGatewayProxyEvent;

    // act, assert
    expect(() => validateVisitInvitationRequest(event)).toThrow(BadRequestException);
  });

  test("should return parsed body and path params when correct event is passed", () => {
    // arrange
    const event = {
      body: `{ "invitationId": "${invitationId}" }`,
      pathParameters: { id: visitId }
    } as unknown as APIGatewayProxyEvent;

    // act
    const parsedData = validateVisitInvitationRequest(event);

    // assert
    expect(parsedData).toStrictEqual({
      visitId,
      invitationId
    });
  });
});
