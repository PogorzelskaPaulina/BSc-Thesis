import joi from "joi";

export const schema = joi.object({
  title: joi.string().required(),
  duration: joi.number().valid(15, 30, 45).required(),
  hostEmail: joi.string().required(),
  guest: joi
    .object({ email: joi.string().email().required(), name: joi.string().required() })
    .required()
});
