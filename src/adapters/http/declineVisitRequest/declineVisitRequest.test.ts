/* eslint-disable max-classes-per-file */
import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { mockContext } from "../../../shared/tests/mockContext";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { loggerMock } from "../../../shared/tests/loggerMock";
import { Uuid } from "../../../shared/utils/Uuid/Uuid";
import { testEmptyPathParams, testInvalidPathParams } from "../../../shared/tests/httpTests";

class MockVisitEventStore {}

jest.mock("../../database/DynamoVisitEventStore/DynamoVisitEventStore", () => ({
  DynamoVisitEventStore: MockVisitEventStore
}));

jest.mock("../../../shared/logger/logger", () => ({
  logger: loggerMock
}));

const declineVisitRequestCommandMock = jest.fn();

jest.mock("../../../app/commands/declineVisitRequestCommand/declineVisitRequestCommand", () => ({
  declineVisitRequestCommand: declineVisitRequestCommandMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./declineVisitRequest";

const id = Uuid.generate();
const email = "email@email.com";
const adminsGroup = "AdminsGroup";

const getEvent = (includeAdmin: boolean) =>
  ({
    pathParameters: { id },
    requestContext: {
      authorizer: {
        claims: {
          email,
          "cognito:groups": includeAdmin ? adminsGroup : undefined
        }
      }
    }
  } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent);

const expectedContext = {
  eventStore: new MockVisitEventStore()
};

describe("declineVisitRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should throw BadRequestException if request params are empty", async () => {
    await testEmptyPathParams(handler);
  });

  test("should throw BadRequestException if request params are invalid", async () => {
    await testInvalidPathParams(handler);
  });

  test("should call acceptVisitRequestCommand with the correct privileges and admin access", async () => {
    // arrange
    const event = getEvent(true);
    process.env.ADMINS_GROUP_NAME = adminsGroup;

    const expectedInput = {
      id,
      isAdmin: true,
      requesterEmail: email
    };

    // act
    await handler(event, mockContext, mockCallback);

    // assert
    expect(declineVisitRequestCommandMock).toHaveBeenCalledWith(expectedInput, expectedContext);
  });

  test("should call acceptVisitRequestCommand with the correct parameters", async () => {
    // arrange
    const event = getEvent(false);

    const expectedInput = {
      id,
      isAdmin: false,
      requesterEmail: email
    };

    // act
    await handler(event, mockContext, mockCallback);

    // assert
    expect(declineVisitRequestCommandMock).toHaveBeenCalledWith(expectedInput, expectedContext);
  });
});
