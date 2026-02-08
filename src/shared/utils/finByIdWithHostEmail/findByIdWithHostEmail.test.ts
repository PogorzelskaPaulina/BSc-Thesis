import { Attendee } from "../../../adapters/models/Attendee";
import { EmployeeType } from "../../../domain/events/events";
import { NotFoundException } from "../../exceptions/NotFoundException/NotFoundException";
import { findByIdWithHostEmail } from "./findByIdWithHostEmail";

// Mock a sample entity with a host
const entityWithHost: { host: Attendee<EmployeeType> } = {
  host: {
    email: "sample@example.com",
    name: "name",
    type: "employee",
    toPrimitive: jest.fn()
  }
};

// Mock a findByIdFunction that returns the sample entity
const findByIdFunction = async () => entityWithHost;

describe("findByIdWithHostEmail", () => {
  test("should return the entity when requester is the host", async () => {
    // arrange
    const input = {
      id: "sampleId",
      findByIdFunction,
      requesterEmail: "sample@example.com",
      isAdmin: false,
      errorMessage: "Not Found"
    };

    // act
    const result = await findByIdWithHostEmail(
      input.id,
      input.findByIdFunction,
      input.requesterEmail,
      input.isAdmin,
      input.errorMessage
    );

    // assert
    expect(result).toEqual(entityWithHost);
  });

  test("should throw NotFoundException when requester is not the host and not admin", async () => {
    // arrange
    const input = {
      id: "sampleId",
      findByIdFunction,
      requesterEmail: "other@example.com",
      isAdmin: false,
      errorMessage: "Not Found"
    };

    // act, assert
    await expect(async () =>
      findByIdWithHostEmail(
        input.id,
        input.findByIdFunction,
        input.requesterEmail,
        input.isAdmin,
        input.errorMessage
      )
    ).rejects.toThrow(NotFoundException);
  });

  test("should return the entity when requester is not the host but is an admin", async () => {
    // arrange
    const input = {
      id: "sampleId",
      findByIdFunction,
      requesterEmail: "other@example.com",
      isAdmin: true,
      errorMessage: "Not Found"
    };

    // act
    const result = await findByIdWithHostEmail(
      input.id,
      input.findByIdFunction,
      input.requesterEmail,
      input.isAdmin,
      input.errorMessage
    );

    // assert
    expect(result).toEqual(entityWithHost);
  });
});
