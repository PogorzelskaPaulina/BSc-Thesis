import dayjs from "dayjs";
import { getMockRequest } from "../../../shared/tests/getMockRequest";
import { Paginated } from "../../../shared/types/Pagination";
import { Attendee } from "../../models/Attendee";
import { DynamoVisitRequestRepository } from "./DynamoVisitRequestRepository";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { VisitRequest } from "../../models/VisitRequest";
import { NotFoundException } from "../../../shared/exceptions/NotFoundException/NotFoundException";
import { EmployeeType } from "../../../domain/events/events";

const requestDate = dayjs().subtract(10, "minute").toISOString();

const requestDate2 = dayjs().subtract(20, "minute").toISOString();

const requestDate3 = dayjs().subtract(1, "minute").toISOString();

const request = getMockRequest({ id: "6f62d5e1-64a8-400f-96d5-8d26ebb5c627", requestDate });

const secondRequest = getMockRequest({
  id: "4efca176-cb74-42be-8950-fc0c0a0c5fea",
  requestDate: requestDate2,
  host: Attendee.create({
    email: "host2@email.com",
    name: "name",
    type: "employee"
  }) as Attendee<EmployeeType>
});

const thirdRequest = getMockRequest({
  id: "601e190f-cdb3-4e4b-b77a-e5dfb822edc2",
  requestDate: requestDate3
});

let dynamoVisitRequestRepository: DynamoVisitRequestRepository;

const hostEmail = "host@email.com";

