import { createMock } from "ts-auto-mock";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { getMockRequest } from "../../../shared/tests/getMockRequest";
import { getVisitRequestsQuery } from "./getVisitRequestsQuery";

const hostEmail = "host@email.com";

const request = getMockRequest();

const visitRequestRepository = createMock<VisitRequestRepository>({
  findAllHostActiveRequests: jest.fn(async () => ({ cursor: null, items: [request] })),
  findAllActiveRequests: jest.fn(async () => ({ cursor: null, items: [request] }))
});

describe("getVisitRequestsQuery", () => {
  test("should return visit requests if employee queries for it", async () => {
    // act
    const result = await getVisitRequestsQuery(
      { requesterEmail: hostEmail, isAdmin: false },
      { visitRequestRepository }
    );
    // assert
    expect(visitRequestRepository.findAllHostActiveRequests).toHaveBeenNthCalledWith(
      1,
      hostEmail,
      {}
    );
    expect(result).toStrictEqual({ cursor: null, visitRequests: [request] });
  });

  test("should return visit requests if admin queries for it", async () => {
    // act
    const result = await getVisitRequestsQuery(
      { requesterEmail: hostEmail, isAdmin: true },
      { visitRequestRepository }
    );

    // assert
    expect(visitRequestRepository.findAllActiveRequests).toHaveBeenNthCalledWith(1, {});
    expect(result).toStrictEqual({ cursor: null, visitRequests: [request] });
  });
});
