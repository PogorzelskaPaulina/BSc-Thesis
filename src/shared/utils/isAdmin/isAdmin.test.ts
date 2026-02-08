import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { isAdmin } from "./isAdmin";

const event = {
  requestContext: {
    authorizer: {
      claims: {
        "cognito:groups": "admin"
      }
    }
  }
} as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

const eventWithoutGroups = {
  requestContext: {
    authorizer: {
      claims: {}
    }
  }
} as unknown as APIGatewayProxyWithCognitoAuthorizerEvent;

describe("isAdmin", () => {
  it("should return true if the user is an admin", () => {
    // act
    const result = isAdmin(event, "admin");

    // assert
    expect(result).toBe(true);
  });

  it("should return false if the user is not an admin", () => {
    // act
    const result = isAdmin(event, "user");

    // assert
    expect(result).toBe(false);
  });

  it("should return false if the 'cognito:groups' claim is missing", () => {
    // act
    const result = isAdmin(eventWithoutGroups, "admin");

    // assert
    expect(result).toBe(false);
  });
});
