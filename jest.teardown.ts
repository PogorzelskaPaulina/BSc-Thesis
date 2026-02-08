import { TestTables } from "./src/shared/tests/TestTables";

export default async () => {
  const testTables = new TestTables();

  await testTables.deleteTables();
};
