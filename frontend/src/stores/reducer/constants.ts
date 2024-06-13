import type { Room, User } from '../../services/api.ts'
import type { SocketType } from '../SocketContext.tsx'

export enum SocketActionKind {
  SET_AUTH = 'SET_AUTH',
  SET_USERS = 'SET_USERS',
  START_ADD_DIALOG_ROOM = 'START_ADD_DIALOG_ROOM',
  START_EDIT_DIALOG_ROOM = 'START_EDIT_DIALOG_ROOM',
  CLOSE_DIALOG_ROOM = 'CLOSE_DIALOG_ROOM',
  TOGGLE_SELECTED_USERS_ROOM = 'TOGGLE_SELECTED_USERS_ROOM',
  SET_ROOM_NAME = 'SET_ROOM_NAME',
  SUCCESS_DIALOG_ROOM = 'SUCCESS_DIALOG_ROOM',
  FAILED_DIALOG_ROOM = 'FAILED_DIALOG_ROOM',
  SET_ROOMS = 'SET_ROOMS',
  EDIT_OR_ADD_ROOM = 'EDIT_OR_ADD_ROOM',
  REMOVE_ROOM = 'REMOVE_ROOM',
  SET_SOCKET = 'SET_SOCKET',
  RESET_SOCKET = 'RESET_SOCKET',
  ADD_USER = 'ADD_USER',
}

export interface SET_AUTH_ACTION { type: SocketActionKind.SET_AUTH, payload: { currentUser: User | null } }
export interface SET_USERS_ACTION { type: SocketActionKind.SET_USERS, payload: { users: User[] } }
export interface START_ADD_DIALOG_ROOM_ACTION { type: SocketActionKind.START_ADD_DIALOG_ROOM }
export interface START_EDIT_DIALOG_ROOM_ACTION { type: SocketActionKind.START_EDIT_DIALOG_ROOM, payload: { selectedUsers: string[], name: string, room: Room | null } }
export interface CLOSE_DIALOG_ROOM_ACTION { type: SocketActionKind.CLOSE_DIALOG_ROOM }
export interface TOGGLE_SELECTED_USERS_ROOM_ACTION { type: SocketActionKind.TOGGLE_SELECTED_USERS_ROOM, payload: string }
export interface SET_ROOM_NAME_ACTION { type: SocketActionKind.SET_ROOM_NAME, payload: { name: string } }
export interface SUCCESS_DIALOG_ROOM_ACTION { type: SocketActionKind.SUCCESS_DIALOG_ROOM }
export interface FAILED_DIALOG_ROOM_ACTION { type: SocketActionKind.FAILED_DIALOG_ROOM }
export interface SET_ROOMS_ACTION { type: SocketActionKind.SET_ROOMS, payload: { rooms: Room[] } }
export interface EDIT_OR_ADD_ROOM_ACTION { type: SocketActionKind.EDIT_OR_ADD_ROOM, payload: { room: Room } }
export interface REMOVE_ROOM_ACTION { type: SocketActionKind.REMOVE_ROOM, payload: { roomId: string } }
export interface SET_SOCKET_ACTION { type: SocketActionKind.SET_SOCKET, payload: SocketType | null }
export interface RESET_SOCKET_ACTION { type: SocketActionKind.RESET_SOCKET }
export interface ADD_USER_ACTION { type: SocketActionKind.ADD_USER, payload: { user: User } }

export type ActionsType =
  SET_AUTH_ACTION |
  SET_USERS_ACTION |
  START_ADD_DIALOG_ROOM_ACTION |
  START_EDIT_DIALOG_ROOM_ACTION |
  CLOSE_DIALOG_ROOM_ACTION |
  TOGGLE_SELECTED_USERS_ROOM_ACTION |
  SET_ROOM_NAME_ACTION |
  SUCCESS_DIALOG_ROOM_ACTION |
  FAILED_DIALOG_ROOM_ACTION |
  SET_ROOMS_ACTION |
  EDIT_OR_ADD_ROOM_ACTION |
  REMOVE_ROOM_ACTION |
  SET_SOCKET_ACTION |
  RESET_SOCKET_ACTION |
  ADD_USER_ACTION
