import { VisitEventStream, VisitEventStreamProps } from "../../../adapters/models/VisitEventStream";
import { mockStartISODate } from "../../tests/mockDates";
import { getLatestEventVersion } from "./getLatestEventVersion";

describe("getLatestEventVersion", () => {
  test("should return the maximum version from the list of events", () => {
    const events: VisitEventStream[] = [
      VisitEventStream.create({
        aggregateId: "id",
        event: {} as VisitEventStreamProps["event"],
        isInitialEvent: 1,
        timestamp: mockStartISODate,
        version: 1
      }),
      VisitEventStream.create({
        aggregateId: "id",
        event: {} as VisitEventStreamProps["event"],
        timestamp: mockStartISODate,
        version: 2
      }),
      VisitEventStream.create({
        aggregateId: "id",
        event: {} as VisitEventStreamProps["event"],
        timestamp: mockStartISODate,
        version: 3
      })
    ];

    const latestVersion = getLatestEventVersion(events);

    expect(latestVersion).toEqual(3);
  });

  test("should return 0 if the events array is empty", () => {
    const latestVersion = getLatestEventVersion([]);

    expect(latestVersion).toEqual(0);
  });
});
