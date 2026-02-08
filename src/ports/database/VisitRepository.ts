import { Visit } from "../../adapters/models/Visit";
import { Guest } from "../../adapters/models/Guest";
import { VisitId } from "../../domain/valueObjects/VisitId/VisitId";
import { Paginated, Pagination } from "../../shared/types/Pagination";
import { Uuid } from "../../shared/utils/Uuid/Uuid";
import { VisitTimeframe } from "../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { PrimitiveEntityValue } from "../../shared/types/PrimitiveEntityValue";

export interface VisitRepository {
  create(visit: Visit): Promise<void>;
  findById(id: VisitId): Promise<Visit>;
  findByInvitationPinCode(pin: string): Promise<Visit>;
  findAllUpcomingVisits(pagination?: Pagination): Promise<Paginated<Visit>>;
  findHostUpcomingVisits(email: string, pagination?: Pagination): Promise<Paginated<Visit>>;
  setInvitationAcceptance(id: VisitId, invitationId: Uuid, accepted: boolean): Promise<void>;
  setVisitTimeframe(id: VisitId, timeframe: VisitTimeframe): Promise<void>;
  setVisitGuests(id: VisitId, guests: PrimitiveEntityValue<Guest>[]): Promise<void>;
  cancelVisit(id: VisitId): Promise<void>;
}
