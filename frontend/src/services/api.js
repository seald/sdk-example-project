/* eslint-env browser */
import { io } from 'socket.io-client'
import { hashPassword } from '../utils'
import getSetting from '../settings'

// APIClient for REST API & IO API
const APIClient = baseURL => {
  const _url = baseURL ? new URL(baseURL) : window.location
  baseURL = _url.origin
  const prefixURL = _url.pathname + 'api'
  const request = async (url, method, body, jsonContentType = true) => {
    const cookies = Object.fromEntries(document.cookie.split(/; */).filter(x => !!x).map(c => {
      const [key, ...v] = c.split('=')
      return [key, decodeURIComponent(v.join('='))]
    }))
    const _request = {
      headers: {
        Accept: 'application/json',
        'CSRF-Token': cookies['XSRF-TOKEN']
      },
      method: method
    }
    if (jsonContentType) {
      _request.headers['Content-type'] = 'application/json'
    }
    if (body) _request.body = jsonContentType ? JSON.stringify(body) : body
    const response = await fetch(url, _request)
    const json = await response.json()
    if (response.status !== 200) throw new Error(JSON.stringify(json))
    return json
  }

  const POST = (url, body) => request(new URL(prefixURL + url, baseURL).toString(), 'POST', body)
  const GET = (url, body) => request(new URL(prefixURL + url, baseURL).toString(), 'GET', body)
  const UPLOAD = (url, file) => {
    const body = new FormData()
    body.append('file', file)
    return request(new URL(prefixURL + url, baseURL).toString(), 'POST', body, false)
  }

  let socket

  return {
    rest: {
      account: {
        status: () => GET('/account'),
        create: body => POST('/account', body),
        login: body => POST('/account/login', body),
        logout: () => GET('/account/logout')
      },
      rooms: {
        list: () => GET('/rooms'),
        getMessages: id => GET(`/rooms/${id}/messages`)
      },
      users: {
        list: () => GET('/users')
      },
      uploads: {
        upload: (file) => UPLOAD('/uploads', file)
      }
    },
    io: {
      get socket () {
        return socket
      },
      setOnline: () => {
        if (!socket) {
          socket = io()
          socket.on('connect_error', (err) => {
            console.error(`connect_error due to ${err.message}`)
          })
        }
      },
      setOffline: () => {
        try {
          socket.removeAllListeners()
          socket.disconnect()
        } finally {
          socket = null
        }
      },
      rooms: {
        createMultiUsers: async ({ name, users }) => unwrapHandler(socket, 'room:createMultiUsers', { name, users }),
        createOne2One: async ({ userId }) => unwrapHandler(socket, 'room:createOne2One', { userId }),
        postMessage: async ({ roomId, content, uploadId }) => unwrapHandler(socket, 'room:postMessage', { roomId, content, uploadId }),
        edit: async ({ roomId, name, users }) => unwrapHandler(socket, 'room:edit', { roomId, name, users }),
        remove: async ({ roomId }) => unwrapHandler(socket, 'room:remove', { roomId })
      }
    }
  }
}

const unwrapHandler = (socket, eventName, payload) => new Promise((resolve, reject) => {
  console.log('emitting', eventName, payload)
  socket.emit(eventName, payload, response => {
    console.log('got ack with', response)
    if (response?.status === 'ok') resolve(response.result)
    else reject(new Error(response?.error ? response.error : 'An unknown error happened'))
  })
})

const preDerivePassword = async (password, userId) => {
  const fixedString = await getSetting('APPLICATION_SALT')
  return hashPassword(password, `${fixedString}|${userId}`)
}

let currentUser = null

const apiClient = APIClient()

export class Room {
  constructor ({ id, users, one2one, name, ownerId }) {
    this.id = id
    this.users = users
    this.one2one = one2one
    this.name = name
    this.ownerId = ownerId
  }

  async edit ({ name, users }) {
    const result = await apiClient.io.rooms.edit({ roomId: this.id, name, users })
    this.name = result.name
    this.users = result.users
  }

  async postMessage (content, uploadId) {
    console.log('room.postMessage uploadId', uploadId)
    return await apiClient.io.rooms.postMessage({ roomId: this.id, content, uploadId })
  }

  async getMessages () {
    return await apiClient.rest.rooms.getMessages(this.id)
  }

  async delete () {
    await apiClient.io.rooms.remove({ roomId: this.id })
  }

  static async create (name, users) {
    return new this(await apiClient.io.rooms.createMultiUsers({ name, users }))
  }

  static async createOne2One (userId) {
    return new this(await apiClient.io.rooms.createOne2One({ userId }))
  }

  static async list () {
    return (await apiClient.rest.rooms.list()).rooms.map(r => new this(r))
  }
}

export class User {
  constructor ({ id, name, emailAddress, photoURL }) {
    this.id = id
    this.name = name
    this.emailAddress = emailAddress
    this.photoURL = photoURL // not implemented
  }

  static async list () {
    return (await apiClient.rest.users.list()).users.map(u => new this(u))
  }

  static async createAccount ({ emailAddress, password, name }) {
    const preDerivedPassword = await preDerivePassword(password, emailAddress)
    const { user: { id } } = await apiClient.rest.account.create({
      emailAddress,
      password: preDerivedPassword,
      name
    })
    currentUser = new this({
      id,
      emailAddress,
      name
    })
    return currentUser
  }

  static async login ({ emailAddress, password }) {
    const preDerivedPassword = await preDerivePassword(password, emailAddress)
    const { user: { id, name } } = await apiClient.rest.account.login({
      emailAddress,
      password: preDerivedPassword
    })
    currentUser = new this({
      id,
      emailAddress,
      name
    })
    return currentUser
  }

  static async updateCurrentUser () {
    const { user: { id, emailAddress, name } } = await apiClient.rest.account.status()
    currentUser = new this({
      id,
      emailAddress,
      name
    })
    return currentUser
  }

  static getCurrentUser () {
    return currentUser
  }

  static async logout () {
    await apiClient.rest.account.logout()
    apiClient.io.setOffline()
    currentUser = null
  }
}

export const getSocket = () => apiClient.io.socket

export const setOnline = async () => {
  apiClient.io.setOnline()
  return getSocket()
}

export const setOffline = async () => {
  apiClient.io.setOffline()
}

export const uploadFile = async (file) => {
  return apiClient.rest.uploads.upload(file)
}
