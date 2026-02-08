/* eslint-disable max-classes-per-file */
import { mockVisitInvitationAcceptedEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitInvitationAcceptedHandler from "../../../app/event/visitInvitationAcceptedHandler/visitInvitationAcceptedHandler";
import { middlewareMock } from "../../../shared/tests/middlewareMock";
import { VisitEventStream } from "../../models/VisitEventStream";

class MockVisitRepo {}

jest.mock("../../database/DynamoVisitRepository/DynamoVisitRepository", () => ({
  DynamoVisitRepository: MockVisitRepo
}));

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitInvitationAccepted";

describe("onVisitInvitationAccepted", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitInvitationAcceptedHandler, "visitInvitationAcceptedHandler")
      .mockImplementation(jest.fn());
    const visitEventStream = VisitEventStream.create(mockVisitInvitationAcceptedEvent.detail);

    // act
    await handler(mockVisitInvitationAcceptedEvent, mockContext, mockCallback);

    // assert
    expect(spy).toHaveBeenNthCalledWith(
      1,
      {
        visitEventStream
      },
      {
        visitRepository: new MockVisitRepo()
      }
    );
  });
});
