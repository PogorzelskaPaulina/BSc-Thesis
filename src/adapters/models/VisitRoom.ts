import "reflect-metadata";
import { Exclude, Expose } from "class-transformer";
import { Room, RoomProps } from "./Room";
import { Entity } from "./Entity";

export interface VisitRoomProps extends RoomProps {
  isReservedForThisVisit: boolean;
}

@Exclude()
export class VisitRoom extends Room implements Entity<VisitRoomProps> {
  public static create(data: VisitRoomProps): VisitRoom {
    const object = new VisitRoom();
    Object.assign(object, data);

    return object;
  }

  @Expose()
  readonly isReservedForThisVisit: boolean;

  toPrimitive() {
    return {
      id: this.id,
      name: this.name,
      isReservedForThisVisit: this.isReservedForThisVisit
    };
  }
}
