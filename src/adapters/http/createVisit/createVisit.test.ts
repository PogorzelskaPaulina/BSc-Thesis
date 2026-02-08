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

class MockRoomRepo {}

jest.mock("../../database/DynamoRoomRepository/DynamoRoomRepository", () => ({
  DynamoRoomRepository: MockRoomRepo
}));

class MockRoomReservationRepo {}

jest.mock("../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository", () => ({
  DynamoRoomReservationRepository: MockRoomReservationRepo
}));

const visitId = "visitId";
const createVisitCommandMock = jest.fn(() => visitId);

jest.mock("../../../app/commands/createVisitCommand/createVisitCommand", () => ({
  createVisitCommand: createVisitCommandMock
}));

jest.mock("../../../shared/logger/logger", () => ({
  logger: loggerMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./createVisit";

describe("createVisit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMINS_GROUP_NAME = "AdminsGroup";
  });

  test("should throw BadRequestException if request has no body", async () => {
    await testEmptyBodyRequest(handler, '"Missing body"');
  });

  test("should throw BadRequestException if request body is invalid", async () => {
    await testInvalidBodyRequest(handler);
  });

  test("should call createVisitCommand with the correct parameters and return ID on success", async () => {
    // arrange
    const event = {
      body: '{ "title": "Visit", "timeframe": { "start": "2023-04-08T00:00:00.000Z", "end": "2023-04-09T00:00:00.000Z" }, "guestsEmails": ["guest@example.com"], "roomId": "123e4567-e89b-12d3-a456-426655440000" }',
      requestContext: { authorizer: { claims: { email: "host@example.com" } } }
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    const expectedInput = {
      title: "Visit",
      timeframe: { start: "2023-04-08T00:00:00.000Z", end: "2023-04-09T00:00:00.000Z" },
      guestsEmails: ["guest@example.com"],
      roomId: "123e4567-e89b-12d3-a456-426655440000",
      isAdmin: false,
      requesterEmail: "host@example.com"
    };

    const expectedContext = {
      attendeeRepository: new MockAttendeeRepo(),
      roomRepository: new MockRoomRepo(),
      visitEventStore: new MockVisitEventStore(),
      roomReservationRepository: new MockRoomReservationRepo()
    };

    // act
    const result = await handler(event, mockContext, mockCallback);

    // assert
    expect(createVisitCommandMock).toHaveBeenCalledWith(expectedInput, expectedContext);
    expect(result).toStrictEqual({ statusCode: 201, body: `{"id":"${visitId}"}` });
  });
});
