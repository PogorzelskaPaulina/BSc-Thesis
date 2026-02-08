import { VisitEventStream } from "../../../adapters/models/VisitEventStream";
import {
  VisitCanceled,
  VisitCreated,
  VisitInvitationAccepted,
  VisitInvitationDeclined
} from "../../../domain/events/events";
import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { mockEndISODate, mockStartISODate } from "../../tests/mockDates";
import { constructState } from "./constructState";

// arrange
const visitCreated = VisitEventStream.create<VisitCreated>({
  aggregateId: "",
  version: 1,
  isInitialEvent: 1,
  timestamp: "",
  event: {
    type: "VISIT_CREATED",
    payload: {
      id: "id",
      status: "created",
      title: "title",
      timeframe: { start: mockStartISODate, end: mockEndISODate },
      hostEmail: "host@email.com",
      guests: [
        {
          accepted: null,
          email: "guest@email.com",
          invitationId: "invitationId",
          type: "visitor",
          checkedIn: false,
          pinCode: "000000"
        },
        {
          accepted: null,
          email: "guest2@email.com",
          invitationId: "invitationId2",
          type: "visitor",
          checkedIn: false,
          pinCode: "000000"
        }
      ]
    }
  }
});

const visitInvitationAccepted = VisitEventStream.create<VisitInvitationAccepted>({
  aggregateId: "",
  version: 2,
  timestamp: "",
  event: {
    type: "VISIT_INVITATION_ACCEPTED",
    payload: {
      id: "id",
      invitationId: "invitationId"
    }
  }
});

const visitInvitationDeclined = VisitEventStream.create<VisitInvitationDeclined>({
  aggregateId: "",
  version: 2,
  timestamp: "",
  event: {
    type: "VISIT_INVITATION_DECLINED",
    payload: {
      id: "id",
      invitationId: "invitationId"
    }
  }
});

const visitCanceled = VisitEventStream.create<VisitCanceled>({
  aggregateId: "",
  version: 2,
  timestamp: "",
  event: {
    type: "VISIT_CANCELED",
    payload: {
      id: "id"
    }
  }
});

describe("constructState", () => {
  test("should return correct state after visit created event", () => {
    // act
    const state = constructState([visitCreated]);

    // assert
    expect(state).toEqual({
      id: "id",
      status: "created",
      title: "title",
      timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
      hostEmail: "host@email.com",
      guests: [
        {
          accepted: null,
          email: "guest@email.com",
          invitationId: "invitationId",
          checkedIn: false,
          pinCode: "000000",
          type: "visitor"
        },
        {
          accepted: null,
          email: "guest2@email.com",
          invitationId: "invitationId2",
          checkedIn: false,
          pinCode: "000000",
          type: "visitor"
        }
      ]
    });
  });

  test("should return correct state after visit invitation accepted", () => {
    // act
    const state = constructState([visitCreated, visitInvitationAccepted]);

    // assert
    expect(state).toEqual({
      id: "id",
      status: "created",
      title: "title",
      timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
      hostEmail: "host@email.com",
      guests: [
        {
          accepted: true,
          email: "guest@email.com",
          invitationId: "invitationId",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        },
        {
          accepted: null,
          email: "guest2@email.com",
          invitationId: "invitationId2",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        }
      ]
    });
  });

  test("should return correct state after visit invitation declined", () => {
    // act
    const state = constructState([visitCreated, visitInvitationDeclined]);

    // assert
    expect(state).toEqual({
      id: "id",
      status: "created",
      title: "title",
      timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
      hostEmail: "host@email.com",
      guests: [
        {
          accepted: false,
          email: "guest@email.com",
          invitationId: "invitationId",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        },
        {
          accepted: null,
          email: "guest2@email.com",
          invitationId: "invitationId2",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        }
      ]
    });
  });

  test("should return correct state after the same visit invitation accepted and later declined", () => {
    // act
    const state = constructState([visitCreated, visitInvitationAccepted, visitInvitationDeclined]);

    // assert
    expect(state).toEqual({
      id: "id",
      status: "created",
      title: "title",
      timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
      hostEmail: "host@email.com",
      guests: [
        {
          accepted: false,
          email: "guest@email.com",
          invitationId: "invitationId",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        },
        {
          accepted: null,
          email: "guest2@email.com",
          invitationId: "invitationId2",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        }
      ]
    });
  });

  test("should return correct state after visit cancelation", () => {
    // act
    const state = constructState([visitCreated, visitCanceled]);

    // assert
    expect(state).toEqual({
      id: "id",
      status: "canceled",
      title: "title",
      timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
      hostEmail: "host@email.com",
      guests: [
        {
          accepted: null,
          email: "guest@email.com",
          invitationId: "invitationId",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        },
        {
          accepted: null,
          email: "guest2@email.com",
          invitationId: "invitationId2",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        }
      ]
    });
  });

  test("should return correct state when unknown event is passed", () => {
    // act
    const state = constructState([visitCreated, {} as VisitEventStream]);

    // assert
    expect(state).toEqual({
      id: "id",
      status: "created",
      title: "title",
      timeframe: VisitTimeframe.from(mockStartISODate, mockEndISODate),
      hostEmail: "host@email.com",
      guests: [
        {
          accepted: null,
          email: "guest@email.com",
          invitationId: "invitationId",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        },
        {
          accepted: null,
          email: "guest2@email.com",
          invitationId: "invitationId2",
          checkedIn: false,
          type: "visitor",
          pinCode: "000000"
        }
      ]
    });
  });
});
