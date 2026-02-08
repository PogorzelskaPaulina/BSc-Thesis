import { createMock } from "ts-auto-mock";
import { getGuestTypeAndHandleCheck } from "./getGuestTypeAndHandleCheck";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";
import { Attendee } from "../../../adapters/models/Attendee";

const notStoredGuestEmail = "not-stored@example.com";

const attendeeRepository = createMock<AttendeeRepository>({
  findByEmailOrNull: async (email) => {
    if (email === notStoredGuestEmail) {
      return null;
    }

    return Attendee.create({ email, name: "name", type: "visitor" });
  },
  create: jest.fn()
});

describe("getGuestTypeAndHandleCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create a new guest if guest email not found", async () => {
    const guest = { email: notStoredGuestEmail, name: "John" };

    await getGuestTypeAndHandleCheck(guest, attendeeRepository);

    expect(attendeeRepository.create).toHaveBeenNthCalledWith(1, {
      email: notStoredGuestEmail,
      name: "John",
      type: "visitor"
    });
  });
});
