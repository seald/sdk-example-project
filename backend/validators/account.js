import Joi from 'joi'

export const createAccountValidator = {
  body: Joi.object({
    emailAddress: Joi.string().email().required().max(255),
    name: Joi.string().required().max(255),
    phoneNumber: Joi.string().required().max(15),
    password: Joi.string().required().max(255)
  })
}

export const loginValidator = {
  body: Joi.object({
    emailAddress: Joi.string().email().required().max(255),
    password: Joi.string().required().max(255)
  })
}

export const sealdIdValidator = {
  body: Joi.object({
    sealdId: Joi.string().required().max(255)
  })
}
