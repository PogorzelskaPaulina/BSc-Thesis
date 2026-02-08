import { APIGatewayProxyEvent } from "aws-lambda";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { BadRequestException } from "../../exceptions/BadRequestException/BadRequestException";
import { validateVisitPathParams } from "./validateVisitPathParams";

describe("validateVisitPathParams", () => {
  test("should invalidate empty path params", () => {
    // act, assert
    expect(() => validateVisitPathParams({} as APIGatewayProxyEvent)).toThrow(BadRequestException);
  });

  test("should invalidate path params with invalid id", () => {
    // act, assert
    expect(() =>
      validateVisitPathParams({
        pathParameters: { id: "invalid" }
      } as unknown as APIGatewayProxyEvent)
    ).toThrow(BadRequestException);
  });

  test("should validate path params with valid id", () => {
    // arrange
    const id = VisitId.generate() as string;

    // act, assert
    expect(() =>
      validateVisitPathParams({
        pathParameters: { id }
      } as unknown as APIGatewayProxyEvent)
    ).not.toThrow();
  });
});
