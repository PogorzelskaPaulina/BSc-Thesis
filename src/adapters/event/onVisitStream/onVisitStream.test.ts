import { DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";
import { AttributeMap, Converter } from "aws-sdk/clients/dynamodb";
import { mockCallback } from "../../../shared/tests/mockCallback";
import { mockContext } from "../../../shared/tests/mockContext";
import * as visitStreamHandler from "../../../app/event/visitStreamHandler/visitStreamHandler";
import { middlewareMock } from "../../../shared/tests/middlewareMock";
import { VisitEventStream, VisitEventStreamProps } from "../../models/VisitEventStream";

const getDynamoDbStream = (eventName: DynamoDBRecord["eventName"]) => ({
  eventID: "",
  eventName,
  eventVersion: "",
  eventSource: "aws:dynamodb",
  awsRegion: "",
  dynamodb: {
    ApproximateCreationDateTime: 1,
    Keys: {
      aggregateId: {
        S: "2ad342c5-6da9-4155-8414-76d86161cc16"
      },
      version: {
        N: "1"
      }
    },
    NewImage: {
      aggregateId: {
        S: "2ad342c5-6da9-4155-8414-76d86161cc16"
      },
      event: {
        M: {
          payload: {
            type: {
              S: "VISIT_CREATED"
            },
            M: {
              id: {
                S: "2ad342c5-6da9-4155-8414-76d86161cc16"
              },
              status: {
                S: "created"
              }
            }
          }
        }
      },
      isInitialEvent: {
        N: "1"
      },
      version: {
        N: "1"
      },
      timestamp: {
        S: "2023-03-18T04:19:34.339Z"
      }
    },
    SequenceNumber: "",
    SizeBytes: 1,
    StreamViewType: "NEW_IMAGE" as const
  },
  eventSourceARN: ""
});

const getVisitStreamFromDynamoImage = (image: Record<string, unknown>) =>
  VisitEventStream.create(<VisitEventStreamProps>Converter.unmarshall(<AttributeMap>image));

class MockEventBridgeEventBroker {}

jest.mock("../EventBridgeEventBroker/EventBridgeEventBroker", () => ({
  EventBridgeEventBroker: MockEventBridgeEventBroker
}));

jest.mock("../../../shared/utils/asyncMiddleware/asyncMiddleware", () => ({
  asyncMiddleware: middlewareMock
}));

const spy = jest.spyOn(visitStreamHandler, "visitStreamHandler").mockImplementation(jest.fn());

// WARNING: This import must be at the end
// eslint-disable-next-line import/first
import { handler } from "./onVisitStream";

describe("handler", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should parse DynamoDBStreamEvent and invoke visitStreamHandler with parsed streams", async () => {
    // arrange
    const dynamodbRecord: DynamoDBStreamEvent = {
      Records: [getDynamoDbStream("INSERT")]
    };

    // act
    await handler(dynamodbRecord, mockContext, mockCallback);

    // assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      {
        streams: [getVisitStreamFromDynamoImage(dynamodbRecord.Records[0].dynamodb?.NewImage!)]
      },
      { eventBroker: new MockEventBridgeEventBroker() }
    );
  });

  test("should filter out non-INSERT events from DynamoDBStreamEvent", async () => {
    // arrange
    const dynamodbRecord: DynamoDBStreamEvent = {
      Records: [
        getDynamoDbStream("REMOVE"),
        getDynamoDbStream("MODIFY"),
        getDynamoDbStream("INSERT")
      ]
    };

    // act
    await handler(dynamodbRecord, mockContext, mockCallback);

    // assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      {
        streams: [getVisitStreamFromDynamoImage(dynamodbRecord.Records[2].dynamodb?.NewImage!)]
      },
      { eventBroker: new MockEventBridgeEventBroker() }
    );
  });
});
