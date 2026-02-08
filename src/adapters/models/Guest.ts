import "reflect-metadata";
import { Exclude, Expose } from "class-transformer";
import { Attendee, AttendeeProps } from "./Attendee";
import { Entity } from "./Entity";
import { Uuid } from "../../shared/utils/Uuid/Uuid";
import { AttendeeType } from "../../domain/events/events";

export interface GuestProps extends AttendeeProps {
  accepted: null | boolean;
  invitationId: Uuid;
  pinCode?: string;
}

@Exclude()
export class Guest<T extends AttendeeType = AttendeeType>
  extends Attendee<T>
  implements Entity<GuestProps>
{
  public static create(data: GuestProps): Guest {
    const object = new Guest();
    Object.assign(object, data);

    return object;
  }

  @Expose()
  readonly accepted: null | boolean;

  readonly invitationId: Uuid;

  readonly pinCode?: string;

  toPrimitive() {
    return {
      email: this.email,
      name: this.name,
      type: this.type,
      accepted: this.accepted,
      invitationId: this.invitationId,
      ...(this.pinCode ? { pinCode: this.pinCode } : {})
    };
  }
}
