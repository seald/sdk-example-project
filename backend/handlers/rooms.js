import {
  socketCreateMultiUsersRoomValidator,
  socketCreateOne2OneRoomValidator,
  socketPostMessageValidator,
  socketRemoveRoomValidator,
  socketRoomEditValidator
} from '../validators/rooms.js'
import { Message, Room, User } from '../models.js'

const wrapHandler = (socket, handler) => async (payload, acknowledge) => {
  if (!socket.request.session || !socket.request.session.user) {
    acknowledge({
      status: 'ko',
      error: 'Not authenticated, disconnecting'
    })
    socket.disconnect()
  }
  try {
    acknowledge({
      status: 'ok',
      result: await handler(payload)
    })
  } catch (error) {
    acknowledge({
      status: 'ko',
      error: error.toString()
    })
  }
}

export default async (io, socket) => {
  const user = await User.findByPk(socket.request.session.user.id)
  socket.join(user.id)
  const rooms = await user.getRooms()
  socket.join(rooms.map(r => r.id))

  const createMultiUsersRoom = async payload => {
    const { error, value } = socketCreateMultiUsersRoomValidator.validate(payload)
    if (error) throw error
    const { users, name } = value
    const room = await Room.createMultiUserRoom(user.id, users, name)
    io.in([user.id, ...users]).socketsJoin(room.id)
    const serialization = (await Room.findByPk(room.id, { include: [User] })).serialize()
    io.to(room.id).emit('room:created', serialization)
    return serialization
  }
  const createOne2OneRoom = async payload => {
    const { error, value } = socketCreateOne2OneRoomValidator.validate(payload)
    if (error) throw error
    const { userId } = value
    const room = await Room.createOne2OneRoom(user.id, userId)
    io.in([user.id, userId]).socketsJoin(room.id)
    const serialization = (await Room.findByPk(room.id, { include: [User] })).serialize()
    io.to(room.id).emit('room:created', serialization)
    return serialization
  }

  const editRoom = async payload => {
    const { error, value } = socketRoomEditValidator.validate(payload)
    if (error) throw error
    const { name, users, roomId } = value
    const room = await Room.findByPk(roomId, { include: [User] })
    if (!room) throw new Error('Room does not exist')
    if (room.ownerId === socket.request.session.user.id) {
      // Authenticated user has rights to have data on the room
      if (name !== room.name) await room.update({ name })
      if (users) {
        const { usersDeleted, usersAdded } = await room.editUsers(users)
        if (usersAdded.length !== 0) io.in(usersAdded).socketsJoin(room.id)
        io.to(room.id).emit('room:edited', room.serialize())
        if (usersDeleted.length !== 0) io.in(usersDeleted).socketsLeave(room.id)
      }
    }
    return room.serialize()
  }

  const postMessage = async payload => {
    const { error, value } = socketPostMessageValidator.validate(payload)
    if (error) throw error
    const { content, roomId, uploadId } = value
    const rooms = await user.getRooms()
    const room = rooms.find(room => room.id === roomId)
    if (!room) throw new Error('Room not found')
    const message = await Message.create({ senderId: user.id, content, roomId: room.id, uploadId })
    const serializedMessage = message.uploadId
      ? { ...message.serialize(), uploadFileName: (await message.getUpload()).fileName }
      : message.serialize()
    io.to(room.id).emit('room:messageSent', serializedMessage)
    return serializedMessage
  }

  const removeRoom = async payload => {
    const { error, value } = socketRemoveRoomValidator.validate(payload)
    if (error) throw error
    const { roomId } = value
    const room = await Room.findByPk(roomId)
    if (!room) throw new Error('Room not found')
    if (room.ownerId === socket.request.session.user.id) {
      // Authenticated user has rights to destroy the room
      await room.destroy()
      io.to(roomId).emit('room:removed', { roomId })
      io.in(roomId).socketsLeave(roomId)
      return { roomId }
    } else throw new Error('Unauthorized to perform this action')
  }
  socket.on('room:createMultiUsers', wrapHandler(socket, createMultiUsersRoom))
  socket.on('room:createOne2One', wrapHandler(socket, createOne2OneRoom))
  socket.on('room:edit', wrapHandler(socket, editRoom))
  socket.on('room:postMessage', wrapHandler(socket, postMessage))
  socket.on('room:remove', wrapHandler(socket, removeRoom))
}
