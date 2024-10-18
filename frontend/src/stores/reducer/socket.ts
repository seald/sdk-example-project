import { produce } from 'immer'

import { type ActionsType, SocketActionKind } from './constants'
import type { SocketContextType } from '../SocketContext.tsx'

const reducer = (state: SocketContextType, action: ActionsType): SocketContextType =>
  produce(state, draft => {
    switch (action.type) {
      case SocketActionKind.SET_ROOMS:
        draft.rooms = action.payload.rooms
        break
      case SocketActionKind.EDIT_OR_ADD_ROOM: {
        if (draft.currentUser != null) {
          const roomIdx = draft.rooms.findIndex(r => r.id === action.payload.room.id)
          if (action.payload.room.users.includes(draft.currentUser.id)) {
            if (roomIdx !== -1) {
              draft.rooms.splice(roomIdx, 1, action.payload.room)
              draft.rooms = Array.from(draft.rooms)
            } else draft.rooms = [...draft.rooms, action.payload.room]
          } else if (roomIdx !== -1) {
            draft.rooms.splice(roomIdx, 1)
            draft.rooms = Array.from(draft.rooms)
          }
        }
        break
      }
      case SocketActionKind.REMOVE_ROOM: {
        const { roomId } = action.payload
        const roomIdx = draft.rooms.findIndex(r => r.id === roomId)
        if (roomIdx !== -1) draft.rooms.splice(roomIdx, 1)
        draft.rooms = [...draft.rooms]
        break
      }
      case SocketActionKind.SET_AUTH:
        draft.currentUser = action.payload.currentUser
        break
      case SocketActionKind.SET_USERS:
        draft.users = action.payload.users
        break
      case SocketActionKind.ADD_USER:
        if (draft.users.findIndex(u => u.id === action.payload.user.id) === -1) draft.users = [...draft.users, action.payload.user]
        break
      case SocketActionKind.START_EDIT_DIALOG_ROOM: {
        const { selectedUsers, name, room } = action.payload
        draft.dialogRoom.room = room
        draft.dialogRoom.selectedUsers = Array.from(selectedUsers)
        draft.dialogRoom.oldUsers = Array.from(selectedUsers)
        draft.dialogRoom.name = name
        draft.dialogRoom.isOpen = true
        break
      }
      case SocketActionKind.START_ADD_DIALOG_ROOM:
        draft.dialogRoom.isOpen = true
        draft.dialogRoom.room = null
        draft.dialogRoom.selectedUsers = []
        draft.dialogRoom.name = ''
        break
      case SocketActionKind.CLOSE_DIALOG_ROOM:
        draft.dialogRoom.isOpen = false
        break
      case SocketActionKind.TOGGLE_SELECTED_USERS_ROOM: {
        const user = action.payload
        const currentIndex = state.dialogRoom.selectedUsers.indexOf(user)
        if (currentIndex === -1) draft.dialogRoom.selectedUsers.push(user)
        else draft.dialogRoom.selectedUsers.splice(currentIndex, 1)
        break
      }
      case SocketActionKind.SET_ROOM_NAME: {
        const { name } = action.payload
        draft.dialogRoom.name = name
        break
      }
      case SocketActionKind.SUCCESS_DIALOG_ROOM:
        draft.dialogRoom = {
          isOpen: false,
          room: null,
          selectedUsers: [],
          name: '',
          isLoading: false,
          oldUsers: []
        }
        break
      case SocketActionKind.FAILED_DIALOG_ROOM:
        draft.dialogRoom.isLoading = false
        break
      case SocketActionKind.SET_SOCKET:
        // @ts-expect-error immer somehow prevents types from matching
        draft.socket = action.payload
        break
      case SocketActionKind.RESET_SOCKET:
        draft.socket = null
        break
      default:
        break
    }
    return draft
  })

export default reducer
