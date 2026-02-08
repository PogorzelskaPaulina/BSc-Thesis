import "reflect-metadata";
import { Exclude, Expose } from "class-transformer";
import { Entity } from "./Entity";
import { SNSPlatformEndpoint } from "../../ports/database/AttendeeRepository";
import { AttendeeType } from "../../domain/events/events";

export interface AttendeeProps {
  email: string;
  name: string | null;
  snsPlatformEndpoints?: SNSPlatformEndpoint[];
  type: AttendeeType;
}

@Exclude()
export class Attendee<T extends AttendeeType = AttendeeType> implements Entity<AttendeeProps> {
  public static create(data: AttendeeProps): Attendee {
    const object = new Attendee();
    Object.assign(object, data);

    return object;
  }

  @Expose()
  readonly email: string;

  @Expose()
  readonly name: string | null;

  readonly snsPlatformEndpoints?: SNSPlatformEndpoint[];

  @Expose()
  readonly type: T;

  toPrimitive() {
    return {
      email: this.email,
      name: this.name,
      type: this.type,
      ...(this.snsPlatformEndpoints ? { snsPlatformEndpoints: this.snsPlatformEndpoints } : {})
    };
  }
}
