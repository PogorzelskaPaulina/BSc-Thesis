/* eslint-disable no-console */
import * as fs from "fs";
import ts from "typescript";
import j2j from "joi-to-json";
import * as vm from "vm";
import joi from "joi";

const inputArray = [
  {
    path: "./src/shared/utils/validateVisitInvitationRequest/schema.ts",
    outputFile: "./src/adapters/http/acceptVisitInvitation/schema.json"
  },
  {
    path: "./src/adapters/http/createVisit/schema.ts",
    outputFile: "./src/adapters/http/createVisit/schema.json"
  },
  {
    path: "./src/adapters/http/createVisitRequest/schema.ts",
    outputFile: "./src/adapters/http/createVisitRequest/schema.json"
  },
  {
    path: "./src/shared/utils/validateVisitInvitationRequest/schema.ts",
    outputFile: "./src/adapters/http/declineVisitInvitation/schema.json"
  },
  {
    path: "./src/adapters/http/changeVisitTimeframe/schema.ts",
    outputFile: "./src/adapters/http/changeVisitTimeframe/schema.json"
  },
  {
    path: "./src/shared/utils/FCMTokenSchema/schema.ts",
    outputFile: "./src/adapters/http/addFCMToken/schema.json"
  },
  {
    path: "./src/shared/utils/FCMTokenSchema/schema.ts",
    outputFile: "./src/adapters/http/removeFCMToken/schema.json"
  },
  {
    path: "./src/adapters/http/requestAuditLog/schema.ts",
    outputFile: "./src/adapters/http/requestAuditLog/schema.json"
  },
  {
    path: "./src/adapters/http/checkInVisitor/schema.ts",
    outputFile: "./src/adapters/http/checkInVisitor/schema.json"
  },
  {
    path: "./src/adapters/http/changeVisitGuests/schema.ts",
    outputFile: "./src/adapters/http/changeVisitGuests/schema.json"
  }
];

const getDeclarationOrUndefined = (sourceFile: ts.SourceFile) => {
  return sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) {
      return undefined;
    }
    return node.declarationList.declarations.find((declaration) => {
      return declaration.name.getText() === "schema";
    });
  });
};

const getJoiSchema = (path: string, source: string) => {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const declaration = getDeclarationOrUndefined(sourceFile);
  if (!declaration) {
    return undefined;
  }
  const start = declaration.initializer?.getStart();
  const end = declaration.initializer?.getEnd();
  return sourceFile.text.slice(start, end);
};

const convertJoiToSchema = () => {
  inputArray.forEach(({ path, outputFile }) => {
    const source = fs.readFileSync(path, "utf8");
    const schema = getJoiSchema(path, source);
    if (schema) {
      const sandbox = {
        require,
        module: { exports: {} },
        console,
        joi
      };
      vm.runInNewContext(`module.exports.schema = ${schema}`, sandbox);
      const joiSchema = (sandbox.module.exports as { schema: object }).schema;
      const jsonSchema = j2j(joiSchema);
      fs.writeFile(outputFile, JSON.stringify(jsonSchema, null, 2), (err) => {
        if (err) {
          console.error("Error writing file:", err);
        }
      });
    } else {
      console.error(`The 'schema' constant was not found in ${path}.`);
    }
  });
};

convertJoiToSchema();
