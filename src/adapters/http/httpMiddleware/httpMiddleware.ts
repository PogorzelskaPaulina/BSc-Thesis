import { APIGatewayProxyResult, Callback, Context } from "aws-lambda";
import { instanceToPlain, instanceToInstance } from "class-transformer";
import { HttpException } from "../../../shared/exceptions/HttpException/HttpException";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { logger } from "../../../shared/logger/logger";
import { transformToPrimitive } from "../../../shared/utils/transformToPrimitive/transformToPrimitive";
import { NotModifiedException } from "../../../shared/exceptions/NotModifiedException/NotModifiedException";

interface Options {
  successCode?: number;
  resourcesName?: string;
  headers?: APIGatewayProxyResult["headers"];
}

function makeResponse(
  message: unknown,
  statusCode: number,
  headers?: APIGatewayProxyResult["headers"]
): APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify(message),
    ...(headers ? { headers } : {})
  };
}

function isPaginatedResource(
  instance: unknown,
  resourcesName: string
): instance is Record<string, unknown> {
  const typedInstance = instance as Record<string, unknown>;

  return typedInstance?.cursor !== undefined || Array.isArray(typedInstance[resourcesName]);
}

function getPrimitiveVersion(instance: unknown, resourcesName?: string) {
  if (!instance) {
    return undefined;
  }

  if (!resourcesName) {
    return transformToPrimitive(instance);
  }

  if (isPaginatedResource(instance, resourcesName)) {
    return {
      cursor: instance.cursor,
      [resourcesName]: (instance[resourcesName] as unknown[]).map((entity) =>
        transformToPrimitive(entity)
      )
    };
  }

  return transformToPrimitive(instance);
}

export const httpMiddleware =
  <E = unknown, R = unknown, C extends Context = Context>(
    handler: (event: E, context: C, ctx: Callback) => Promise<R>,
    options: Options = {}
  ) =>
  async (event: E, context: C, ctx: Callback) => {
    logger.info({ event }, "Started lambda execution");

    try {
      const result = await handler(event, context, ctx);

      const instance = instanceToInstance(result);

      const primitiveInstance = getPrimitiveVersion(instance, options?.resourcesName);

      return makeResponse(
        instanceToPlain(primitiveInstance),
        options?.successCode || HttpStatus.OK,
        options?.headers
      );
    } catch (err) {
      if (err instanceof NotModifiedException) {
        logger.info({ event }, "Not modified");

        return makeResponse(null, err.code, options?.headers);
      }

      if (err instanceof HttpException) {
        logger.info({ err }, "User error while executing lambda");

        return makeResponse(err.message, err.code, options?.headers);
      }

      logger.error({ err }, "Error while executing lambda");
      return makeResponse(
        "Internal server error",
        HttpStatus.INTERNAL_SERVER_ERROR,
        options?.headers
      );
    }
  };
