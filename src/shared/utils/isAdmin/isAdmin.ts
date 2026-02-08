import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";

export const isAdmin = (
  event: APIGatewayProxyWithCognitoAuthorizerEvent,
  adminsGroupName: string
): boolean => {
  const cognitoGroups = event.requestContext.authorizer.claims["cognito:groups"];

  if (!cognitoGroups) {
    return false;
  }

  return cognitoGroups.split(",").includes(adminsGroupName);
};
