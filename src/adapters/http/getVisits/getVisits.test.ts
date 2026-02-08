import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { instanceToInstance, instanceToPlain } from "class-transformer";
import { getMockVisit } from "../../../shared/tests/getMockVisit";
import { loggerMock } from "../../../shared/tests/loggerMock";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import { transformToPrimitive } from "../../../shared/utils/transformToPrimitive/transformToPrimitive";

class MockVisitRepository {}

jest.mock("../../database/DynamoVisitRepository/DynamoVisitRepository", () => ({
  DynamoVisitRepository: MockVisitRepository
}));

jest.mock("../../../shared/logger/logger", () => ({
  logger: loggerMock
}));

const visits = [getMockVisit(), getMockVisit({ id: "id-2" }), getMockVisit({ id: "id-3" })];
const getVisitsQueryMock = jest.fn(() => ({ cursor: null, visits }));

jest.mock("../../../app/query/getVisitsQuery/getVisitsQuery", () => ({
  getVisitsQuery: getVisitsQueryMock
}));

// eslint-disable-next-line import/first
import { handler } from "./getVisits";

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

describe("handler", () => {
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

  test("should return the visits query result", async () => {
    // arrange
    const expectedResponseVisits = {
      cursor: null,
      visits: instanceToPlain(
        visits.map((visit) => transformToPrimitive(instanceToInstance(visit)))
      )
    };

    // act
    const result = await handler({ ...mockEvent }, mockContext, mockCallback);

    // assert
    expect(result).toStrictEqual({ body: JSON.stringify(expectedResponseVisits), statusCode: 200 });
  });
});
