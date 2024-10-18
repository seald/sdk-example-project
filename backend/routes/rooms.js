import express from 'express'
import { isAuthenticatedMiddleware } from '../middlewares/authentication.js'
import { Room, User, ValidationError } from '../models.js'
const router = express.Router()

router.use(isAuthenticatedMiddleware)

// get rooms
router.get('', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.user.id)
    const rooms = await user.getRooms({ include: [User] })
    res.json({ rooms: rooms.map(r => r.serialize()) })
  } catch (err) {
    next(err)
  }
})

// list messages of a room
router.get('/:id/messages', async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id)
    if (!room) return res.status(404).json({ detail: 'Room not found' })
    const roomUsers = await room.getUsers()
    if (room.ownerId === req.session.user.id || roomUsers.some(user => user.id === req.session.user.id)) {
      // Authenticated user has rights to retrieve messages from the room
      const messages = await room.getMessages()
      const serializedMessages = []
      for (const message of messages) {
        if (message.uploadId) serializedMessages.push({ ...message.serialize(), uploadFileName: (await message.getUpload()).fileName })
        else serializedMessages.push(message.serialize())
      }
      return res.json(serializedMessages)
    } else return res.status(404).json({ detail: 'Room not found' })
  } catch (err) {
    if (err instanceof ValidationError) res.status(400).json({ detail: err.toString() })
    else next(err)
  }
})

export default router
