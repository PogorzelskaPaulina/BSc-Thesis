import { DynamoRepository } from "./DynamoRepository";

class MockDynamoRepository extends DynamoRepository {
  constructor() {
    super("TEST_TABLE");
  }
}

const getRepository = (isEnvSetup: boolean) => {
  if (isEnvSetup) {
    process.env.TEST_TABLE = "test-table";
  }

  return new MockDynamoRepository();
};

describe("DynamoVisitEventStore", () => {
  test("should not create repository when env is not defined", () => {
    // act, assert
    expect(() => getRepository(false)).toThrow();
  });

  test("should create repository when env is defined", () => {
    // act
    const repository = getRepository(true);

    // assert
    expect(repository).toBeDefined();
  });

  test("should create dynamodb repository without test settings when jest env is not defined", () => {
    // arrange
    const workerId = process.env.JEST_WORKER_ID!;
    delete process.env.JEST_WORKER_ID;

    // act
    const repository = getRepository(true);

    // assert
    expect(repository).toBeDefined();
    process.env.JEST_WORKER_ID = workerId;
  });
});
