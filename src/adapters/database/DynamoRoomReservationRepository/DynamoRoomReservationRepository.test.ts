import { VisitTimeframe } from "../../../domain/valueObjects/VisitTimeframe/VisitTimeframe";
import {
  mockEndISODate,
  mockStartISODate,
  mockStartDate,
  mockEndDate
} from "../../../shared/tests/mockDates";
import { RoomReservation } from "../../models/RoomReservation";
import { DynamoRoomReservationRepository } from "./DynamoRoomReservationRepository";

const minStartHour = 9;
const maxEndHour = 16;

const roomReservation = RoomReservation.createFromVisitEvent({
  roomId: "roomId",
  dateStart: mockStartISODate,
  dateEnd: mockEndISODate,
  visitId: "visitId"
});

const oldestRoomReservation = RoomReservation.createFromVisitEvent({
  roomId: "roomId",
  dateStart: mockStartDate.set("hour", minStartHour).toISOString(),
  dateEnd: mockEndDate.set("hour", minStartHour).set("minute", 30).toISOString(),
  visitId: "visitId2"
});

const newestRoomReservation = RoomReservation.createFromVisitEvent({
  roomId: "roomId",
  dateStart: mockStartDate.set("hour", maxEndHour).set("minute", 15).toISOString(),
  dateEnd: mockEndDate.set("hour", maxEndHour).set("minute", 30).toISOString(),
  visitId: "visitId3"
});

const inBetweenRoomReservation = RoomReservation.createFromVisitEvent({
  roomId: "roomId",
  dateStart: mockStartDate.set("hour", minStartHour).toISOString(),
  dateEnd: mockEndDate.set("hour", 11).toISOString(),
  visitId: "visitId4"
});

const inBetweenRoomReservationDifferentRoom = RoomReservation.createFromVisitEvent({
  roomId: "roomId2",
  dateStart: mockStartDate.set("hour", minStartHour).toISOString(),
  dateEnd: mockEndDate.set("hour", 11).toISOString(),
  visitId: "visitId5"
});

const inBetween2RoomReservation = RoomReservation.createFromVisitEvent({
  roomId: "roomId",
  dateStart: mockStartDate.set("hour", 11).toISOString(),
  dateEnd: mockEndDate.set("hour", 12).toISOString(),
  visitId: "visitId6"
});

const inBetween3RoomReservation = RoomReservation.createFromVisitEvent({
  roomId: "roomId",
  dateStart: mockStartDate.set("hour", 12).toISOString(),
  dateEnd: mockEndDate.set("hour", maxEndHour).toISOString(),
  visitId: "visitId7"
});

const longestRoomReservation = RoomReservation.createFromVisitEvent({
  roomId: "roomId",
  dateStart: mockStartDate.set("hour", minStartHour).toISOString(),
  dateEnd: mockEndDate.set("hour", maxEndHour).toISOString(),
  visitId: "visitId8"
});

let dynamoRoomReservationRepository: DynamoRoomReservationRepository;

describe("DynamoRoomReservationRepository", () => {
  beforeAll(() => {
    // arrange
    process.env.ROOM_RESERVATION_TABLE = "test-room-reservation-table";

    dynamoRoomReservationRepository = new DynamoRoomReservationRepository();
  });

  test("should add room reservation", async () => {
    // act
    await dynamoRoomReservationRepository.create(roomReservation);

    // assert
    const foundRoomReservations = await dynamoRoomReservationRepository.findReservations(
      VisitTimeframe.from(roomReservation.dateStart, roomReservation.dateEnd)
    );
    expect(foundRoomReservations).toStrictEqual([roomReservation]);
  });

  test("should find correct room reservation filtering by timeframe", async () => {
    // arrange
    await dynamoRoomReservationRepository.create(oldestRoomReservation);
    await dynamoRoomReservationRepository.create(newestRoomReservation);
    await dynamoRoomReservationRepository.create(inBetweenRoomReservation);
    await dynamoRoomReservationRepository.create(inBetween2RoomReservation);
    await dynamoRoomReservationRepository.create(inBetween3RoomReservation);
    await dynamoRoomReservationRepository.create(longestRoomReservation);

    // act
    const foundRoomReservations = await dynamoRoomReservationRepository.findReservations(
      VisitTimeframe.from(roomReservation.dateStart, roomReservation.dateEnd)
    );

    // assert
    expect(foundRoomReservations).toEqual(
      expect.arrayContaining([
        longestRoomReservation,
        inBetweenRoomReservation,
        roomReservation,
        inBetween2RoomReservation,
        inBetween3RoomReservation
      ])
    );
  });

  test("should find correct room reservation filtering by timeframe and room id", async () => {
    // arrange
    await dynamoRoomReservationRepository.create(inBetweenRoomReservationDifferentRoom);

    // act
    const foundRoomReservations = await dynamoRoomReservationRepository.findRoomReservations(
      roomReservation.roomId,
      VisitTimeframe.from(roomReservation.dateStart, roomReservation.dateEnd)
    );

    // assert
    expect(foundRoomReservations).toEqual(
      expect.arrayContaining([
        longestRoomReservation,
        inBetweenRoomReservation,
        roomReservation,
        inBetween2RoomReservation,
        inBetween3RoomReservation
      ])
    );
  });
});
