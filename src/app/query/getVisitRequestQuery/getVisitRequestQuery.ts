import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { findByIdWithHostEmail } from "../../../shared/utils/finByIdWithHostEmail/findByIdWithHostEmail";

interface Input {
  id: VisitId;
  requesterEmail: string;
  isAdmin: boolean;
}

interface Context {
  visitRequestRepository: VisitRequestRepository;
}

export const getVisitRequestQuery = async (
  { id, requesterEmail, isAdmin }: Input,
  { visitRequestRepository }: Context
) =>
  findByIdWithHostEmail(
    id,
    () => visitRequestRepository.findById(id),
    requesterEmail,
    isAdmin,
    "Visit request not found"
  );
