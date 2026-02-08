import { VisitRepository } from "../../../ports/database/VisitRepository";
import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { findByIdWithHostEmail } from "../../../shared/utils/finByIdWithHostEmail/findByIdWithHostEmail";

interface Input {
  id: VisitId;
  requesterEmail: string;
  isAdmin: boolean;
}

interface Context {
  visitRepository: VisitRepository;
}

export const getVisitQuery = async (
  { id, requesterEmail, isAdmin }: Input,
  { visitRepository }: Context
) =>
  findByIdWithHostEmail(
    id,
    () => visitRepository.findById(id),
    requesterEmail,
    isAdmin,
    "Visit not found"
  );
