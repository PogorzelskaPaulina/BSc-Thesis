import { VisitId } from "../../../domain/valueObjects/VisitId/VisitId";
import { transformToPrimitive } from "./transformToPrimitive";

jest.mock("uuid", () => ({
  v4: jest.fn().mockImplementation(() => "random-uuid")
}));

describe("transformToPrimitive", () => {
  test("should return an empty object when given an empty object", () => {
    // Arrange
    const input = {};

    // Act
    const output = transformToPrimitive(input);

    // Assert
    expect(output).toEqual({});
  });

  test("should transform an object with null and undefined values to primitive types", () => {
    // Arrange
    const input = {
      name: null,
      age: undefined,
      isAdmin: true,
      testString: "string",
      testNumber: 18,
      createdAt: new Date("2022-01-01"),
      status: "created",
      id: VisitId.generate()
    };

    // Act
    const output = transformToPrimitive(input);

    // Assert
    expect(output).toEqual({
      name: null,
      age: undefined,
      isAdmin: true,
      testString: "string",
      testNumber: 18,
      createdAt: input.createdAt.valueOf(),
      status: "created",
      id: "random-uuid"
    });
  });
});
