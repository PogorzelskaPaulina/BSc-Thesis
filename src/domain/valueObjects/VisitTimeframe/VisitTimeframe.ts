import dayjs from "dayjs";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";

export class VisitTimeframe {
  private constructor(private readonly start: Date, private readonly end: Date) {}

  private static getStartOfAnHour(date: string, hour: number) {
    return dayjs(date).set("hour", hour).set("minute", 0).set("second", 0).set("millisecond", 0);
  }

  private static validateInitialValue(date: string, errorMessage: string) {
    const isDateValid = dayjs(date).isValid();

    if (!isDateValid) {
      throw new BadRequestException(errorMessage);
    }
  }

  private static validate(start: string, end: string) {
    this.validateInitialValue(start, "Start date is invalid");
    this.validateInitialValue(end, "End date is invalid");

    const OPEN_OFFICE_HOUR = 7;
    const CLOSE_OFFICE_HOUR = 18;

    const openOfficeHour = this.getStartOfAnHour(start, OPEN_OFFICE_HOUR);
    const closeOfficeHour = this.getStartOfAnHour(start, CLOSE_OFFICE_HOUR);

    if (!dayjs(new Date()).isBefore(end)) {
      throw new BadRequestException("Past visits are not allowed");
    }

    if (openOfficeHour.isAfter(start) || closeOfficeHour.isBefore(end)) {
      throw new BadRequestException(
        `Visit must be between ${openOfficeHour.toString()} and ${closeOfficeHour.toString()} timeframe`
      );
    }

    if (dayjs(end).isBefore(start)) {
      throw new BadRequestException("Visit start time must be before visit end time");
    }

    if (dayjs(start).diff(end) === 0) {
      throw new BadRequestException("Visit start time and end time must be different");
    }
  }

  static from(start: string, end: string) {
    VisitTimeframe.validate(start, end);

    return new VisitTimeframe(new Date(start), new Date(end));
  }

  isValidCheckInTime(): boolean {
    return dayjs().isAfter(this.start) && dayjs().isBefore(this.end);
  }

  valueOf() {
    return {
      start: this.start.toISOString(),
      end: this.end.toISOString()
    };
  }
}
