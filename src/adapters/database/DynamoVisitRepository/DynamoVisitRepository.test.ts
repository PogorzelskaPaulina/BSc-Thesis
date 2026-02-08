import dayjs from "dayjs";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { getMockVisit } from "../../../shared/tests/getMockVisit";
import { Paginated } from "../../../shared/types/Pagination";
import { Guest } from "../../models/Guest";
import { Visit } from "../../models/Visit";
import { VisitRoom } from "../../models/VisitRoom";
import { DynamoVisitRepository } from "./DynamoVisitRepository";

const startDate = dayjs().add(1, "day").set("hour", 10).toISOString();
const endDate = dayjs().add(1, "day").set("hour", 14).toISOString();

const startDate2 = dayjs().add(1, "day").set("hour", 11).toISOString();
const endDate2 = dayjs().add(1, "day").set("hour", 15).toISOString();

const startDate3 = dayjs().add(1, "day").set("hour", 12).toISOString();
const endDate3 = dayjs().add(1, "day").set("hour", 16).toISOString();

const invitationId = "invitationId";

const visit = getMockVisit({
  id: "6f62d5e1-64a8-400f-96d5-8d26ebb5c627",
  startDate,
  endDate,
  guests: [
    Guest.create({
      accepted: null,
      email: "guest@email.com",
      invitationId,
      name: "name",
      type: "visitor",
      pinCode: "000000"
    }),
    Guest.create({
      accepted: null,
      email: "guest2@email.com",
      invitationId: "invitationId2",
      name: "name",
      type: "visitor",
      pinCode: "000001"
    })
  ]
});

const secondVisit = getMockVisit({
  startDate: startDate2,
  endDate: endDate2,
  hostEmail: "host2@email.com",
  id: "4efca176-cb74-42be-8950-fc0c0a0c5fea",
  room: VisitRoom.create({ id: "roomId", isReservedForThisVisit: true, name: "name" })
});

const thirdVisit = getMockVisit({
  id: "601e190f-cdb3-4e4b-b77a-e5dfb822edc2",
  startDate: startDate3,
  endDate: endDate3
});

const visitToBeCanceled = getMockVisit({ id: "d5c837ff-39a7-4abb-967a-f832a2b28965" });

const hostEmail = "host@email.com";

let dynamoVisitRepository: DynamoVisitRepository;

