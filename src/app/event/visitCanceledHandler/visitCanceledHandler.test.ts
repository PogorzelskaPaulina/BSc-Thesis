import { createMock } from "ts-auto-mock";
import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import { VisitCanceled } from "../../../domain/events/events";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { visitCanceledHandler, Input, Context } from "./visitCanceledHandler";

const input: Input = {
  visitEventStream: VisitEventStream.create<VisitCanceled>({
    aggregateId: "",
    version: 2,
    timestamp: "",
    event: {
      type: "VISIT_CANCELED",
      payload: {
        id: ""
      }
    }
  })
};

const visitRepository = createMock<VisitRepository>({
  cancelVisit: jest.fn()
});

const roomReservationRepository = createMock<RoomReservationRepository>({
  findByVisitIdOrNull: jest.fn()
});

const context: Context = {
  visitRepository,
  roomReservationRepository
};

describe("visitCanceledHandler", () => {
  test("should update visit entity with accepted invitation", async () => {
    // act
    await visitCanceledHandler(input, context);

    // assert
    expect(visitRepository.cancelVisit).toHaveBeenCalledWith(
      input.visitEventStream.event.payload.id
    );
  });
});
