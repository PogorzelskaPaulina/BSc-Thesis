import joi from "joi";

export const schema = joi
  .object({
    FCMToken: joi.string().required()
  })
  .required();
