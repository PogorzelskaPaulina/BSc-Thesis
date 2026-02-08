import joi from "joi";

export const schema = joi
  .object({
    pinCode: joi.string().length(6).required()
  })
  .required();
