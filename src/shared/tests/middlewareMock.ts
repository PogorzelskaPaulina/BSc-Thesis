import { Callback, Context } from "aws-lambda";

export const middlewareMock =
  (handler: (event: unknown, ctx: Context, callback: Callback) => unknown) =>
  (event: unknown, ctx: Context, callback: Callback) =>
    handler(event, ctx, callback);
