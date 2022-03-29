const Joi = require('joi')

const socketCreateMultiUsersRoomValidator = Joi.object({
  users: Joi.when('one2one', {
    is: true,
    then: Joi.array().items(Joi.string().uuid({ version: 'uuidv4' })).length(1),
    otherwise: Joi.array().items(Joi.string().uuid({ version: 'uuidv4' }))
  }),
  name: Joi.string().max(255)
})

const socketCreateOne2OneRoomValidator = Joi.object({
  userId: Joi.string().uuid({ version: 'uuidv4' }).required()
})

const socketRoomEditValidator = Joi.object({
  roomId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  name: Joi.string().max(255),
  users: Joi.array().items(Joi.string().uuid({ version: 'uuidv4' }))
})

const socketPostMessageValidator = Joi.object({
  content: Joi.string().required(),
  uploadId: Joi.string().uuid({ version: 'uuidv4' }),
  roomId: Joi.string().uuid({ version: 'uuidv4' }).required()
})

const socketRemoveRoomValidator = Joi.object({
  roomId: Joi.string().uuid({ version: 'uuidv4' }).required()
})

module.exports = {
  socketCreateMultiUsersRoomValidator,
  socketCreateOne2OneRoomValidator,
  socketRoomEditValidator,
  socketPostMessageValidator,
  socketRemoveRoomValidator
}
