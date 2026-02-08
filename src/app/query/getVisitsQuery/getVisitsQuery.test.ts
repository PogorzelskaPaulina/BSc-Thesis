import { createMock } from "ts-auto-mock";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { getMockVisit } from "../../../shared/tests/getMockVisit";
import { getVisitsQuery } from "./getVisitsQuery";

const hostEmail = "host@email.com";

const visit = getMockVisit();

const visitRepository = createMock<VisitRepository>({
  findAllUpcomingVisits: jest.fn(async () => ({ cursor: null, items: [visit] })),
  findHostUpcomingVisits: jest.fn(async () => ({ cursor: null, items: [visit] }))
});

describe("getVisitsQuery", () => {
  test("should return visit if employee queries for it", async () => {
    // act
    const result = await getVisitsQuery(
      { isAdmin: false, requesterEmail: hostEmail },
      { visitRepository }
    );

    // assert
    expect(visitRepository.findHostUpcomingVisits).toHaveBeenNthCalledWith(1, hostEmail, {});
    expect(result).toStrictEqual({ cursor: null, visits: [visit] });
  });

  test("should return visit if admin queries for it", async () => {
    // act
    const result = await getVisitsQuery(
      { isAdmin: true, requesterEmail: hostEmail },
      { visitRepository }
    );

    // assert
    expect(visitRepository.findAllUpcomingVisits).toHaveBeenNthCalledWith(1, {});
    expect(result).toStrictEqual({ cursor: null, visits: [visit] });
  });
});
