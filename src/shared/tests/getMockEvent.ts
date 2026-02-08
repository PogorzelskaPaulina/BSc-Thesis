import { mockEndISODate, mockStartISODate } from "./mockDates";

export const getMockEvent = <T>(detail: T) => ({
  version: "",
  id: "",
  source: "",
  account: "",
  time: "",
  region: "",
  resources: [],
  detail
});

export const mockVisitCreatedEvent = {
  ...getMockEvent({
    aggregateId: "id",
    event: {
      payload: {
        timeframe: {
          start: mockStartISODate,
          end: mockEndISODate
        },
        guests: [],
        hostEmail: "",
        id: "",
        title: "",
        roomId: "",
        status: "created" as const
      },
      type: "VISIT_CREATED" as const
    },
    isInitialEvent: 1,
    version: 1,
    timestamp: mockStartISODate,
    adminRead: 1
  }),
  "detail-type": "VISIT_CREATED" as const
};

export const mockVisitRequestedEvent = {
  ...getMockEvent({
    aggregateId: "id",
    event: {
      payload: {
        requestDate: mockStartISODate,
        duration: 45,
        guestEmail: "",
        hostEmail: "",
        id: "",
        title: "",
        status: "requested" as const
      },
      type: "VISIT_REQUESTED" as const
    },
    isInitialEvent: 1,
    version: 1,
    timestamp: mockStartISODate,
    adminRead: 1
  }),
  "detail-type": "VISIT_REQUESTED" as const
};

export const mockVisitInvitationAcceptedEvent = {
  ...getMockEvent({
    aggregateId: "id",
    event: {
      payload: {
        id: "",
        invitationId: ""
      },
      type: "VISIT_INVITATION_ACCEPTED" as const
    },
    isInitialEvent: 0,
    version: 2,
    timestamp: mockStartISODate,
    adminRead: 1
  }),
  "detail-type": "VISIT_INVITATION_ACCEPTED" as const
};

export const mockVisitCanceledEvent = {
  ...getMockEvent({
    aggregateId: "id",
    event: {
      payload: {
        id: ""
      },
      type: "VISIT_CANCELED" as const
    },
    isInitialEvent: 0,
    version: 2,
    timestamp: mockStartISODate,
    adminRead: 1
  }),
  "detail-type": "VISIT_CANCELED" as const
};

export const mockVisitRequestAcceptedEvent = {
  ...getMockEvent({
    aggregateId: "id",
    event: {
      payload: {
        id: ""
      },
      type: "VISIT_REQUEST_ACCEPTED" as const
    },
    isInitialEvent: 0,
    version: 2,
    timestamp: mockStartISODate,
    adminRead: 1
  }),
  "detail-type": "VISIT_REQUEST_ACCEPTED" as const
};

export const mockVisitRequestDeclinedEvent = {
  ...getMockEvent({
    aggregateId: "id",
    event: {
      payload: {
        id: ""
      },
      type: "VISIT_REQUEST_DECLINED" as const
    },
    isInitialEvent: 0,
    version: 2,
    timestamp: mockStartISODate,
    adminRead: 1
  }),
  "detail-type": "VISIT_REQUEST_DECLINED" as const
};
