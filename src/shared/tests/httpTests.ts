import { Callback, Context, APIGatewayProxyResult } from "aws-lambda";
import { mockCallback } from "./mockCallback";
import { mockContext } from "./mockContext";

export const testEmptyBodyRequest = async <E = unknown, R = unknown>(
  handler: (event: E, context: Context, ctx: Callback) => Promise<R> | void,
  message?: string,
  headers?: APIGatewayProxyResult["headers"]
) => {
  // arrange
  const event = {} as E;

  // act
  const result = await handler(event, mockContext, mockCallback);

  // assert
  expect(result).toStrictEqual({
    body: message || expect.any(String),
    statusCode: 400,
    ...(headers ? { headers } : {})
  });
};

export const testInvalidBodyRequest = async <E = unknown, R = unknown>(
  handler: (event: E, context: Context, ctx: Callback) => Promise<R> | void,
  message?: string,
  headers?: APIGatewayProxyResult["headers"]
) => {
  // arrange
  const event = { body: '{ "invalid": "json" }' } as E;

  // act
  const result = await handler(event, mockContext, mockCallback);

  // assert
  expect(result).toStrictEqual({
    body: message || expect.any(String),
    statusCode: 400,
    ...(headers ? { headers } : {})
  });
};

export const testEmptyPathParams = async <E = unknown, R = unknown>(
  handler: (event: E, context: Context, ctx: Callback) => Promise<R> | void,
  message?: string
) => {
  // arrange
  const event = {} as E;

  // act
  const result = await handler(event, mockContext, mockCallback);

  // assert
  expect(result).toStrictEqual({ body: message || expect.any(String), statusCode: 400 });
};

export const testInvalidPathParams = async <E = unknown, R = unknown>(
  handler: (event: E, context: Context, ctx: Callback) => Promise<R> | void,
  message?: string,
  headers?: APIGatewayProxyResult["headers"]
) => {
  // arrange
  const event = { pathParameters: { id: "invalid" } } as E;

  // act
  const result = await handler(event, mockContext, mockCallback);

  // assert
  expect(result).toStrictEqual({
    body: message || expect.any(String),
    statusCode: 400,
    ...(headers ? { headers } : {})
  });
};
