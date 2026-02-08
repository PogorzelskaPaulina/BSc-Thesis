import "reflect-metadata";
import { Exclude } from "class-transformer";
import dayjs from "dayjs";
import { Entity } from "./Entity";
import { Uuid } from "../../shared/utils/Uuid/Uuid";
import { VisitId } from "../../domain/valueObjects/VisitId/VisitId";
import { Visit } from "../../domain/Visit";

export interface RoomReservationProps {
  baseDate: string;
  dateStartAndId: string;
  baseDateAndRoomId: string;
  dateEnd: string;
  visitId: VisitId;
}

interface RoomReservationVisitEventProps {
  dateStart: string;
  dateEnd: string;
  roomId: Uuid;
  visitId: VisitId;
  id?: Uuid;
}

export const separator = "#";

@Exclude()
export class RoomReservation implements Entity<RoomReservationProps> {
  public static create(data: RoomReservationProps): RoomReservation {
    const object = new RoomReservation();
    const [dateStart, id] = data.dateStartAndId.split(separator);
    const roomId = data.baseDateAndRoomId.split(separator)[1];

    Object.assign(object, {
      id,
      dateStart,
      dateEnd: data.dateEnd,
      roomId,
      visitId: data.visitId
    });

    return object;
  }

  public static createFromVisitEvent(data: RoomReservationVisitEventProps): RoomReservation {
    const object = new RoomReservation();
    const id = data.id || Uuid.generate();

    Object.assign(object, { ...data, id });

    return object;
  }

  readonly id: Uuid;

  readonly dateStart: string;

  readonly dateEnd: string;

  readonly roomId: Uuid;

  readonly visitId: VisitId;

  private getFormattedBaseDate() {
    return dayjs(this.dateStart).format("DD-MM-YYYY");
  }

  private getDateStartAndId() {
    return `${this.dateStart}${separator}${this.id}`;
  }

  getCompositeKey() {
    const formattedDateStart = this.getFormattedBaseDate();

    return {
      baseDate: formattedDateStart,
      dateStartAndId: this.getDateStartAndId()
    };
  }

  toPrimitive() {
    const formattedDateStart = this.getFormattedBaseDate();

    return {
      baseDate: formattedDateStart,
      dateStartAndId: this.getDateStartAndId(),
      baseDateAndRoomId: `${formattedDateStart}${separator}${this.roomId}`,
      dateEnd: this.dateEnd,
      visitId: this.visitId,
      expirationTime: dayjs(this.dateEnd).add(Visit.validityPeriod, "minutes").unix()
    };
  }
}
