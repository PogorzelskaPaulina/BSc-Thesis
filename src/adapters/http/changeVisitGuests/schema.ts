import joi from "joi";

export const schema = joi
  .object({
    guestsEmails: joi.array().items(joi.string().email()).required()
  })
  .required();
