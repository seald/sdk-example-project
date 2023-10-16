import React, { useReducer } from 'react'

import reducer from './reducer/socket'

export const SocketContext = React.createContext()

const initialState = {
  socket: null,
  currentUser: null,
  users: [],
  rooms: [],
  dialogRoom: {
    room: undefined,
    isOpen: false,
    selectedUsers: [],
    name: '',
    isLoading: false,
    oldUsers: []
  }
}

function SocketProvider ({ children }) {
  const [state, updater] = useReducer(reducer, initialState)
  return <SocketContext.Provider value={[state, updater]}>{children}</SocketContext.Provider>
}

export default SocketProvider
