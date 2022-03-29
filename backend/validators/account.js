const Joi = require('joi')

const createAccountValidator = {
  body: Joi.object({
    emailAddress: Joi.string().email().required().max(255),
    name: Joi.string().required().max(255),
    password: Joi.string().required().max(255)
  })
}

const loginValidator = {
  body: Joi.object({
    emailAddress: Joi.string().email().required().max(255),
    password: Joi.string().required().max(255)
  })
}

module.exports = {
  createAccountValidator,
  loginValidator
}
