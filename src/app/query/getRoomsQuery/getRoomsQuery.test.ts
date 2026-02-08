import { createMock } from "ts-auto-mock";
import { Room } from "../../../adapters/models/Room";
import { RoomReservation } from "../../../adapters/models/RoomReservation";
import { RoomRepository } from "../../../ports/database/RoomRepository";
import { RoomReservationRepository } from "../../../ports/database/RoomReservationRepository";
import { mockEndISODate, mockStartISODate } from "../../../shared/tests/mockDates";
import { getRoomsQuery } from "./getRoomsQuery";

const room1 = Room.create({ id: "id1", name: "" });
const room2 = Room.create({ id: "id2", name: "" });

const room1Reservation = RoomReservation.createFromVisitEvent({
  visitId: "visitId",
  roomId: room1.id,
  dateEnd: mockEndISODate,
  dateStart: mockStartISODate
});

const roomRepository = createMock<RoomRepository>({
  findAll: async () => ({ cursor: null, items: [room1, room2] })
});

const roomReservationRepository = createMock<RoomReservationRepository>({
  findReservations: async () => [room1Reservation]
});

describe("getRoomsQuery", () => {
  test("should return all rooms with correct availability status", async () => {
    // arrange
    const room1WithAvailability = Room.create({ ...room1, isAvailable: false });
    const room2WithAvailability = Room.create({ ...room2, isAvailable: true });

    // act
    const rooms = await getRoomsQuery(
      { startDate: mockStartISODate, endDate: mockEndISODate },
      { roomRepository, roomReservationRepository }
    );

    // assert
    expect(rooms).toStrictEqual({
      cursor: null,
      rooms: [room1WithAvailability, room2WithAvailability]
    });
  });
});
