/* eslint-disable max-classes-per-file */
import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { instanceToPlain } from "class-transformer";
import { loggerMock } from "../../../shared/tests/loggerMock";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import { mockEndISODate, mockStartISODate } from "../../../shared/tests/mockDates";
import { Room } from "../../models/Room";

class MockRoomRepository {}

jest.mock("../../database/DynamoRoomRepository/DynamoRoomRepository", () => ({
  DynamoRoomRepository: MockRoomRepository
}));

class MockRoomReservationRepository {}

jest.mock("../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository", () => ({
  DynamoRoomReservationRepository: MockRoomReservationRepository
}));

jest.mock("../../../shared/logger/logger", () => ({
  logger: loggerMock
}));

const room = Room.create({ id: "id", name: "name", isAvailable: true });

const getRoomsQueryMock = jest.fn(() => ({ cursor: null, rooms: [room] }));

jest.mock("../../../app/query/getRoomsQuery/getRoomsQuery", () => ({
  getRoomsQuery: getRoomsQueryMock
}));

// eslint-disable-next-line import/first
import { handler } from "./getRooms";

describe("getRooms", () => {
  test("should throw BadRequestException if request url queryStringParameters are empty", async () => {
    // arrange
    const event = {} as APIGatewayProxyWithCognitoAuthorizerEvent;

    // act
    const result = await handler(event, mockContext, mockCallback);

    // assert
    expect(result).toStrictEqual({ body: expect.any(String), statusCode: 400 });
  });

  test("should throw BadRequestException if request url queryStringParameters are invalid", async () => {
    // arrange
    const event = {
      queryStringParameters: { startDate: "invalid-date", endDate: "invalid-date" }
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    // act
    const result = await handler(event, mockContext, mockCallback);

    // assert
    expect(result).toStrictEqual({ body: expect.any(String), statusCode: 400 });
  });

  test("should return the visit query result when all parameters are valid", async () => {
    // arrange
    const expectedResponseRooms = { cursor: null, rooms: [instanceToPlain(room)] };
    // arrange
    const event = {
      queryStringParameters: { startDate: mockStartISODate, endDate: mockEndISODate }
    } as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

    // act
    const result = await handler(event, mockContext, mockCallback);

    // assert
    expect(result).toStrictEqual({ body: JSON.stringify(expectedResponseRooms), statusCode: 200 });
  });
});
