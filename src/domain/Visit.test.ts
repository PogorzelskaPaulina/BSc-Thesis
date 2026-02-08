import { Visit } from "./Visit";
import { VisitEvent } from "./events/events";
import { VisitId } from "./valueObjects/VisitId/VisitId";
import { VisitTimeframe } from "./valueObjects/VisitTimeframe/VisitTimeframe";
import { mockEndISODate, mockStartISODate } from "../shared/tests/mockDates";
import { BadRequestException } from "../shared/exceptions/BadRequestException/BadRequestException";
import { NotFoundException } from "../shared/exceptions/NotFoundException/NotFoundException";

jest.mock("uuid", () => ({ v4: () => "uuid" }));

const mockVisitCreatedDomainEvent: VisitEvent = {
  type: "VISIT_CREATED",
  payload: {
    id: VisitId.generate(),
    status: "created",
    hostEmail: "email@email.com",
    guests: [],
    timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
    title: "title",
    room: undefined
  }
};

const mockVisitData = {
  id: "id",
  hostEmail: "host@email.com",
  status: "created" as const,
  timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
  title: "title"
};

describe("Visit", () => {
  test("should return correct create visit event type", () => {
    // act
    const event = Visit.create(
      "title",
      { start: mockStartISODate, end: mockEndISODate },
      "email@email.com",
      []
    );

    // assert
    expect(event).toStrictEqual(mockVisitCreatedDomainEvent);
  });

  test("should throw error when accepting the invitation that does not exist", () => {
    // arrange
    const visit = new Visit({
      ...mockVisitData,
      guests: []
    });

    // act, assert
    expect(() => visit.acceptVisitInvitation("non-existing-visit")).toThrow(NotFoundException);
  });

  test("should throw error when accepting invitation that was already accepted", () => {
    // arrange
    const visit = new Visit({
      ...mockVisitData,
      guests: [
        {
          invitationId: "invitationId",
          accepted: true,
          email: "guest@email.com",
          type: "visitor",
          checkedIn: false,
          pinCode: ""
        }
      ]
    });

    // act, assert
    expect(() => visit.acceptVisitInvitation("invitationId")).toThrow(BadRequestException);
  });

  test("should accept invitation when not accepted existing invitation id is provided", () => {
    // arrange
    const guest = {
      invitationId: "invitationId",
      accepted: null,
      email: "guest@email.com",
      type: "visitor" as const,
      checkedIn: false,
      pinCode: ""
    };
    const visit = new Visit({
      ...mockVisitData,
      guests: [guest]
    });

    // act
    const event = visit.acceptVisitInvitation("invitationId");

    // assert
    expect(event).toStrictEqual({
      type: "VISIT_INVITATION_ACCEPTED",
      payload: {
        id: mockVisitData.id,
        invitationId: guest.invitationId
      }
    });
  });

  test("should throw error when declining the invitation that does not exist", () => {
    // arrange
    const visit = new Visit({
      ...mockVisitData,
      guests: []
    });

    // act, assert
    expect(() => visit.declineVisitInvitation("non-existing-visit")).toThrow(NotFoundException);
  });

  test("should throw error when declining invitation that was already declined", () => {
    // arrange
    const visit = new Visit({
      ...mockVisitData,
      guests: [
        {
          invitationId: "invitationId",
          accepted: false,
          email: "guest@email.com",
          type: "visitor",
          checkedIn: false,
          pinCode: ""
        }
      ]
    });

    // act, assert
    expect(() => visit.declineVisitInvitation("invitationId")).toThrow(BadRequestException);
  });

  test("should decline invitation when not declined existing invitation id is provided", () => {
    // arrange
    const guest = {
      invitationId: "invitationId",
      accepted: null,
      email: "guest@email.com",
      type: "visitor" as const,
      checkedIn: false,
      pinCode: ""
    };
    const visit = new Visit({
      ...mockVisitData,
      guests: [guest]
    });

    // act
    const event = visit.declineVisitInvitation("invitationId");

    // assert
    expect(event).toStrictEqual({
      type: "VISIT_INVITATION_DECLINED",
      payload: {
        id: mockVisitData.id,
        invitationId: guest.invitationId
      }
    });
  });

  test("should cancel visit", () => {
    // arrange
    const visit = new Visit({ ...mockVisitData, guests: [] });

    // act
    const event = visit.cancelVisit();

    // assert
    expect(event).toStrictEqual({
      type: "VISIT_CANCELED",
      payload: {
        id: mockVisitData.id
      }
    });
  });
});
