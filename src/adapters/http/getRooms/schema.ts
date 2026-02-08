import joi from "joi";

export const schema = joi
  .object({
    startDate: joi.string().isoDate().required(),
    endDate: joi.string().isoDate().required(),
    limit: joi.string(),
    cursor: joi.string()
  })
  .required();
