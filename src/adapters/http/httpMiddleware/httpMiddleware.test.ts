import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { loggerMock } from "../../../shared/tests/loggerMock";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import { transformToPrimitive } from "../../../shared/utils/transformToPrimitive/transformToPrimitive";
import { httpMiddleware } from "./httpMiddleware"; //

jest.mock("../../../shared/logger/logger", () => ({
  logger: loggerMock
}));

describe("httpMiddleware", () => {
  const mockHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should handle successful execution and return a response", async () => {
    // Arrange
    const mockEvent = {};
    const mockResult = { message: "Success" };
    mockHandler.mockResolvedValueOnce(mockResult);

    // Act
    const middleware = httpMiddleware(mockHandler);
    const result = await middleware(mockEvent, mockContext, mockCallback);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, mockCallback);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(mockResult)
    });
  });

  test("should handle HttpException and return a response with the corresponding status code", async () => {
    // Arrange
    const mockEvent = {};
    const mockHttpException = new BadRequestException("Bad request");
    mockHandler.mockRejectedValueOnce(mockHttpException);

    // Act
    const middleware = httpMiddleware(mockHandler);
    const result = await middleware(mockEvent, mockContext, mockCallback);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, mockCallback);
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify("Bad request")
    });
  });

  test("should handle other errors and return an internal server error response", async () => {
    // Arrange
    const mockEvent = {};
    const mockError = new Error("Some error");
    mockHandler.mockRejectedValueOnce(mockError);

    // Act
    const middleware = httpMiddleware(mockHandler);
    const result = await middleware(mockEvent, mockContext, mockCallback);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, mockCallback);
    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify("Internal server error")
    });
  });

  test("should allow custom success code", async () => {
    // Arrange
    const mockEvent = {};
    const mockResult = { message: "Success" };
    mockHandler.mockResolvedValueOnce(mockResult);

    // Act
    const middleware = httpMiddleware(mockHandler, { successCode: 201 });
    const result = await middleware(mockEvent, mockContext, mockCallback);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, mockCallback);
    expect(result).toEqual({
      statusCode: 201,
      body: JSON.stringify(mockResult)
    });
  });

  test("should transform single entity to primitive value", async () => {
    // Arrange
    const mockEvent = {};
    const mockResult = { status: "created" };
    const expectedResult = transformToPrimitive(mockResult);
    mockHandler.mockResolvedValueOnce(mockResult);

    // Act
    const middleware = httpMiddleware(mockHandler, {
      successCode: 201,
      resourcesName: "resourceName"
    });
    const result = await middleware(mockEvent, mockContext, mockCallback);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, mockCallback);
    expect(result).toEqual({
      statusCode: 201,
      body: JSON.stringify(expectedResult)
    });
  });

  test("should transform paginated entities to primitive values", async () => {
    // Arrange
    const resourcesName = "statuses";
    const mockEvent = {};
    const mockResult = {
      cursor: null,
      [resourcesName]: [{ status: "created" }, { status: "canceled" }]
    };
    const expectedResult = {
      ...mockResult,
      statuses: mockResult[resourcesName].map((result) => transformToPrimitive(result))
    };
    mockHandler.mockResolvedValueOnce(mockResult);

    // Act
    const middleware = httpMiddleware(mockHandler, {
      successCode: 201,
      resourcesName
    });
    const result = await middleware(mockEvent, mockContext, mockCallback);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, mockCallback);
    expect(result).toEqual({
      statusCode: 201,
      body: JSON.stringify(expectedResult)
    });
  });

  test("should handle undefined or null and return response", async () => {
    // Arrange
    const mockEvent = {};
    const mockResult = undefined;
    mockHandler.mockResolvedValueOnce(mockResult);

    // Act
    const middleware = httpMiddleware(mockHandler);
    const result = await middleware(mockEvent, mockContext, mockCallback);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, mockCallback);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(mockResult)
    });
  });

  test("should return correct headers when passed", async () => {
    // Arrange
    const mockEvent = {};
    const mockResult = { message: "Success" };
    const headers = {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*"
    };
    mockHandler.mockResolvedValueOnce(mockResult);

    // Act
    const middleware = httpMiddleware(mockHandler, { headers });
    const result = await middleware(mockEvent, mockContext, mockCallback);

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent, mockContext, mockCallback);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(mockResult),
      headers
    });
  });
});
