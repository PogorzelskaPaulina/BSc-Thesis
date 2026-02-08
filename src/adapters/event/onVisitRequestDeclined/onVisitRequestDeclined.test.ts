/* eslint-disable max-classes-per-file */
import { mockVisitRequestDeclinedEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitRequestDeclinedHandler from "../../../app/event/visitRequestDeclinedHandler/visitRequestDeclinedHandler";
import { middlewareMock } from "../../../shared/tests/middlewareMock";
import { VisitEventStream } from "../../models/VisitEventStream";

class MockVisitRequestRepo {}

jest.mock("../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository", () => ({
  DynamoVisitRequestRepository: MockVisitRequestRepo
}));

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitRequestDeclined";

describe("onVisitRequestDeclined", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitRequestDeclinedHandler, "visitRequestDeclinedHandler")
      .mockImplementation(jest.fn());
    const visitEventStream = VisitEventStream.create(mockVisitRequestDeclinedEvent.detail);

    // act
    await handler(mockVisitRequestDeclinedEvent, mockContext, mockCallback);

    // assert
    expect(spy).toHaveBeenNthCalledWith(
      1,
      {
        visitEventStream
      },
      {
        visitRequestRepository: new MockVisitRequestRepo()
      }
    );
  });
});
