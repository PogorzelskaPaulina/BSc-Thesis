import joi from "joi";

export const schema = joi
  .object({
    invitationId: joi.string().uuid().required()
  })
  .required();
