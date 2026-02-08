import { createMock } from "ts-auto-mock";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { getMockVisit } from "../../../shared/tests/getMockVisit";
import { getVisitQuery } from "./getVisitQuery";

const hostEmail = "host@email.com";
const secondHostEmail = "host2@email.com";

const visit = getMockVisit();

const visitRepository = createMock<VisitRepository>({
  async findById() {
    return visit;
  }
});

describe("getVisitQuery", () => {
  test("should return visit if employee queries for it", async () => {
    // act
    const result = await getVisitQuery(
      { id: visit.id, isAdmin: false, requesterEmail: hostEmail },
      { visitRepository }
    );

    // assert
    expect(result).toStrictEqual(visit);
  });

  test("should return visit if admin queries for it", async () => {
    // act
    const result = await getVisitQuery(
      { id: visit.id, isAdmin: true, requesterEmail: secondHostEmail },
      { visitRepository }
    );

    // assert
    expect(result).toStrictEqual(visit);
  });

  test("should throw not found exception if employee queries for different employee visit", async () => {
    // act, assert
    await expect(
      getVisitQuery(
        { id: visit.id, requesterEmail: secondHostEmail, isAdmin: false },
        { visitRepository }
      )
    ).rejects.toThrow(NotFoundException);
  });
});
