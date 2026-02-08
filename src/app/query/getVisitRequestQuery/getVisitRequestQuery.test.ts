import { createMock } from "ts-auto-mock";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { getMockRequest } from "../../../shared/tests/getMockRequest";
import { getVisitRequestQuery } from "./getVisitRequestQuery";

const hostEmail = "host@email.com";
const secondHostEmail = "host2@email.com";

const request = getMockRequest();

const visitRequestRepository = createMock<VisitRequestRepository>({
  async findById() {
    return request;
  }
});

describe("getVisitRequestQuery", () => {
  test("should return request if employee queries for it", async () => {
    // act
    const result = await getVisitRequestQuery(
      { id: request.id, isAdmin: false, requesterEmail: hostEmail },
      { visitRequestRepository }
    );

    // assert
    expect(result).toStrictEqual(request);
  });

  test("should return visit if admin queries for it", async () => {
    // act
    const result = await getVisitRequestQuery(
      { id: request.id, isAdmin: true, requesterEmail: hostEmail },
      { visitRequestRepository }
    );

    // assert
    expect(result).toStrictEqual(request);
  });

  test("should throw not found exception if employee queries for different employee visit", async () => {
    // act, assert
    await expect(
      getVisitRequestQuery(
        { id: request.id, isAdmin: false, requesterEmail: secondHostEmail },
        { visitRequestRepository }
      )
    ).rejects.toThrow(NotFoundException);
  });
});