describe("DynamoVisitRepository", () => {
  beforeAll(() => {
    // arrange
    process.env.VISIT_TABLE = "test-visit-table";

    dynamoVisitRepository = new DynamoVisitRepository();
  });

  test("should create visit and find created visit", async () => {
    // act
    await dynamoVisitRepository.create(visit);
    const foundVisit = await dynamoVisitRepository.findById(visit.id);
    // assert
    expect(foundVisit).toStrictEqual(visit);
  });

  test("should fail creating another visit with the same id", async () => {
    // act, assert
    await expect(dynamoVisitRepository.create(visit)).rejects.toThrow();
  });

  test("should throw an error when not found", async () => {
    // act, assert
    await expect(dynamoVisitRepository.findById("not-known-id")).rejects.toThrow("Visit not found");
  });

  test("should find all upcoming host visits and return them sorted", async () => {
    // arrange
    await dynamoVisitRepository.create(secondVisit);
    await dynamoVisitRepository.create(thirdVisit);

    // act
    const visits = await dynamoVisitRepository.findHostUpcomingVisits(hostEmail);

    // assert
    expect(visits).toStrictEqual({
      cursor: null,
      items: expect.arrayContaining([visit, thirdVisit])
    });
  });

  test("should find all upcoming visits and return them sorted", async () => {
    // act
    const visits = await dynamoVisitRepository.findAllUpcomingVisits();

    // assert
    expect(visits).toStrictEqual({
      cursor: null,
      items: expect.arrayContaining([visit, secondVisit, thirdVisit])
    });
  });

  test("should update visitor invitation", async () => {
    // act
    await dynamoVisitRepository.setInvitationAcceptance(visit.id, invitationId, true);

    // assert
    const updatedVisit = await dynamoVisitRepository.findById(visit.id);
    expect(updatedVisit.guests).toStrictEqual([
      Guest.create({ ...visit.guests[0], accepted: true }),
      Guest.create({ ...visit.guests[1] })
    ]);
  });

  test("should throw not found error when updating not existing visit invitation", async () => {
    // act, assert
    await expect(
      dynamoVisitRepository.setInvitationAcceptance("non-existing-id", invitationId, true)
    ).rejects.toThrow("Visit not found");
  });

  test("should update the visit and make status canceled", async () => {
    // arrange
    await dynamoVisitRepository.create(visitToBeCanceled);

    // act
    await dynamoVisitRepository.cancelVisit(visitToBeCanceled.id);

    // assert
    const updatedVisit = await dynamoVisitRepository.findById(visitToBeCanceled.id);
    expect(updatedVisit.status).toStrictEqual("canceled");
  });

  test("should throw an error when visit to be canceled does not exist", async () => {
    // act, assert
    await expect(dynamoVisitRepository.cancelVisit("not-existing-visit")).rejects.toThrow();
  });

  describe("pagination", () => {
    let firstHostVisit: Paginated<Visit>;
    let restOfTheHostVisits: Paginated<Visit>;

    let firstVisit: Paginated<Visit>;
    let restOfTheVisits: Paginated<Visit>;
    test("should find host first visit", async () => {
      // act
      firstHostVisit = await dynamoVisitRepository.findHostUpcomingVisits(hostEmail, {
        limit: "1"
      });

      // assert
      expect(firstHostVisit.cursor).toEqual(expect.any(String));
      expect(firstHostVisit.items).toHaveLength(1);
    });

    test("should throw an error when provided cursor is invalid", async () => {
      // arrange
      const invalidCursor = "invalidCursor";
      const invalidSchemaCursor = "%7B%22id%22:%22invalidId%22%7D";

      // act, assert
      await expect(
        dynamoVisitRepository.findHostUpcomingVisits(hostEmail, {
          limit: "1",
          cursor: invalidCursor
        })
      ).rejects.toThrow(BadRequestException);
      await expect(
        dynamoVisitRepository.findHostUpcomingVisits(hostEmail, {
          limit: "1",
          cursor: invalidSchemaCursor
        })
      ).rejects.toThrow(BadRequestException);
      await expect(
        dynamoVisitRepository.findAllUpcomingVisits({ limit: "1", cursor: invalidCursor })
      ).rejects.toThrow(BadRequestException);
      await expect(
        dynamoVisitRepository.findAllUpcomingVisits({ limit: "1", cursor: invalidSchemaCursor })
      ).rejects.toThrow(BadRequestException);
    });

    test("should throw an error when provided limit is bigger then allowed one", async () => {
      // arrange
      const biggerThenAllowedLimit = "100";

      // act, assert
      await expect(
        dynamoVisitRepository.findHostUpcomingVisits(hostEmail, { limit: biggerThenAllowedLimit })
      ).rejects.toThrow();
      await expect(
        dynamoVisitRepository.findAllUpcomingVisits({ limit: biggerThenAllowedLimit })
      ).rejects.toThrow();
    });

    test("should find rest of host visit when limit is not specified", async () => {
      // act
      restOfTheHostVisits = await dynamoVisitRepository.findHostUpcomingVisits(hostEmail, {
        cursor: firstHostVisit.cursor
      });

      // assert
      expect(restOfTheHostVisits.cursor).toStrictEqual(null);
      expect(restOfTheHostVisits.items).toHaveLength(2);
    });

    test("should find rest of host visit when limit is specified", async () => {
      // act
      const restOfTheVisitsWithLimitSpecified = await dynamoVisitRepository.findHostUpcomingVisits(
        hostEmail,
        {
          cursor: firstHostVisit.cursor,
          limit: "2"
        }
      );

      // assert
      expect(restOfTheVisitsWithLimitSpecified.cursor).toStrictEqual(null);
      expect(restOfTheVisitsWithLimitSpecified.items).toHaveLength(2);
    });

    test("all found host visits should be equal to all stored host visits", () => {
      // assert
      expect([...firstHostVisit.items, ...restOfTheHostVisits.items]).toHaveLength(3);
    });

    test("should find first visit", async () => {
      // act
      firstVisit = await dynamoVisitRepository.findAllUpcomingVisits({ limit: "1" });

      // assert
      expect(firstHostVisit.cursor).toEqual(expect.any(String));
      expect(firstHostVisit.items).toHaveLength(1);
    });

    test("should find rest of the visits when limit is not specified", async () => {
      // act
      restOfTheVisits = await dynamoVisitRepository.findAllUpcomingVisits({
        cursor: firstVisit.cursor
      });

      // assert
      expect(restOfTheVisits.cursor).toStrictEqual(null);
      expect(restOfTheVisits.items).toHaveLength(3);
    });

    test("should find rest of the visits when limit is specified", async () => {
      // act
      const restOfTheVisitsWithLimitSpecified = await dynamoVisitRepository.findAllUpcomingVisits({
        cursor: firstVisit.cursor,
        limit: "3"
      });

      // assert
      expect(restOfTheVisitsWithLimitSpecified.cursor).toStrictEqual(null);
      expect(restOfTheVisitsWithLimitSpecified.items).toHaveLength(3);
    });

    test("all found visits should be equal to all stored visits", () => {
      // assert
      expect([...firstVisit.items, ...restOfTheVisits.items]).toHaveLength(4);
    });
  });
});
