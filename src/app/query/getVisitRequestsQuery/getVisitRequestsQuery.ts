import { VisitRequestRepository } from "../../../ports/database/VisitRequestRepository";
import { VisitRequest } from "../../../adapters/models/VisitRequest";
import { Paginated } from "../../../shared/types/Pagination";

interface Input {
  requesterEmail: string;
  isAdmin: boolean;
}

interface Context {
  visitRequestRepository: VisitRequestRepository;
}

const mapPaginatedVisitRequestsToResponse = ({ items, cursor }: Paginated<VisitRequest>) => ({
  cursor,
  visitRequests: items
});

export const getVisitRequestsQuery = async (
  { requesterEmail, isAdmin, ...pagination }: Input,
  { visitRequestRepository }: Context
) => {
  if (isAdmin) {
    const paginatedVisitRequests = await visitRequestRepository.findAllActiveRequests(pagination);

    return mapPaginatedVisitRequestsToResponse(paginatedVisitRequests);
  }

  const paginatedVisitRequests = await visitRequestRepository.findAllHostActiveRequests(
    requesterEmail,
    pagination
  );

  return mapPaginatedVisitRequestsToResponse(paginatedVisitRequests);
};
