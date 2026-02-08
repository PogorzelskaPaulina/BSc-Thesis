import { Room } from "../../adapters/models/Room";
import { Paginated, Pagination } from "../../shared/types/Pagination";
import { Uuid } from "../../shared/utils/Uuid/Uuid";

export interface RoomRepository {
  findById(id: Uuid): Promise<Room>;
  findAll(pagination?: Pagination): Promise<Paginated<Room>>;
}
