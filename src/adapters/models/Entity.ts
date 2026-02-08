export interface Entity<T> {
  toPrimitive: () => T;
}
