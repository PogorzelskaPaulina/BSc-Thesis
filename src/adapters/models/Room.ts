import "reflect-metadata";
import { Exclude, Expose } from "class-transformer";
import { Entity } from "./Entity";
import { Uuid } from "../../shared/utils/Uuid/Uuid";

export interface RoomProps {
  id: Uuid;
  name: string;
  isAvailable?: boolean;
}

@Exclude()
export class Room implements Entity<RoomProps> {
  public static create(data: RoomProps): Room {
    const object = new Room();
    Object.assign(object, data);

    return object;
  }

  @Expose()
  readonly id: Uuid;

  @Expose()
  readonly name: string;

  @Expose()
  readonly isAvailable?: boolean;

  toPrimitive() {
    return {
      id: this.id,
      name: this.name
    };
  }
}
