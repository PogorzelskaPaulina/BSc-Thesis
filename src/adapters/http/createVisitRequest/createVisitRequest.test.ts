/* eslint-disable max-classes-per-file */
import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { mockContext } from "../../../shared/tests/mockContext";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { loggerMock } from "../../../shared/tests/loggerMock";
import { testEmptyBodyRequest, testInvalidBodyRequest } from "../../../shared/tests/httpTests";

class MockVisitEventStore {}

jest.mock("../../database/DynamoVisitEventStore/DynamoVisitEventStore", () => ({
  DynamoVisitEventStore: MockVisitEventStore
}));

class MockAttendeeRepo {}

jest.mock("../../database/DynamoAttendeeRepository/DynamoAttendeeRepository", () => ({
  DynamoAttendeeRepository: MockAttendeeRepo
}));

const visitId = "visitId";
const createVisitRequestCommandMock = jest.fn(() => visitId);

jest.mock("../../../app/commands/createVisitRequestCommand/createVisitRequestCommand", () => ({
  createVisitRequestCommand: createVisitRequestCommandMock
}));

jest.mock("../../../shared/logger/logger", () => ({
  logger: loggerMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./createVisitRequest";

const expectedContext = {
  visitEventStore: new MockVisitEventStore(),
  attendeeRepository: new MockAttendeeRepo()
};

describe("createVisitRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should throw BadRequestException if request has no body", async () => {
    await testEmptyBodyRequest(handler, '"Missing body"');
  });

  test("should throw BadRequestException if request body is invalid", async () => {
    await testInvalidBodyRequest(handler);
  });

  test("should call createVisitRequestCommand with the correct parameters and return ID on success", async () => {
    // arrange
    const event = {
      body: '{"duration": 45, "guest": {"email": "guest@example.com", "name": "example name"}, "hostEmail": "host@example.com", "title": "Visit"}',
      requestContext: { authorizer: { claims: { email: "host@example.com" } } }
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    const expectedInput = {
      duration: 45,
      guest: { email: "guest@example.com", name: "example name" },
      hostEmail: "host@example.com",
      title: "Visit"
    };

    // act
    const result = await handler(event, mockContext, mockCallback);

    // assert
    expect(createVisitRequestCommandMock).toHaveBeenCalledWith(expectedInput, expectedContext);
    expect(result).toStrictEqual({ statusCode: 200, body: `{"id":"${visitId}"}` });
  });
});