describe("DynamoVisitRequestRepository", () => {
  beforeAll(() => {
    // arrange
    process.env.VISIT_REQUEST_TABLE = "test-visit-request-table";

    dynamoVisitRequestRepository = new DynamoVisitRequestRepository();
  });

  test("should create request and find it", async () => {
    // act
    await dynamoVisitRequestRepository.create(request);
    const foundRequest = await dynamoVisitRequestRepository.findById(request.id);

    // assert
    expect(foundRequest).toStrictEqual(request);
  });

  test("should throw an error when not found", async () => {
    // act, assert
    await expect(dynamoVisitRequestRepository.findById("not-known-id")).rejects.toThrow(
      "Visit request not found"
    );
  });

  test("should fail creating another request with the same id", async () => {
    // act, assert
    await expect(dynamoVisitRequestRepository.create(request)).rejects.toThrow(
      "The conditional request failed"
    );
  });

  test("should find all host requests", async () => {
    // act
    await dynamoVisitRequestRepository.create(secondRequest);
    await dynamoVisitRequestRepository.create(thirdRequest);

    const requests = await dynamoVisitRequestRepository.findAllHostActiveRequests("host@email.com");
    // assert
    expect(requests).toStrictEqual({
      cursor: null,
      items: expect.arrayContaining([thirdRequest, request])
    });
  });

  test("should find all requests and return them sorted", async () => {
    // act
    const requests = await dynamoVisitRequestRepository.findAllActiveRequests();

    // assert
    expect(requests).toStrictEqual({
      cursor: null,
      items: expect.arrayContaining([thirdRequest, request, secondRequest])
    });
  });

  describe("pagination", () => {
    let firstHostVisitRequest: Paginated<VisitRequest>;
    let restOfTheHostVisitRequests: Paginated<VisitRequest>;

    let firstVisitRequest: Paginated<VisitRequest>;
    let restOfTheVisitRequests: Paginated<VisitRequest>;

    test("should find host first visit request", async () => {
      // act
      firstHostVisitRequest = await dynamoVisitRequestRepository.findAllHostActiveRequests(
        "host@email.com",
        { limit: "1" }
      );

      // assert
      expect(firstHostVisitRequest.cursor).toEqual(expect.any(String));
      expect(firstHostVisitRequest.items).toHaveLength(1);
    });

    test("should throw an error when provided cursor is invalid", async () => {
      // arrange
      const invalidCursor = "invalidCursor";
      const invalidSchemaCursor = "%7B%22id%22:%22invalidId%22%7D";
      // act, assert
      await expect(
        dynamoVisitRequestRepository.findAllHostActiveRequests(hostEmail, {
          limit: "1",
          cursor: invalidCursor
        })
      ).rejects.toThrow(BadRequestException);
      await expect(
        dynamoVisitRequestRepository.findAllHostActiveRequests(hostEmail, {
          limit: "1",
          cursor: invalidSchemaCursor
        })
      ).rejects.toThrow(BadRequestException);
      await expect(
        dynamoVisitRequestRepository.findAllActiveRequests({ limit: "1", cursor: invalidCursor })
      ).rejects.toThrow(BadRequestException);
      await expect(
        dynamoVisitRequestRepository.findAllActiveRequests({
          limit: "1",
          cursor: invalidSchemaCursor
        })
      ).rejects.toThrow(BadRequestException);
    });

    test("should throw an error when provided limit is bigger then allowed one", async () => {
      // arrange
      const biggerThenAllowedLimit = "100";

      // act, assert
      await expect(
        dynamoVisitRequestRepository.findAllHostActiveRequests(hostEmail, {
          limit: biggerThenAllowedLimit
        })
      ).rejects.toThrow();
      await expect(
        dynamoVisitRequestRepository.findAllActiveRequests({ limit: biggerThenAllowedLimit })
      ).rejects.toThrow();
    });

    test("should find rest of host visit when limit is not specified", async () => {
      // act
      restOfTheHostVisitRequests = await dynamoVisitRequestRepository.findAllHostActiveRequests(
        hostEmail,
        {
          cursor: firstHostVisitRequest.cursor
        }
      );

      // assert
      expect(restOfTheHostVisitRequests.cursor).toStrictEqual(null);
      expect(restOfTheHostVisitRequests.items).toHaveLength(1);
    });

    test("should find rest of host visit requests when limit is specified", async () => {
      // act
      const restOfTheVisitRequestsWithLimitSpecified =
        await dynamoVisitRequestRepository.findAllHostActiveRequests(hostEmail, {
          cursor: firstHostVisitRequest.cursor,
          limit: "2"
        });

      // assert
      expect(restOfTheVisitRequestsWithLimitSpecified.cursor).toStrictEqual(null);
      expect(restOfTheVisitRequestsWithLimitSpecified.items).toHaveLength(1);
    });

    test("all found host visits requests should be equal to all stored host visit requests", () => {
      // assert
      expect([...firstHostVisitRequest.items, ...restOfTheHostVisitRequests.items]).toHaveLength(2);
    });

    test("should find first visit request", async () => {
      // act
      firstVisitRequest = await dynamoVisitRequestRepository.findAllActiveRequests({
        limit: "1"
      });
      // assert
      expect(firstVisitRequest.cursor).toEqual(expect.any(String));
      expect(firstVisitRequest.items).toHaveLength(1);
    });

    test("should find rest of the visits requests when limit is not specified", async () => {
      // act
      restOfTheVisitRequests = await dynamoVisitRequestRepository.findAllActiveRequests({
        cursor: firstVisitRequest.cursor
      });

      // assert
      expect(restOfTheVisitRequests.cursor).toStrictEqual(null);
      expect(restOfTheVisitRequests.items).toHaveLength(2);
    });

    test("should find rest of the visits requests when limit is specified", async () => {
      // act
      restOfTheVisitRequests = await dynamoVisitRequestRepository.findAllActiveRequests({
        cursor: firstVisitRequest.cursor,
        limit: "2"
      });

      // assert
      expect(restOfTheVisitRequests.cursor).toStrictEqual(null);
      expect(restOfTheVisitRequests.items).toHaveLength(2);
    });
  });

  test("should remove visit request", async () => {
    // act
    await dynamoVisitRequestRepository.remove(request.id);

    // assert
    await expect(dynamoVisitRequestRepository.findById(request.id)).rejects.toThrow(
      NotFoundException
    );
  });

  test("should throw an error while removing non existing visit request", async () => {
    // act, assert
    await expect(dynamoVisitRequestRepository.remove("non-existing-id")).rejects.toThrow();
  });

  test("should decline visit request", async () => {
    // act
    await dynamoVisitRequestRepository.decline(secondRequest.id);

    // assert
    const visitRequest = await dynamoVisitRequestRepository.findById(secondRequest.id);
    expect(visitRequest.status).toStrictEqual("declined");
  });
});
