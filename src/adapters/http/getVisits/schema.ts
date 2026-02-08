import joi from "joi";

export const schema = joi
  .object({
    limit: joi.string(),
    cursor: joi.string()
  })
  .allow(null)
  .required();
