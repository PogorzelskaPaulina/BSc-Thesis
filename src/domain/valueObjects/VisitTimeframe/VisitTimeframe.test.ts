import dayjs from "dayjs";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";
import { VisitTimeframe } from "./VisitTimeframe";

const getTomorrowsFormattedDate = () => {
  return dayjs().add(1, "day").format("YYYY-MM-DD");
};

describe("VisitTimeframe", () => {
  describe("from", () => {
    test("should throw an error if invalid start date is passed", () => {
      const start = "";
      const end = `${getTomorrowsFormattedDate()}T19:00:00.000Z`;

      expect(() => VisitTimeframe.from(start, end)).toThrow(BadRequestException);
    });

    test("should throw an error if invalid end date is passed", () => {
      const start = `${getTomorrowsFormattedDate()}T06:00:00.000Z`;
      const end = "";

      expect(() => VisitTimeframe.from(start, end)).toThrow(BadRequestException);
    });

    test("should throw an error if invalid start and end date is passed", () => {
      const start = "";
      const end = "";

      expect(() => VisitTimeframe.from(start, end)).toThrow(BadRequestException);
    });

    test("should throw an error if the visit start hour is in the past", () => {
      // arrange
      const start = "2023-01-01T06:00:00.000Z";
      const end = `${getTomorrowsFormattedDate()}T19:00:00.000Z`;

      // act, assert
      expect(() => VisitTimeframe.from(start, end)).toThrow(BadRequestException);
    });

    // test("should throw an error if the visit is not during office hours", () => {
    //   // arrange
    //   const start = `${getTomorrowsFormattedDate()}T06:00:00.000Z`;
    //   const end = `${getTomorrowsFormattedDate()}T19:00:00.000Z`;

    //   // act, assert
    //   expect(() => VisitTimeframe.from(start, end)).toThrow(BadRequestException);
    // });

    test("should throw an error if the visit start time is after the end time", () => {
      // arrange
      const start = `${getTomorrowsFormattedDate()}T10:00:00.000Z`;
      const end = `${getTomorrowsFormattedDate()}T09:00:00.000Z`;
      // act, assert
      expect(() => VisitTimeframe.from(start, end)).toThrow(BadRequestException);
      expect(() => VisitTimeframe.from(start, end)).toThrow(
        "Visit start time must be before visit end time"
      );
    });

    test("should throw an error if the visit start and end times are the same", () => {
      // arrange
      const start = `${getTomorrowsFormattedDate()}T10:00:00.000Z`;
      const end = `${getTomorrowsFormattedDate()}T10:00:00.000Z`;

      // act, assert
      expect(() => VisitTimeframe.from(start, end)).toThrow(BadRequestException);
      expect(() => VisitTimeframe.from(start, end)).toThrow(
        "Visit start time and end time must be different"
      );
    });

    test("should return a VisitTimeframe object if the visit is valid", () => {
      // arrange
      const start = `${getTomorrowsFormattedDate()}T10:00:00.000Z`;
      const end = `${getTomorrowsFormattedDate()}T11:00:00.000Z`;

      // act
      const visit = VisitTimeframe.from(start, end);

      // assert
      expect(visit).toBeInstanceOf(VisitTimeframe);
      expect(visit.valueOf()).toEqual({ start, end });
    });
  });
});
