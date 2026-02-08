import { checkForEnv } from "./checkForEnv";

describe("checkForEnv", () => {
  test("should return the variable when given a non-empty string", () => {
    // arrange
    const variable = "some value";

    // assert
    expect(checkForEnv(variable)).toBe(variable);
  });

  test("should throw an error when given an empty string", () => {
    // arrange
    const variable = "";

    // assert
    expect(() => checkForEnv(variable)).toThrow("Missing env variable");
  });

  test("should throw an error when given undefined", () => {
    // arrange
    const variable = undefined;

    // assert
    expect(() => checkForEnv(variable)).toThrow("Missing env variable");
  });
});
