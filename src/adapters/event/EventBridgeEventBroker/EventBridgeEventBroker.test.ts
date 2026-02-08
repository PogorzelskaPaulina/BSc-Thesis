import EventBridge from "aws-sdk/clients/eventbridge";
import { EventBridgeEventBroker } from "./EventBridgeEventBroker";

const putEventsMock = jest.fn().mockImplementation(() => {
  return { promise: jest.fn() };
});

jest.mock("aws-sdk/clients/eventbridge");

(EventBridge as unknown as jest.Mock).mockImplementation(() => ({
  putEvents: putEventsMock
}));

const getEventBroker = (isEnvSetup: boolean = true) => {
  if (isEnvSetup) {
    process.env.EVENT_BUS = "name";
  }

  return new EventBridgeEventBroker();
};

describe("EventBridgeEventBroker", () => {
  afterEach(() => {
    putEventsMock.mockClear();
  });

  test("should not create event broker if name is not supplied", () => {
    expect(() => getEventBroker(false)).toThrow();
  });

  test("should put events on event broker", async () => {
    const eventBroker = getEventBroker();

    await eventBroker.publishEvents([{ type: "type", payload: {}, source: "source" }]);

    expect(putEventsMock).toHaveBeenCalledTimes(1);
  });
});
