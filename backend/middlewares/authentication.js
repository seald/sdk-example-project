const { promisify } = require('util')
const session = require('express-session')
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const config = require('../config')
const { sequelize } = require('../models')

const sessionMiddleware = session({
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

const IOSessionMiddleware = wrap(sessionMiddleware)

const isAuthenticatedMiddleware = (req, res, next) => {
  if (req.session.user) next()
  else res.status(403).json({ detail: 'Credentials were not provided' })
}

const IOIsAuthenticatedMiddleware = async (socket, next) => {
  try {
    await promisify(cb => socket.request.session.reload(cb))()
  } catch (error) {
    console.error(error)
    return next(new Error('Not authenticated'))
  }
  if (socket.request.session && socket.request.session.user) next()
  else next(new Error('Not authenticated'))
}

const authenticate = async (req, user) => {
  await promisify(cb => req.session.regenerate(cb))()
  req.session.user = {
    id: user.id,
    name: user.name,
    emailAddress: user.emailAddress
  }
}

const logout = async req => {
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

module.exports = {
  isAuthenticatedMiddleware,
  authenticate,
  logout,
  IOIsAuthenticatedMiddleware,
  IOSessionMiddleware,
  sessionMiddleware
}
