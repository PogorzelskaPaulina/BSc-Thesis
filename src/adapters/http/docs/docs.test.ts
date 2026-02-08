import { APIGatewayProxyEvent } from "aws-lambda";
import APIGateway from "aws-sdk/clients/apigateway";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";

jest.mock("aws-sdk/clients/apigateway");
const mockedApiGatewayClient = jest.mocked(APIGateway);

process.env.API_GATEWAY_ID = "id";
process.env.STAGE = "stage";

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./docs";

describe("swaggerPageHandler", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should generate Swagger page body successfully", async () => {
    // arrange
    const mockGetExport = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        body: "dummySwaggerSpec"
      })
    });
    mockedApiGatewayClient.prototype.getExport = mockGetExport;

    // act
    const result = await handler({} as APIGatewayProxyEvent, mockContext, mockCallback)!;

    // assert
    expect(result.statusCode).toBe(200);
    const headers = result.headers!;
    expect(headers["Content-Type"]).toBe("text/html");
    expect(result.body).toMatchInlineSnapshot(`
      "<!DOCTYPE html>
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
                      spec: dummySwaggerSpec
                  });
                  </script>
              </body>
              </html>"
    `);
    expect(mockGetExport).toHaveBeenCalledWith({
      exportType: "swagger",
      restApiId: "id",
      stageName: "stage",
      accepts: "application/json",
      parameters: {
        extensions: "apigateway"
      }
    });
  });

  test("should throw an error if API Gateway export fails", async () => {
    // arrange
    const mockGetExport = jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error("Export failed"))
    });
    mockedApiGatewayClient.prototype.getExport = mockGetExport;

    // act, assert
    await expect(handler({} as APIGatewayProxyEvent, mockContext, mockCallback)).rejects.toThrow(
      "Export failed"
    );
    expect(mockGetExport).toHaveBeenCalledWith({
      exportType: "swagger",
      restApiId: "id",
      stageName: "stage",
      accepts: "application/json",
      parameters: {
        extensions: "apigateway"
      }
    });
  });
});
