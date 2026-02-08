import { VisitId } from "./VisitId";

jest.mock("uuid", () => ({ v4: () => "uuid" }));

describe("VisitId", () => {
  test("should generate uuid", () => {
    const id = VisitId.generate();

    expect(id).toBe("uuid");
  });
});
