import joi from "joi";

export const schema = joi
  .object({
    start: joi.string().isoDate().required(),
    end: joi.string().isoDate().required()
  })
  .required();
