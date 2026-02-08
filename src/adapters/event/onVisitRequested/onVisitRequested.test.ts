/* eslint-disable max-classes-per-file */
import { mockVisitRequestedEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitRequestedHandler from "../../../app/event/visitRequestedHandler/visitRequestedHandler";
import { middlewareMock } from "../../../shared/tests/middlewareMock";
import { VisitEventStream } from "../../models/VisitEventStream";

class MockRequestRepo {}

jest.mock("../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository", () => ({
  DynamoVisitRequestRepository: MockRequestRepo
}));

class MockAttendeeRepo {}

jest.mock("../../database/DynamoAttendeeRepository/DynamoAttendeeRepository", () => ({
  DynamoAttendeeRepository: MockAttendeeRepo
}));

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitRequested";

describe("onVisitRequested", () => {
  beforeAll(() => {});

  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitRequestedHandler, "visitRequestedHandler")
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
        requestRepository: new MockRequestRepo(),
        attendeeRepository: new MockAttendeeRepo()
      }
    );
  });
});
