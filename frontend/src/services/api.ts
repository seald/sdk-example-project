/* eslint-env browser */
import { io, type Socket } from 'socket.io-client'
import {
  type ClientToServerEvents,
  type ClientToServerEventsType, type CreateMultiUsersEvent, type CreateOne2OneEvent, type PostMessageEvent,
  type ResponseWrapper, type RoomEditEvent, type RoomRemoveEvent,
  type SocketType
} from '../stores/SocketContext.tsx'
import { hashPassword } from '../utils'
import getSetting from '../settings'

const request = async (url: string, method: 'GET' | 'POST' | 'UPLOAD', body?: any, jsonContentType = true): Promise<any> => {
  const cookies = Object.fromEntries(document.cookie.split(/; */).filter(x => x !== '').map(c => {
    const [key, ...v] = c.split('=')
    return [key, decodeURIComponent(v.join('='))]
  }))

  const headers: HeadersInit = {
    Accept: 'application/json',
    'CSRF-Token': cookies['XSRF-TOKEN']
  }

  if (jsonContentType) {
    headers['Content-type'] = 'application/json'
  }

  const _request: RequestInit = {
    headers,
    method
  }

  if (body != null) _request.body = jsonContentType ? JSON.stringify(body) : body
  const response = await fetch(url, _request)
  const json = await response.json()
  if (response.status !== 200) throw new Error(JSON.stringify(json))
  return json
}

export interface CreateAccountType {
  emailAddress: string
  name: string
  password: string
}

export interface LoginType {
  emailAddress: string
  password: string
}

export interface SetSealdIdType {
  sealdId: string
}

export interface UserType {
  id: string
  name: string
  emailAddress: string
  sealdId: string
}

export interface RoomType {
  id: string
  users: string[]
  one2one: boolean
  name: string
  ownerId: string
}

export type MessageTypeAPI =
  {
    id: string
    createdAt: string
    updatedAt: string
    content: string
    senderId: string
    roomId: string
    uploadId: null
  }
  |
  {
    id: string
    createdAt: string
    updatedAt: string
    content: string
    senderId: string
    roomId: string
    uploadId: string
    uploadFileName: string
  }

// APIClient for REST API & IO API
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const APIClient = (baseURL?: string) => {
  const _url = baseURL != null ? new URL(baseURL) : window.location
  baseURL = _url.origin
  const prefixURL = _url.pathname + 'api'

  const GET = async <T> (url: string): Promise<T> => await request(new URL(prefixURL + url, baseURL).toString(), 'GET')
  const POST = async <T, U> (url: string, body?: T): Promise<U> => await request(new URL(prefixURL + url, baseURL).toString(), 'POST', body)
  const UPLOAD = async <T> (url: string, file: Blob): Promise<T> => {
    const body = new FormData()
    body.append('file', file)
    return await request(new URL(prefixURL + url, baseURL).toString(), 'POST', body, false)
  }

  let socket: null | SocketType

  return {
    rest: {
      account: {
        status: async (): Promise<{ user: UserType }> => await GET<{ user: UserType }>('/account'),
        create: async (body: CreateAccountType): Promise<{ user: UserType, signupJWT: string }> => await POST<CreateAccountType, {
          user: UserType
          signupJWT: string
        }>('/account', body),
        login: async (body: LoginType): Promise<{ user: UserType }> => await POST<LoginType, {
          user: UserType
        }>('/account/login', body),
        logout: async (): Promise<{ detail: 'Successfully logged out' }> => await GET<{
          detail: 'Successfully logged out'
        }>('/account/logout'),
        setSealdId: async (body: SetSealdIdType) => await POST<SetSealdIdType, SetSealdIdType>('/account/sealdId', body)
      },
      rooms: {
        list: async (): Promise<{ rooms: RoomType[] }> => await GET<{ rooms: RoomType[] }>('/rooms'),
        getMessages: async (id: string): Promise<MessageTypeAPI[]> => await GET<MessageTypeAPI[]>(`/rooms/${id}/messages`)
      },
      users: {
        list: async (): Promise<{ users: UserType[] }> => await GET<{ users: UserType[] }>('/users')
      },
      uploads: {
        upload: async (file: Blob): Promise<{ uploadId: string }> => await UPLOAD<{
          uploadId: string
        }>('/uploads', file)
      }
    },
    io: {
      get socket () {
        return socket
      },
      setOnline: () => {
        if (socket == null) {
          socket = io()
          socket.on('connect_error', (err) => {
            console.error(`connect_error due to ${err.message}`)
          })
        }
      },
      setOffline: () => {
        try {
          if (socket != null) {
            socket.removeAllListeners()
            socket.disconnect()
          }
        } finally {
          socket = null
        }
      },
      rooms: {
        createMultiUsers: async ({ name, users }: {
          name: string
          users: string[]
        }) => await unwrapHandler<CreateMultiUsersEvent>(socket, 'room:createMultiUsers', { name, users }),
        createOne2One: async ({ userId }: {
          userId: string
        }) => await unwrapHandler<CreateOne2OneEvent>(socket, 'room:createOne2One', { userId }),
        postMessage: async ({ roomId, content, uploadId }: {
          roomId: string
          content: string
          uploadId?: string
        }) => await unwrapHandler<PostMessageEvent>(socket, 'room:postMessage', { roomId, content, uploadId }),
        edit: async ({ roomId, name, users }: {
          roomId: string
          name?: string
          users?: string[]
        }) => await unwrapHandler<RoomEditEvent>(socket, 'room:edit', { roomId, name, users }),
        remove: async ({ roomId }: {
          roomId: string
        }) => await unwrapHandler<RoomRemoveEvent>(socket, 'room:remove', { roomId })
      }
    }
  }
}
const unwrapHandler = async <T extends ClientToServerEventsType> (socket: SocketType | null, eventName: T['eventName'], payload: T['payload']): Promise<T['response']> =>
  await new Promise((resolve, reject) => {
    if (socket == null) reject(new Error('Socket is disconnected'))
    else {
      const callback = (response: ResponseWrapper<T['response']>): void => {
        if (response?.status === 'ok') resolve(response.result)
        else reject(response?.error != null ? new Error(response.error) : new Error('An unknown error happened'))
      }

      const args = [payload, callback] as unknown as Parameters<ClientToServerEvents[T['eventName']]>

      socket.emit(eventName, ...args)
    }
  })

