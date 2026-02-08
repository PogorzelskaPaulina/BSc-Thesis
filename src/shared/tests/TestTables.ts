import fs from "fs";
import DynamoDB from "aws-sdk/clients/dynamodb";
import yaml from "js-yaml";
import cloudFormationSchema from "@serverless/utils/cloudformation-schema";
import { dynamoDbTestConfig } from "./dynamoDbTestConfig";

interface DynamoResource {
  Type: string;
  Properties: DynamoDB.Types.CreateTableInput;
}

export class TestTables {
  private readonly dynamoDbClient = new DynamoDB(dynamoDbTestConfig);

  private static getTables() {
    // @ts-ignore
    const [resources] = yaml.loadAll(fs.readFileSync("./src/adapters/database/database.yml"), {
      schema: cloudFormationSchema
    });

    return (resources as { Resources: Record<string, DynamoResource> }).Resources;
  }

  async createTables() {
    await this.deleteTables();

    const resources = TestTables.getTables();

    const createTablesPromises = Object.keys(resources).map((key) => {
      // @ts-ignore
      const { StreamSpecification, TableName, TimeToLiveSpecification, ...properties } =
        resources[key].Properties;

      // eslint-disable-next-line no-template-curly-in-string
      const name = TableName.replace("${self:custom.resourceSlug}", "test");

      return this.dynamoDbClient.createTable({ ...properties, TableName: name }).promise();
    });

    await Promise.all(createTablesPromises);
  }

  private async deleteTable(tableName: string) {
    await this.dynamoDbClient.deleteTable({ TableName: tableName }).promise();
  }

  async deleteTables() {
    const existingTables = await this.dynamoDbClient.listTables().promise();

    const deleteTablesPromises =
      existingTables.TableNames?.map((tableName) => this.deleteTable(tableName)) || [];

    await Promise.all(deleteTablesPromises);
  }
}
