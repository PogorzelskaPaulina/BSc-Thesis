import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Room } from "../../models/Room";
import { DynamoRoomRepository } from "./DynamoRoomRepository";
import { dynamoDbTestConfig } from "../../../shared/tests/dynamoDbTestConfig";
import { Paginated } from "../../../shared/types/Pagination";
import { BadRequestException } from "../../../shared/exceptions/BadRequestException/BadRequestException";

const room = Room.create({ id: "5b5d3774-6a7f-4c82-8f58-b88917a251bf", name: "" });
const room2 = Room.create({
  id: "929929e6-1c38-48b8-acbe-09fe6524bb69",
  name: "",
  isAvailable: true
});
const testTableName = "test-room-table";

let dynamoRoomRepository: DynamoRoomRepository;

const populateTable = async () => {
  const documentClient = new DocumentClient(dynamoDbTestConfig);
  await documentClient
    .put({
      TableName: testTableName,
      Item: room.toPrimitive()
    })
    .promise();
  await documentClient
    .put({
      TableName: testTableName,
      Item: room2.toPrimitive()
    })
    .promise();
};

describe("DynamoRoomRepository", () => {
  beforeAll(async () => {
    // arrange
    await populateTable();
    process.env.ROOM_TABLE = testTableName;

    dynamoRoomRepository = new DynamoRoomRepository();
  });

  test("should find it", async () => {
    // act
    const foundRoom = await dynamoRoomRepository.findById(room.id);

    // assert
    expect(foundRoom).toStrictEqual(room);
  });

  test("should throw an error when not found", async () => {
    // act, assert
    await expect(dynamoRoomRepository.findById("not-known-id")).rejects.toThrow("Room not found");
  });

  test("should find all rooms", async () => {
    // arrange
    const { isAvailable, ...props } = room;
    const roomWithOnlyCorrectlyPersistedData = Room.create(props);

    // act
    const rooms = await dynamoRoomRepository.findAll();

    // assert
    expect(rooms).toStrictEqual({
      cursor: null,
      items: expect.arrayContaining([room, roomWithOnlyCorrectlyPersistedData])
    });
  });

  describe("pagination", () => {
    let firstRoom: Paginated<Room>;
    let secondRoom: Paginated<Room>;
    test("should find first room", async () => {
      // act
      firstRoom = await dynamoRoomRepository.findAll({ limit: "1" });

      // assert
      expect(firstRoom.cursor).toEqual(expect.any(String));
      expect(firstRoom.items).toHaveLength(1);
    });

    test("should throw an error when provided cursor is invalid", async () => {
      // arrange
      const invalidCursor = "invalidCursor";
      const invalidSchemaCursor = "%7B%22id%22:%22invalidId%22%7D";

      // act, assert
      await expect(
        dynamoRoomRepository.findAll({ limit: "1", cursor: invalidCursor })
      ).rejects.toThrow(BadRequestException);
      await expect(
        dynamoRoomRepository.findAll({ limit: "1", cursor: invalidSchemaCursor })
      ).rejects.toThrow(BadRequestException);
    });

    test("should throw an error when provided limit is bigger then allowed one", async () => {
      // arrange
      const biggerThenAllowedLimit = "100";

      // act, assert
      await expect(
        dynamoRoomRepository.findAll({ limit: biggerThenAllowedLimit })
      ).rejects.toThrow();
    });

    test("should find second room", async () => {
      // act
      secondRoom = await dynamoRoomRepository.findAll({ limit: "1", cursor: firstRoom.cursor });

      // assert
      expect(secondRoom.cursor).toStrictEqual(null);
      expect(secondRoom.items).toHaveLength(1);
    });

    test("all found rooms should be equal to all stored rooms", () => {
      // arrange
      const { isAvailable, ...props } = room;
      const roomWithOnlyCorrectlyPersistedData = Room.create(props);

      // assert
      expect([...firstRoom.items, ...secondRoom.items]).toStrictEqual(
        expect.arrayContaining([room, roomWithOnlyCorrectlyPersistedData])
      );
    });
  });
});