const preDerivePassword = async (password: string, emailAddress: string): Promise<string> => {
  const fixedString = await getSetting('APPLICATION_SALT')
  return await hashPassword(password, `${fixedString}|${emailAddress}`)
}

let currentUser: null | User = null

const apiClient = APIClient()

export class Room {
  readonly id: string
  users: string[]
  readonly one2one: boolean
  name: string
  readonly ownerId: string

  constructor ({ id, users, one2one, name, ownerId }: {
    id: string
    users: string[]
    one2one: boolean
    name: string
    ownerId: string
  }) {
    this.id = id
    this.users = users
    this.one2one = one2one
    this.name = name
    this.ownerId = ownerId
  }

  async edit ({ name, users }: { name?: string, users?: string[] }): Promise<void> {
    const result = await apiClient.io.rooms.edit({ roomId: this.id, name, users })
    this.name = result.name
    this.users = result.users
  }

  async postMessage (content: string, uploadId?: string): Promise<MessageTypeAPI> {
    return await apiClient.io.rooms.postMessage({ roomId: this.id, content, uploadId })
  }

  async getMessages (): Promise<MessageTypeAPI[]> {
    return await apiClient.rest.rooms.getMessages(this.id)
  }

  async delete (): Promise<void> {
    await apiClient.io.rooms.remove({ roomId: this.id })
  }

  static async create (name: string, users: string[]): Promise<Room> {
    return new this(await apiClient.io.rooms.createMultiUsers({ name, users }))
  }

  static async createOne2One (userId: string): Promise<Room> {
    return new this(await apiClient.io.rooms.createOne2One({ userId }))
  }

  static async list (): Promise<Room[]> {
    return (await apiClient.rest.rooms.list()).rooms.map(r => new this(r))
  }
}

export class User {
  readonly id: string
  readonly name: string
  readonly emailAddress: string
  sealdId?: string
  readonly signupJWT?: string

  constructor ({ id, name, emailAddress, sealdId, signupJWT }: { id: string, name: string, emailAddress: string, sealdId?: string, signupJWT?: string }) {
    this.id = id
    this.name = name
    this.emailAddress = emailAddress
    if (sealdId != null) this.sealdId = sealdId // is not defined before Seald identity creation
    if (signupJWT != null) this.signupJWT = signupJWT // only for currentUser, and on sign-up only
  }

  static async list (): Promise<User[]> {
    return (await apiClient.rest.users.list()).users.map(u => new this(u))
  }

  static async createAccount ({ emailAddress, password, name }: CreateAccountType): Promise<User> {
    const preDerivedPassword = await preDerivePassword(password, emailAddress)
    const { user: { id }, signupJWT } = await apiClient.rest.account.create({
      emailAddress,
      password: preDerivedPassword,
      name
    })
    currentUser = new this({
      id,
      emailAddress,
      name,
      signupJWT
    })
    return currentUser
  }

  async setSealdId (sealdId: string): Promise<void> {
    await apiClient.rest.account.setSealdId({ sealdId })
    this.sealdId = sealdId
  }

  static async login ({ emailAddress, password }: LoginType): Promise<User> {
    const preDerivedPassword = await preDerivePassword(password, emailAddress)
    const { user: { id, name, sealdId } } = await apiClient.rest.account.login({
      emailAddress,
      password: preDerivedPassword
    })
    currentUser = new this({
      id,
      emailAddress,
      name,
      sealdId
    })
    return currentUser
  }

  static async updateCurrentUser (): Promise<User> {
    const { user: { id, emailAddress, name, sealdId } } = await apiClient.rest.account.status()
    currentUser = new this({
      id,
      emailAddress,
      name,
      sealdId
    })
    return currentUser
  }

  static getCurrentUser (): User | null {
    return currentUser
  }

  static async logout (): Promise<void> {
    await apiClient.rest.account.logout()
    apiClient.io.setOffline()
    currentUser = null
  }
}

export const getSocket = (): Socket | null => apiClient.io.socket

export const setOnline = async (): Promise<Socket | null> => {
  apiClient.io.setOnline()
  return getSocket()
}

export const setOffline = async (): Promise<void> => {
  apiClient.io.setOffline()
}

export const uploadFile = async (file: Blob): Promise<{ uploadId: string }> => {
  return await apiClient.rest.uploads.upload(file)
}
