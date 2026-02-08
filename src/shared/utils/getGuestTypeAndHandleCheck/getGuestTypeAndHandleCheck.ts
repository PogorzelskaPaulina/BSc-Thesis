import { Attendee } from "../../../adapters/models/Attendee";
import { AttendeeType } from "../../../domain/events/events";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";

interface Guest {
  email: string;
  name: string | null;
}

export const getGuestTypeAndHandleCheck = async (
  { email, name }: Guest,
  attendeeRepository: AttendeeRepository
): Promise<AttendeeType> => {
  const storedGuest = await attendeeRepository.findByEmailOrNull(email);

  if (!storedGuest) {
    await attendeeRepository.create(Attendee.create({ email, name, type: "visitor" }));
  }

  return storedGuest?.type || "visitor";
};
