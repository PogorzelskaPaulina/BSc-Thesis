import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import {
  createVisitCommand,
  Input
} from "../../../app/commands/createVisitCommand/createVisitCommand";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { EventStore } from "../../../ports/database/EventStore";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";
import { DynamoAttendeeRepository } from "../../database/DynamoAttendeeRepository/DynamoAttendeeRepository";
import { DynamoRoomRepository } from "../../database/DynamoRoomRepository/DynamoRoomRepository";
import { DynamoRoomReservationRepository } from "../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository";
import { DynamoVisitEventStore } from "../../database/DynamoVisitEventStore/DynamoVisitEventStore";
import { VisitEventStream } from "../../models/VisitEventStream";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { schema } from "./schema";
import { isAdmin } from "../../../shared/utils/isAdmin/isAdmin";
import { checkForEnv } from "../../../shared/utils/checkForEnv/checkForEnv";

const visitEventStore: EventStore<VisitEventStream> = new DynamoVisitEventStore();
const attendeeRepository: AttendeeRepository = new DynamoAttendeeRepository();
const roomRepository: RoomRepository = new DynamoRoomRepository();
const roomReservationRepository: RoomReservationRepository = new DynamoRoomReservationRepository();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = httpMiddleware(
  async (event) => {
    const { body } = event;

    if (!body) {
      throw new BadRequestException("Missing body");
    }

    const parsedBody: Omit<Input, "requesterEmail"> = JSON.parse(body);

    const { error } = schema.validate(parsedBody);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const result = await createVisitCommand(
      {
        ...parsedBody,
        requesterEmail: event.requestContext.authorizer.claims.email,
        isAdmin: isAdmin(event, checkForEnv(process.env.ADMINS_GROUP_NAME))
      },
      { visitEventStore, attendeeRepository, roomRepository, roomReservationRepository }
    );

    return { id: result };
  },
  { successCode: HttpStatus.CREATED }
);
