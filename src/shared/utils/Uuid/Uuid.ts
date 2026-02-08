import { v4 } from "uuid";

export class Uuid {
  static generate(): Uuid {
    return v4();
  }
}
