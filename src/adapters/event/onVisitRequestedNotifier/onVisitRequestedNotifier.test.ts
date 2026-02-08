/* eslint-disable max-classes-per-file */
import { mockVisitRequestedEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitRequestedNotifierHandler from "../../../app/event/visitRequestedNotifierHandler/visitRequestedNotifierHandler";
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
import { handler } from "./onVisitRequestedNotifier";

describe("onVisitRequestedNotifier", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitRequestedNotifierHandler, "visitRequestedNotifierHandler")
      .mockImplementation(jest.fn());
    const visitEventStream = VisitEventStream.create(mockVisitRequestedEvent.detail);

    // act
    await handler(mockVisitRequestedEvent, mockContext, mockCallback);

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
