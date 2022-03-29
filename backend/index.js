const app = require('express')()
const bodyParser = require('body-parser')
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const { ValidationError: JoiValidationError } = require('express-validation')
const account = require('./routes/account')
const rooms = require('./routes/rooms')
const users = require('./routes/users')
const uploads = require('./routes/uploads')
const { IOIsAuthenticatedMiddleware, IOSessionMiddleware, sessionMiddleware } = require('./middlewares/authentication')
const registerRoomHandlers = require('./handlers/rooms')
io.use(IOSessionMiddleware)
io.use(IOIsAuthenticatedMiddleware)
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const { settings } = require('./config.js')

global.io = io // ugly as hell, but I need it in the router to broadcast events...

const onConnection = async socket => {
  await registerRoomHandlers(io, socket)
}

io.on('connection', onConnection)

if (settings.HTTPS_ENABLED === true) app.set('trust proxy', true) // reset X-Forwarded-* at first reverse proxy
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
