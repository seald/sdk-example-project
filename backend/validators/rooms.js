import Joi from 'joi'

export const socketCreateMultiUsersRoomValidator = Joi.object({
  users: Joi.when('one2one', {
    is: true,
    then: Joi.array().items(Joi.string().uuid({ version: 'uuidv4' })).length(1),
    otherwise: Joi.array().items(Joi.string().uuid({ version: 'uuidv4' }))
  }),
  name: Joi.string().max(255)
})

export const socketCreateOne2OneRoomValidator = Joi.object({
  userId: Joi.string().uuid({ version: 'uuidv4' }).required()
})

export const socketRoomEditValidator = Joi.object({
  roomId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  name: Joi.string().max(255),
  users: Joi.array().items(Joi.string().uuid({ version: 'uuidv4' }))
})

export const socketPostMessageValidator = Joi.object({
  content: Joi.string().required(),
  uploadId: Joi.string().uuid({ version: 'uuidv4' }),
  roomId: Joi.string().uuid({ version: 'uuidv4' }).required()
})

export const socketRemoveRoomValidator = Joi.object({
  roomId: Joi.string().uuid({ version: 'uuidv4' }).required()
})
