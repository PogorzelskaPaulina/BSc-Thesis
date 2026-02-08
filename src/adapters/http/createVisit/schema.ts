import joi from "joi";

export const schema = joi
  .object({
    title: joi.string().required(),
    timeframe: joi
      .object({
        start: joi.string().isoDate().required(),
        end: joi.string().isoDate().required()
      })
      .required(),
    hostEmail: joi.string().email(),
    guestsEmails: joi.array().items(joi.string().email()).required(),
    roomId: joi.string().uuid()
  })
  .required();
