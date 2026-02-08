import { logger } from "../../logger/logger";
import { mockCallback } from "../../tests/mockCallback";
import { mockContext } from "../../tests/mockContext";
import { asyncMiddleware } from "./asyncMiddleware";

describe("asyncMiddleware", () => {
  test("should call the handler function with the correct parameters", async () => {
    // arrange
    jest.spyOn(logger, "info").mockImplementation();
    const mockHandler = jest.fn();
    const event = { someKey: "someValue" };

    // act
    await asyncMiddleware(mockHandler)(event, mockContext, mockCallback);

    // assert
    expect(mockHandler).toHaveBeenCalledWith(event, mockContext, mockCallback);
  });

  test("should log the event before calling the handler function", async () => {
    // arrange
    const mockLoggerInfo = jest.spyOn(logger, "info").mockImplementation();
    const mockHandler = jest.fn();
    const event = { someKey: "someValue" };

    // act
    await asyncMiddleware(mockHandler)(event, mockContext, mockCallback);

    // assert
    expect(mockLoggerInfo).toHaveBeenCalledWith({ event }, "Started lambda execution");
  });

  test("should rethrow any error thrown by the handler function", async () => {
    // arrange
    const mockLoggerError = jest.spyOn(logger, "error").mockImplementation();
    const mockHandler = jest.fn().mockRejectedValueOnce(new Error("test error"));
    const event = { someKey: "someValue" };

    // act, assert
    await expect(asyncMiddleware(mockHandler)(event, mockContext, mockCallback)).rejects.toThrow(
      "test error"
    );
    expect(mockLoggerError).toHaveBeenCalledWith(
      { err: new Error("test error") },
      "Error while executing lambda"
    );
  });
});
