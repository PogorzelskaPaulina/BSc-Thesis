import joi from "joi";

export const schema = joi
  .object({
    id: joi.string().uuid().required()
  })
  .required();
