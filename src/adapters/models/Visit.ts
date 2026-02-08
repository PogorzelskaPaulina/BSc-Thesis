import "reflect-metadata";
import { Exclude, Expose } from "class-transformer";
import { Entity } from "./Entity";
import { VisitId } from "../../domain/valueObjects/VisitId/VisitId";
import { PrimitiveValue } from "../../shared/types/PrimitiveValue";
import { Attendee } from "./Attendee";
import { VisitRoom } from "./VisitRoom";
import { VisitTimeframe } from "../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import { PrimitiveEntityValue } from "../../shared/types/PrimitiveEntityValue";
import { Guest } from "./Guest";
import { VisitStatus } from "../../domain/state";
import { EmployeeType } from "../../domain/events/events";

export interface VisitProps {
  id: VisitId;
  status: VisitStatus;
  title: string;
  timeframe: PrimitiveValue<VisitTimeframe>;
  host: PrimitiveEntityValue<Attendee<EmployeeType>>;
  guests: PrimitiveEntityValue<Guest>[];
  room?: PrimitiveEntityValue<VisitRoom>;
}

@Exclude()
export class Visit implements Entity<VisitProps> {
  public static create({
    status,
    timeframe: { start, end },
    host,
    guests,
    room,
    ...data
  }: VisitProps): Visit {
    const object = new Visit();

    Object.assign(object, {
      ...data,
      status,
      timeframe: VisitTimeframe.from(start, end),
      host: Attendee.create(host),
      guests: guests.map((guest) => Guest.create(guest)),
      startDate: start,
      hostEmail: host.email,
      room: room ? VisitRoom.create(room) : undefined,
      type: "visit"
    });

    return object;
  }

  @Expose()
  readonly id: VisitId;

  @Expose()
  readonly status: VisitStatus;

  @Expose()
  readonly title: string;

  @Expose()
  readonly timeframe: VisitTimeframe;

  @Expose()
  readonly host: Attendee<EmployeeType>;

  @Expose()
  readonly guests: Guest[];

  @Expose()
  readonly room?: VisitRoom;

  readonly startDate: string;

  readonly hostEmail: string;

  readonly type: "visit";

  toPrimitive() {
    return {
      id: this.id,
      status: this.status,
      title: this.title,
      timeframe: this.timeframe.valueOf(),
      host: this.host.toPrimitive(),
      guests: this.guests.map((guest) => guest.toPrimitive()),
      room: this.room?.toPrimitive(),
      startDate: this.startDate,
      hostEmail: this.hostEmail,
      type: this.type
    };
  }
}
