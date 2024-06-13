import { promisify } from 'util'
import session from 'express-session'
import connectSessionSequelize from 'connect-session-sequelize'
import config from '../config.js'
import { sequelize } from '../models.js'

const SequelizeStore = connectSessionSequelize(session.Store)

export const sessionMiddleware = session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: config.session.secret,
  store: new SequelizeStore({
    db: sequelize
  }),
  cookie: {
    maxAge: 1000 * 3600 * 24,
    sameSite: true,
    secure: config.session.secureCookie
  }
})

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)

export const IOSessionMiddleware = wrap(sessionMiddleware)

export const isAuthenticatedMiddleware = (req, res, next) => {
  if (req.session.user) next()
  else res.status(403).json({ detail: 'Credentials were not provided' })
}

export const IOIsAuthenticatedMiddleware = async (socket, next) => {
  try {
    await promisify(cb => socket.request.session.reload(cb))()
  } catch (error) {
    console.error(error)
    return next(new Error('Not authenticated'))
  }
  if (socket.request.session && socket.request.session.user) next()
  else next(new Error('Not authenticated'))
}

export const authenticate = async (req, user) => {
  await promisify(cb => req.session.regenerate(cb))()
  req.session.user = {
    id: user.id,
    name: user.name,
    emailAddress: user.emailAddress
  }
}

export const logout = async req => {
  const userId = req.session.user.id
  await promisify(cb => req.session.destroy(cb))()
  const sockets = await global.io.in(userId).fetchSockets()
  for (const socket of sockets) {
    try {
      await promisify(cb => socket.request.session.reload(cb))()
    } catch (error) {
      console.error(error)
      delete socket.request.session
    }
  }
}
