import { APIGatewayProxyHandler } from "aws-lambda";
import APIGateway from "aws-sdk/clients/apigateway";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";

const apiGatewayClient = new APIGateway();

const getApiGatewaySpec = async () => {
  const details = await apiGatewayClient
    .getExport({
      exportType: "swagger",
      restApiId: checkForEnv(process.env.API_GATEWAY_ID),
      stageName: checkForEnv(process.env.STAGE),
      accepts: "application/json",
      parameters: {
        extensions: "apigateway"
      }
    })
    .promise();

  return details.body?.toString()!;
};

const generateSwaggerPageBody = (spec: string) => `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Swagger</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
            <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@3/favicon-32x32.png" sizes="32x32" />
            <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@3/favicon-16x16.png" sizes="16x16" />
        </head>
        <body>
            <div id="swagger"></div>
            <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
            <script>
              SwaggerUIBundle({
                dom_id: '#swagger',
                deepLinking: true,
                spec: ${spec}
            });
            </script>
        </body>
        </html>`;

export const handler: APIGatewayProxyHandler = async () => {
  const spec = await getApiGatewaySpec();

  return {
    statusCode: HttpStatus.OK,
    headers: {
      "Content-Type": "text/html"
    },
    body: generateSwaggerPageBody(spec)
  };
};
