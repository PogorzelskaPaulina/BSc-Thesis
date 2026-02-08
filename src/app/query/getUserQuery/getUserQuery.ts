import { AttendeeRepository } from "../../../ports/database/AttendeeRepository";

export interface Input {
  email: string;
}

export interface Context {
  attendeeRepository: AttendeeRepository;
}

export const getUserQuery = ({ email }: Input, { attendeeRepository }: Context) =>
  attendeeRepository.findByEmail(email);
