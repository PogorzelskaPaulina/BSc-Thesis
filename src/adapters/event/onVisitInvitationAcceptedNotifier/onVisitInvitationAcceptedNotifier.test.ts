/* eslint-disable max-classes-per-file */
import { mockVisitInvitationAcceptedEvent } from "../../../shared/tests/getMockEvent";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitInvitationAcceptedNotifierHandler from "../../../app/event/visitInvitationAcceptedNotifierHandler/visitInvitationAcceptedNotifierHandler";
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
import { handler } from "./onVisitInvitationAcceptedNotifier";

describe("onVisitInvitationAcceptedNotifier", () => {
  test("should invoke handler with correct arguments", async () => {
    // arrange
    const spy = jest
      .spyOn(visitInvitationAcceptedNotifierHandler, "visitInvitationAcceptedNotifierHandler")
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
        notifiers: []
      }
    );
  });
});
