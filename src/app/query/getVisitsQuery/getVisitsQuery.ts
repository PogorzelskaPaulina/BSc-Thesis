import { Visit } from "../../../adapters/models/Visit";
import { VisitRepository } from "../../../ports/database/VisitRepository";
import { Paginated, Pagination } from "../../../shared/types/Pagination";

interface Input extends Pagination {
  requesterEmail: string;
  isAdmin: boolean;
}

interface Context {
  visitRepository: VisitRepository;
}

const mapPaginatedVisitsToResponse = ({ items, cursor }: Paginated<Visit>) => ({
  cursor,
  visits: items
});

export const getVisitsQuery = async (
  { requesterEmail, isAdmin, ...pagination }: Input,
  { visitRepository }: Context
) => {
  if (isAdmin) {
    const paginatedVisits = await visitRepository.findAllUpcomingVisits(pagination);

    return mapPaginatedVisitsToResponse(paginatedVisits);
  }

  const paginatedVisits = await visitRepository.findHostUpcomingVisits(requesterEmail, pagination);

  return mapPaginatedVisitsToResponse(paginatedVisits);
};
