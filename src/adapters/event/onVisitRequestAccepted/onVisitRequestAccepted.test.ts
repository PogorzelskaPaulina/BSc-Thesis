/* eslint-disable max-classes-per-file */
import { mockVisitRequestAcceptedEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitRequestAcceptedHandler from "../../../app/event/visitRequestAcceptedHandler/visitRequestAcceptedHandler";
import { middlewareMock } from "../../../shared/tests/middlewareMock";
import { VisitEventStream } from "../../models/VisitEventStream";

class MockVisitRepo {}

jest.mock("../../database/DynamoVisitRepository/DynamoVisitRepository", () => ({
  DynamoVisitRepository: MockVisitRepo
}));

class MockVisitRequestRepo {}

jest.mock("../../database/DynamoVisitRequestRepository/DynamoVisitRequestRepository", () => ({
  DynamoVisitRequestRepository: MockVisitRequestRepo
}));

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitRequestAccepted";

describe("visitRequestAccepted", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitRequestAcceptedHandler, "visitRequestAcceptedHandler")
      .mockImplementation(jest.fn());
    const visitEventStream = VisitEventStream.create(mockVisitRequestAcceptedEvent.detail);

    // act
    await handler(mockVisitRequestAcceptedEvent, mockContext, mockCallback);

    // assert
    expect(spy).toHaveBeenNthCalledWith(
      1,
      {
        visitEventStream
      },
      {
        visitRepository: new MockVisitRepo(),
        visitRequestRepository: new MockVisitRequestRepo()
      }
    );
  });
});
