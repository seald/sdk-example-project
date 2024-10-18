import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import { ValidationError as JoiValidationError } from 'express-validation'
import { createServer } from 'http'
import bodyParser from 'body-parser'
import config from './config.js'
import registerRoomHandlers from './handlers/rooms.js'
import { IOIsAuthenticatedMiddleware, IOSessionMiddleware, sessionMiddleware } from './middlewares/authentication.js'
import uploads from './routes/uploads.js'
import users from './routes/users.js'
import rooms from './routes/rooms.js'
import account from './routes/account.js'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)

const io = new Server(server)
io.use(IOSessionMiddleware)
io.use(IOIsAuthenticatedMiddleware)

global.io = io // ugly as hell, but I need it in the router to broadcast events...

const onConnection = async socket => {
  await registerRoomHandlers(io, socket)
}

io.on('connection', onConnection)

if (config.settings.HTTPS_ENABLED === true) app.set('trust proxy', true) // reset X-Forwarded-* at first reverse proxy
app.use(cookieParser())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(sessionMiddleware)
app.use(csrf({
  cookie: true
}))

app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken())
  next()
})

app.use('/api/account', account)
app.use('/api/rooms', rooms)
app.use('/api/users', users)
app.use('/api/uploads', uploads)

app.use((err, req, res, next) => {
  if (err instanceof JoiValidationError) return res.status(err.statusCode).json(err)
  if (err.code === 'EBADCSRFTOKEN') return res.status(403).json({ error: err.toString() })
  return res.status(500).json({ detail: err.toString() })
})

server.listen(4000)
