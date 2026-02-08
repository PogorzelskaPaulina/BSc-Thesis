/* eslint-disable max-classes-per-file */
import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { mockContext } from "../../../shared/tests/mockContext";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { loggerMock } from "../../../shared/tests/loggerMock";
import {
  testEmptyBodyRequest,
  testInvalidBodyRequest,
  testInvalidPathParams
} from "../../../shared/tests/httpTests";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";

class MockVisitEventStore {}

jest.mock("../../database/DynamoVisitEventStore/DynamoVisitEventStore", () => ({
  DynamoVisitEventStore: MockVisitEventStore
}));

jest.mock("../../../shared/logger/logger", () => ({
  logger: loggerMock
}));

const declineVisitInvitationCommandMock = jest.fn();

jest.mock(
  "../../../app/commands/declineVisitInvitationCommand/declineVisitInvitationCommand",
  () => ({
    declineVisitInvitationCommand: declineVisitInvitationCommandMock
  })
);

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./declineVisitInvitation";

describe("declineVisitInvitation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should throw BadRequestException if request has no body", async () => {
    await testEmptyBodyRequest(handler, '"Missing body or path params"', {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*"
    });
  });

  test("should throw BadRequestException if request body is invalid", async () => {
    await testInvalidBodyRequest(handler, '"\\"invitationId\\" is required"', {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*"
    });
  });

  test("should throw BadRequestException if request params are invalid", async () => {
    await testInvalidPathParams(handler, "", {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*"
    });
  });

  test("should call createVisitCommand with the correct parameters and return ID on success", async () => {
    // arrange
    const id = Uuid.generate();
    const event = {
      body: `{ "invitationId": "${id}" }`,
      pathParameters: { id }
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    const expectedInput = {
      visitId: id,
      invitationId: id
    };

    const expectedContext = {
      eventStore: new MockVisitEventStore()
    };

    // act
    await handler(event, mockContext, mockCallback);

    // assert
    expect(declineVisitInvitationCommandMock).toHaveBeenCalledWith(expectedInput, expectedContext);
  });
});
