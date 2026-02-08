import { Attendee } from "../../models/Attendee";
import { DynamoAttendeeRepository } from "./DynamoAttendeeRepository";

const attendee = Attendee.create({ email: "email@email.com", name: "", type: "employee" });

let dynamoAttendeeRepository: DynamoAttendeeRepository;

describe("DynamoAttendeeRepository", () => {
  beforeAll(() => {
    process.env.ATTENDEE_TABLE = "test-attendee-table";

    dynamoAttendeeRepository = new DynamoAttendeeRepository();
  });

  test("should create attendee and then find it", async () => {
    // act
    await dynamoAttendeeRepository.create(attendee);
    const foundAttendee = await dynamoAttendeeRepository.findByEmail(attendee.email);

    // assert
    expect(foundAttendee).toStrictEqual(attendee);
  });

  test("should fail creating another attendee with the same id", async () => {
    // act, assert
    await expect(dynamoAttendeeRepository.create(attendee)).rejects.toThrow(
      "The conditional request failed"
    );
  });

  test("should throw an error when not found", async () => {
    // act, assert
    await expect(dynamoAttendeeRepository.findByEmail("not-known-email")).rejects.toThrow(
      "Attendee not found"
    );
  });

  test("should return null or attendee when use findOrNull", async () => {
    // act
    const foundAttendee = await dynamoAttendeeRepository.findByEmailOrNull(attendee.email);
    const notExistingAttendee = await dynamoAttendeeRepository.findByEmailOrNull("not-known-email");

    // assert
    expect(foundAttendee).toStrictEqual(attendee);
    expect(notExistingAttendee).toBe(null);
  });
});
