import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { instanceToPlain, instanceToInstance } from "class-transformer";
import { getMockRequest } from "../../../shared/tests/getMockRequest";
import { testEmptyPathParams, testInvalidPathParams } from "../../../shared/tests/httpTests";
import { loggerMock } from "../../../shared/tests/loggerMock";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import { transformToPrimitive } from "../../../shared/utils/transformToPrimitive/transformToPrimitive";

class MockRequestRepository {}

jest.mock("../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository", () => ({
  DynamoVisitRequestRepository: MockRequestRepository
}));

jest.mock("../../../shared/logger/logger", () => ({
  logger: loggerMock
}));

const request = getMockRequest();
const getVisitRequestQueryMock = jest.fn(() => request);

jest.mock("../../../app/query/getVisitRequestQuery/getVisitRequestQuery", () => ({
  getVisitRequestQuery: getVisitRequestQueryMock
}));

// eslint-disable-next-line import/first
import { handler } from "./getVisitRequest";

const mockEvent = {
  requestContext: {
    authorizer: {
      claims: {
        email: "test@example.com"
      }
    }
  }
} as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

process.env.ADMINS_GROUP_NAME = "admins";

describe("getVisitRequest", () => {
  test("should throw BadRequestException if request params are empty", async () => {
    await testEmptyPathParams(handler);
  });

  test("should throw BadRequestException if request params are invalid", async () => {
    await testInvalidPathParams(handler);
  });

  test("should return the visit query result when all parameters are valid", async () => {
    // arrange
    const expectedResponseRequest = instanceToPlain(
      transformToPrimitive(instanceToInstance(request))
    );
    const mockPathParameters = {
      id: "12345678-1234-1234-1234-1234567890ab"
    };

    // act
    const result = await handler(
      { ...mockEvent, pathParameters: mockPathParameters },
      mockContext,
      mockCallback
    );

    // assert
    expect(result).toStrictEqual({
      body: JSON.stringify(expectedResponseRequest),
      statusCode: 200
    });
  });
});
