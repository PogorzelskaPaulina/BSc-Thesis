import { sliceIntoChunks } from "./sliceIntoChunks";

describe("sliceIntoChunks", () => {
  test("should return an empty array when the input array is empty", () => {
    // arrange
    const messages: number[] = [];
    const chunksSize = 2;

    // act
    const result = sliceIntoChunks(messages, chunksSize);

    // assert
    expect(result).toEqual([]);
  });

  test("should return the original array when chunksSize is greater than the array length", () => {
    // arrange
    const messages = [1, 2, 3];
    const chunksSize = 5;

    // act
    const result = sliceIntoChunks(messages, chunksSize);

    // assert
    expect(result).toEqual([[1, 2, 3]]);
  });

  test("should split the input array into chunks of size chunksSize", () => {
    // arrange
    const messages = [1, 2, 3, 4, 5, 6];
    const chunksSize = 2;

    // act
    const result = sliceIntoChunks(messages, chunksSize);

    // assert
    expect(result).toEqual([
      [1, 2],
      [3, 4],
      [5, 6]
    ]);
  });

  test("should return any extra elements in the input array that do not fit into a whole chunk", () => {
    // arrange
    const messages = [1, 2, 3, 4, 5];
    const chunksSize = 2;

    // act
    const result = sliceIntoChunks(messages, chunksSize);

    // assert
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });
});
