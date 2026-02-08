/* eslint-disable max-classes-per-file */
import { mockVisitCreatedEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitCreatedHandler from "../../../app/event/visitCreatedHandler/visitCreatedHandler";
import { middlewareMock } from "../../../shared/tests/middlewareMock";
import { VisitEventStream } from "../../models/VisitEventStream";

class MockVisitRepo {}

jest.mock("../../database/DynamoVisitRepository/DynamoVisitRepository", () => ({
  DynamoVisitRepository: MockVisitRepo
}));

class MockAttendeeRepo {}

jest.mock("../../database/DynamoAttendeeRepository/DynamoAttendeeRepository", () => ({
  DynamoAttendeeRepository: MockAttendeeRepo
}));

class MockRoomRepo {}

jest.mock("../../database/DynamoRoomRepository/DynamoRoomRepository", () => ({
  DynamoRoomRepository: MockRoomRepo
}));

class MockRoomReservationRepo {}

jest.mock("../../database/DynamoRoomReservationRepository/DynamoRoomReservationRepository", () => ({
  DynamoRoomReservationRepository: MockRoomReservationRepo
}));

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitCreated";

describe("onVisitCreated", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitCreatedHandler, "visitCreatedHandler")
      .mockImplementation(jest.fn());
    const visitEventStream = VisitEventStream.create(mockVisitCreatedEvent.detail);

    // act
    await handler(mockVisitCreatedEvent, mockContext, mockCallback);

    // assert
    expect(spy).toHaveBeenNthCalledWith(
      1,
      {
        visitEventStream
      },
      {
        visitRepository: new MockVisitRepo(),
        roomRepository: new MockRoomRepo(),
        attendeeRepository: new MockAttendeeRepo(),
        roomReservationRepository: new MockRoomReservationRepo()
      }
    );
  });
});
