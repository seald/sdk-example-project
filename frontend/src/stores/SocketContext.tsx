import React, { useReducer, type PropsWithChildren, type ReactNode } from 'react'

import reducer from './reducer/socket'
import type { Socket } from 'socket.io-client'
import type { MessageTypeAPI, Room, RoomType, User, UserType } from '../services/api.ts'
import type { ActionsType } from './reducer/constants.ts'

export interface ServerToClientEvents {
  'room:removed': (payload: { roomId: string }) => void | Promise<void>
  'room:messageSent': (payload: MessageTypeAPI) => void | Promise<void>
  'user:created': (payload: UserType) => void | Promise<void>
  'room:created': (payload: RoomType) => void | Promise<void>
  'room:edited': (payload: RoomType) => void | Promise<void>
}

export type ResponseWrapper<T> = { status: 'ok', result: T } | { status: 'ko', error?: string }

type Handler<PAYLOAD, RESPONSE = never> = RESPONSE extends never ? (payload: PAYLOAD) => void : (payload: PAYLOAD, callback: (response: RESPONSE) => void) => void
export interface CreateMultiUsersEvent { eventName: 'room:createMultiUsers', payload: { name: string, users: string[] }, response: RoomType }
export interface CreateOne2OneEvent { eventName: 'room:createOne2One', payload: { userId: string }, response: RoomType }
export interface PostMessageEvent { eventName: 'room:postMessage', payload: { roomId: string, content: string, uploadId?: string }, response: MessageTypeAPI }
export interface RoomEditEvent { eventName: 'room:edit', payload: { roomId: string, name?: string, users?: string[] }, response: RoomType }
export interface RoomRemoveEvent { eventName: 'room:remove', payload: { roomId: string }, response: { roomId: string } }

export type ClientToServerEventsType = CreateMultiUsersEvent |
CreateOne2OneEvent |
PostMessageEvent |
RoomEditEvent |
RoomRemoveEvent

export type ClientToServerEvents = { [A in ClientToServerEventsType as A['eventName']]: Handler<A['payload'], A['response']> }

export type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

export interface SocketContextType {
  readonly socket: null | SocketType
  readonly currentUser: null | User
  readonly users: User[]
  readonly rooms: Room[]
  readonly dialogRoom: {
    room: null | Room
    isOpen: boolean
    selectedUsers: string[]
    name: string
    isLoading: boolean
    oldUsers: string[]
  }
}

const initialState: SocketContextType = {
  socket: null,
  currentUser: null,
  users: [],
  rooms: [],
  dialogRoom: {
    room: null,
    isOpen: false,
    selectedUsers: [],
    name: '',
    isLoading: false,
    oldUsers: []
  }
}

export const SocketContext = React.createContext<[SocketContextType, React.Dispatch<ActionsType>]>([initialState, () => undefined])

const SocketContextProvider = ({ children }: PropsWithChildren<Record<string, unknown>>): ReactNode => {
  const [state, updater] = useReducer(reducer, initialState)
  return <SocketContext.Provider value={[state, updater]}>{children}</SocketContext.Provider>
}
export default SocketContextProvider
