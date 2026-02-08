/* eslint-disable max-classes-per-file */
import { mockVisitCreatedEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitCreatedNotifierHandler from "../../../app/event/visitCreatedNotifierHandler/visitCreatedNotifierHandler";
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

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

jest.mock("../../notifications/notifiers", () => ({
  getNotifiers: () => []
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitCreatedNotifier";

describe("onVisitCreatedNotifier", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitCreatedNotifierHandler, "visitCreatedNotifierHandler")
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
        notifiers: []
      }
    );
  });
});
