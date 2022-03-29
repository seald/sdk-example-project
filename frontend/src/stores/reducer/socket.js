import produce from 'immer'

import {
  CLOSE_DIALOG_ROOM,
  FAILED_DIALOG_ROOM,
  SET_AUTH,
  SET_ROOM_NAME,
  SET_USERS,
  SET_ROOMS,
  START_ADD_DIALOG_ROOM,
  START_EDIT_DIALOG_ROOM,
  SUCCESS_DIALOG_ROOM,
  TOGGLE_SELECTED_USERS_ROOM,
  EDIT_OR_ADD_ROOM, REMOVE_ROOM, SET_SOCKET, RESET_SOCKET, ADD_USER
} from './constants'

const reducer = (state = {}, action) =>
  produce(state, draft => {
    switch (action.type) {
      case SET_ROOMS:
        draft.rooms = action.payload.rooms
        break
      case EDIT_OR_ADD_ROOM: {
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
        break
      }
      case REMOVE_ROOM: {
        const { roomId } = action.payload
        const roomIdx = draft.rooms.findIndex(r => r.id === roomId)
        if (roomIdx !== -1) draft.rooms.splice(roomIdx, 1)
        draft.rooms = [...draft.rooms]
        break
      }
      case SET_AUTH:
        draft.currentUser = action.payload.currentUser
        break
      case SET_USERS:
        draft.users = action.payload.users
        break
      case ADD_USER:
        if (draft.users.findIndex(u => u.id === action.payload.user.id) === -1) draft.users = [...draft.users, action.payload.user]
        break
      case START_EDIT_DIALOG_ROOM: {
        const { selectedUsersId, name, room, sealdSession } = action.payload
        draft.dialogRoom.room = room
        draft.dialogRoom.selectedUsersId = Array.from(selectedUsersId)
        draft.dialogRoom.oldUidUsers = Array.from(selectedUsersId)
        draft.dialogRoom.name = name
        draft.dialogRoom.isOpen = true
        draft.dialogRoom.sealdSession = sealdSession
        break
      }
      case START_ADD_DIALOG_ROOM:
        draft.dialogRoom.isOpen = true
        draft.dialogRoom.room = null
        draft.dialogRoom.selectedUsersId = []
        draft.dialogRoom.name = ''
        break
      case CLOSE_DIALOG_ROOM:
        draft.dialogRoom.isOpen = false
        break
      case TOGGLE_SELECTED_USERS_ROOM: {
        const { id } = action.payload
        const currentIndex = state.dialogRoom.selectedUsersId.indexOf(id)
        if (currentIndex === -1) draft.dialogRoom.selectedUsersId.push(id)
        else draft.dialogRoom.selectedUsersId.splice(currentIndex, 1)
        break
      }
      case SET_ROOM_NAME: {
        const { name } = action.payload
        draft.dialogRoom.name = name
        break
      }
      case SUCCESS_DIALOG_ROOM:
        draft.dialogRoom = {
          isOpen: false,
          room: null,
          selectedUsersId: [],
          name: '',
          isLoading: false,
          oldUidUsers: []
        }
        break
      case FAILED_DIALOG_ROOM:
        draft.dialogRoom.isLoading = false
        break
      case SET_SOCKET:
        draft.socket = action.payload
        break
      case RESET_SOCKET:
        draft.socket = null
        break
      default:
        break
    }
    return draft
  })

export default reducer
