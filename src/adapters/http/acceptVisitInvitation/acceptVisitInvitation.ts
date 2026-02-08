import { APIGatewayProxyHandler } from "aws-lambda";
import { acceptVisitInvitationCommand } from "../../../app/commands/acceptVisitInvitationCommand/acceptVisitInvitationCommand";
import { EventStore } from "../../../ports/database/EventStore";
import { validateVisitInvitationRequest } from "../../../shared/utils/validateVisitInvitationRequest/validateVisitInvitationRequest";
import { DynamoVisitEventStore } from "../../database/DynamoVisitEventStore/DynamoVisitEventStore";
import { VisitEventStream } from "../../models/VisitEventStream";
import { httpMiddleware } from "../httpMiddleware/httpMiddleware";
import { HttpStatus } from "../../../shared/HttpStatus/HttpStatus";

const visitEventStore: EventStore<VisitEventStream> = new DynamoVisitEventStore();

export const handler: APIGatewayProxyHandler = httpMiddleware(
  async (event) => {
    const { visitId, invitationId } = validateVisitInvitationRequest(event);

    return acceptVisitInvitationCommand(
      {
        visitId,
        invitationId
      },
      { eventStore: visitEventStore }
    );
  },
  {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    successCode: HttpStatus.NO_CONTENT
  }
);
