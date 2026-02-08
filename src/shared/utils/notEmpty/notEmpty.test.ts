import { notEmpty } from "./notEmpty";

describe("notEmpty", () => {
  test("should return true when given a non-empty value", () => {
    // assert
    expect(notEmpty("hello")).toBe(true);
    expect(notEmpty(123)).toBe(true);
    expect(notEmpty({})).toBe(true);
    expect(notEmpty([])).toBe(true);
    expect(notEmpty(true)).toBe(true);
    expect(notEmpty(false)).toBe(true);
  });

  test("should return false when given null or undefined", () => {
    // assert
    expect(notEmpty(null)).toBe(false);
    expect(notEmpty(undefined)).toBe(false);
  });
});
