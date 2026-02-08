import { Uuid } from "../../../shared/utils/Uuid/Uuid";

export class VisitId extends Uuid {
  static generate(): VisitId {
    return super.generate();
  }
}
