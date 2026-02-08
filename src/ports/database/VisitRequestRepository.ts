import { VisitRequest } from "../../adapters/models/VisitRequest";
import { VisitId } from "../../domain/valueObjects/VisitId/VisitId";
import { Paginated, Pagination } from "../../shared/types/Pagination";

export interface VisitRequestRepository {
  create(request: VisitRequest): Promise<void>;
  findById(id: VisitId): Promise<VisitRequest>;
  findAllActiveRequests(pagination?: Pagination): Promise<Paginated<VisitRequest>>;
  findAllHostActiveRequests(
    email: string,
    pagination?: Pagination
  ): Promise<Paginated<VisitRequest>>;
  decline(id: VisitId): Promise<void>;
  remove(id: VisitId): Promise<void>;
}
