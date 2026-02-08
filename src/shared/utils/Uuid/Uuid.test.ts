import { v4 } from "uuid";

import { Uuid } from "./Uuid";

jest.mock("uuid");

describe("Uuid", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generate", () => {
    test("should return a new UUID", () => {
      // arrange
      const uuidMock = "123e4567-e89b-12d3-a456-426655440000";
      (v4 as jest.Mock).mockReturnValueOnce(uuidMock);

      // act
      const uuid = Uuid.generate();

      // assert
      expect(uuid).toBe(uuidMock);
    });
  });
});
