/* eslint-disable max-classes-per-file */
import { mockVisitCanceledEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitCanceledHandler from "../../../app/event/visitCanceledHandler/visitCanceledHandler";
import { middlewareMock } from "../../../shared/tests/middlewareMock";
import { VisitEventStream } from "../../models/VisitEventStream";
import { VisitCanceled } from "../../../domain/events/events";

class MockVisitRepo {}
class MockRoomReservationRepo {}

jest.mock("../../database/DynamoVisitRepository/DynamoVisitRepository", () => ({
  DynamoVisitRepository: MockVisitRepo
}));

jest.mock("../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository", () => ({
  DynamoRoomReservationRepository: MockRoomReservationRepo
}));

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitCanceled";

describe("onVisitCanceled", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitCanceledHandler, "visitCanceledHandler")
      .mockImplementation(jest.fn());
    const visitEventStream = VisitEventStream.create<VisitCanceled>(mockVisitCanceledEvent.detail);

    // act
    await handler(mockVisitCanceledEvent, mockContext, mockCallback);

    // assert
    expect(spy).toHaveBeenNthCalledWith(
      1,
      {
        visitEventStream
      },
      {
        visitRepository: new MockVisitRepo(),
        roomReservationRepository: new MockRoomReservationRepo()
      }
    );
  });
});
