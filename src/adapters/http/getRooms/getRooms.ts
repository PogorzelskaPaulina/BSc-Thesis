import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { schema } from "./schema";
import { getRoomsQuery, Input } from "../../../app/query/getRoomsQuery/getRoomsQuery";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { DynamoRoomRepository } from "../../database/DynamoRoomRepository/DynamoRoomRepository";
import { DynamoRoomReservationRepository } from "../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";

const roomRepository = new DynamoRoomRepository();
const roomReservationRepository = new DynamoRoomReservationRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  (event) => {
    const { error } = schema.validate(event.queryStringParameters);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const queryParams = event.queryStringParameters as unknown as Input;

    return getRoomsQuery(queryParams, { roomRepository, roomReservationRepository });
  },
  { resourcesName: "rooms" }
);
