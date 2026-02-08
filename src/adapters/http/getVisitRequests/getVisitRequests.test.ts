import { instanceToInstance, instanceToPlain } from "class-transformer";
import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { getMockRequest } from "../../../shared/tests/getMockRequest";
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

const visitRequests = [
  getMockRequest(),
  getMockRequest({ id: "id-2" }),
  getMockRequest({ id: "id-3" })
];
const getVisitRequestsQueryMock = jest.fn(() => ({ cursor: null, visitRequests }));

jest.mock("../../../app/query/getVisitRequestsQuery/getVisitRequestsQuery", () => ({
  getVisitRequestsQuery: getVisitRequestsQueryMock
}));

// eslint-disable-next-line import/first
import { handler } from "./getVisitRequests";

const mockEvent = {
  requestContext: {
    authorizer: {
      claims: {
        email: "test@example.com"
      }
    }
  },
  queryStringParameters: null
} as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

process.env.ADMINS_GROUP_NAME = "admins";

describe("getVisitRequests", () => {
  test("should throw BadRequestException if request url queryStringParameters are invalid", async () => {
    // arrange
    const event = {
      ...mockEvent,
      queryStringParameters: { limit: false, cursor: false }
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    // act
    const result = await handler(event, mockContext, mockCallback);

    // assert
    expect(result).toStrictEqual({ body: expect.any(String), statusCode: 400 });
  });

  test("should return the requests query result", async () => {
    // arrange
    const expectedResponseVisits = {
      cursor: null,
      visitRequests: instanceToPlain(
        visitRequests.map((visitRequest) => transformToPrimitive(instanceToInstance(visitRequest)))
      )
    };

    // act
    const result = await handler({ ...mockEvent }, mockContext, mockCallback);

    // assert
    expect(result).toStrictEqual({ body: JSON.stringify(expectedResponseVisits), statusCode: 200 });
  });
});
