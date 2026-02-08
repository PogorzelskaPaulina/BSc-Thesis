import { Attendee } from "../../../adapters/models/Attendee";
import { EmployeeType } from "../../../domain/events/events";
import { NotFoundException } from "../../exceptions/NotFoundException/NotFoundException";

interface EntityWithHost {
  host: Attendee<EmployeeType>;
}

export const findByIdWithHostEmail = async <T, E extends EntityWithHost>(
  id: T,
  findByIdFunction: (id: T) => Promise<E>,
  requesterEmail: string,
  isAdmin: boolean,
  errorMessage: string
) => {
  const entity = await findByIdFunction(id);

  if (entity.host.email !== requesterEmail && !isAdmin) {
    throw new NotFoundException(errorMessage);
  }

  return entity;
};
