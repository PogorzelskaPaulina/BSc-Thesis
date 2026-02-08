import "reflect-metadata";
import { Exclude, Expose } from "class-transformer";
import dayjs from "dayjs";
import { Entity } from "./Entity";
import { VisitId } from "../../domain/valueObjects/VisitId/VisitId";
import { Attendee } from "./Attendee";
import { PrimitiveEntityValue } from "../../shared/types/PrimitiveEntityValue";
import { VisitRequestedStatus } from "../../domain/state";
import { Visit } from "../../domain/Visit";
import { EmployeeType, VisitorType } from "../../domain/events/events";

export interface VisitRequestProps {
  id: VisitId;
  status: VisitRequestedStatus;
  title: string;
  requestDate: string;
  duration: number;
  host: PrimitiveEntityValue<Attendee<EmployeeType>>;
  guest: PrimitiveEntityValue<Attendee<VisitorType>>;
}

@Exclude()
export class VisitRequest implements Entity<VisitRequestProps> {
  public static create({
    status,
    requestDate,
    duration,
    host,
    guest,
    ...data
  }: VisitRequestProps): VisitRequest {
    const object = new VisitRequest();

    Object.assign(object, {
      ...data,
      status,
      requestDate,
      duration,
      host: Attendee.create(host),
      guest: Attendee.create(guest),
      hostEmail: host.email,
      expirationTime: dayjs(requestDate)
        .add(duration + Visit.validityPeriod, "minutes")
        .unix(),
      baseRequestDate: dayjs(requestDate).format("DD-MM-YYYY")
    });

    return object;
  }

  @Expose()
  readonly id: VisitId;

  @Expose()
  readonly status: VisitRequestedStatus;

  @Expose()
  readonly title: string;

  @Expose()
  readonly duration: number;

  @Expose()
  readonly host: Attendee<EmployeeType>;

  @Expose()
  readonly guest: Attendee<VisitorType>;

  @Expose()
  readonly requestDate: string;

  readonly hostEmail: string;

  readonly expirationTime: number;

  readonly baseRequestDate: string;

  toPrimitive() {
    return {
      id: this.id,
      status: this.status,
      title: this.title,
      duration: this.duration,
      requestDate: this.requestDate,
      host: this.host.toPrimitive(),
      guest: this.guest.toPrimitive(),
      hostEmail: this.hostEmail,
      baseRequestDate: dayjs(this.requestDate).format("DD-MM-YYYY"),
      expirationTime: this.expirationTime
    };
  }
}
