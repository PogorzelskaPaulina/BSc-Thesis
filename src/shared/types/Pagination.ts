export interface Pagination {
  cursor?: string | null;
  limit?: string;
}

export interface Paginated<T> {
  cursor: string | null;
  items: T[];
}
