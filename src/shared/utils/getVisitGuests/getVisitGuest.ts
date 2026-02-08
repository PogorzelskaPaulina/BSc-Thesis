import { Guest } from "../../../domain/events/events";
import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";

export const getVisitGuests = async (guests: Guest[], attendeeRepository: AttendeeRepository) => {
  const guestsPromises = guests.map(async (guest) => {
    const { email, accepted, invitationId, type } = guest;
    const foundGuest = await attendeeRepository.findByEmail(email);

    const visitGuest = {
      ...foundGuest,
      accepted,
      invitationId
    };

    if (type === "visitor") {
      return {
        ...visitGuest,
        pinCode: guest.pinCode
      };
    }

    return visitGuest;
  });

  return Promise.all(guestsPromises);
};
