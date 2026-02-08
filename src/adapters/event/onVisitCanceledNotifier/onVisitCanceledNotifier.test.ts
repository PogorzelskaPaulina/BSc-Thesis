/* eslint-disable max-classes-per-file */
import { mockVisitCanceledEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitCanceledNotifierHandler from "../../../app/event/visitCanceledNotifierHandler/visitCanceledNotifierHandler";
import { middlewareMock } from "../../../shared/tests/middlewareMock";
import { VisitEventStream } from "../../models/VisitEventStream";
import { VisitCanceled } from "../../../domain/events/events";

class MockVisitRepo {}

jest.mock("../../database/DynamoVisitRepository/DynamoVisitRepository", () => ({
  DynamoVisitRepository: MockVisitRepo
}));

class MockAttendeeRepo {}

jest.mock("../../database/DynamoAttendeeRepository/DynamoAttendeeRepository", () => ({
  DynamoAttendeeRepository: MockAttendeeRepo
}));

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

jest.mock("../../notifications/notifiers", () => ({
  getNotifiers: () => []
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitCanceledNotifier";

describe("onVisitCanceledNotifier", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitCanceledNotifierHandler, "visitCanceledNotifierHandler")
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
        notifiers: []
      }
    );
  });
});
