const crypto = require('crypto')
const util = require('util')
const express = require('express')
const { generateSignupJWT } = require('../utils')
const { logout } = require('../middlewares/authentication')
const { createAccountValidator, loginValidator, sealdIdValidator } = require('../validators/account')
const { authenticate, isAuthenticatedMiddleware } = require('../middlewares/authentication')
const { ValidationError, User } = require('../models')
const { validate } = require('express-validation')

const randomBytes = util.promisify(crypto.randomBytes)

const router = express.Router()

router.post('/login', validate(loginValidator), async (req, res, next) => {
  try {
    const { emailAddress, password } = req.body
    const user = await User.findOne({ where: { emailAddress } })
    if (!user) res.status(404).json({ detail: 'Account does not exist' })
    else if (await user.isValidPassword(password)) {
      await authenticate(req, user)
      req.session.databaseKey = (await randomBytes(64)).toString('base64')
      res.json({
        user: user.serialize(),
        databaseKey: req.session.databaseKey,
        sessionID: req.sessionID
      })
    } else res.status(403).json({ detail: 'Credentials provided are invalid' })
  } catch (error) {
    next(error)
  }
})

router.get('/logout', isAuthenticatedMiddleware, async (req, res, next) => {
  try {
    delete req.session.databaseKey
    await logout(req)
    res.status(200).json({ detail: 'Successfully logged out' })
  } catch (error) {
    next(error)
  }
})

router.post('/', validate(createAccountValidator), async (req, res, next) => {
  try {
    const { emailAddress, password, name } = req.body
    const user = await User.create({ emailAddress, password, name })
    await authenticate(req, user)
    req.session.databaseKey = (await randomBytes(64)).toString('base64')
    res.json({
      user: user.serialize(),
      databaseKey: req.session.databaseKey,
      sessionID: req.sessionID,
      signupJWT: await generateSignupJWT(user.id)
    })
  } catch (err) {
    if (err instanceof ValidationError) res.status(400).json({ detail: 'A user with the same email address exists' })
    else next(err)
  }
})

router.get('/', isAuthenticatedMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.user.id)
    res.json({
      user: user.serialize(),
      databaseKey: req.session.databaseKey,
      sessionID: req.sessionID
    })
  } catch (err) {
    if (err instanceof ValidationError) res.status(400).json({ detail: 'A user with the same email address exists' })
    else next(err)
  }
})

router.post('/sealdId', validate(sealdIdValidator), async (req, res, next) => {
  try {
    const { sealdId } = req.body
    const userId = req.session.user.id
    const user = await User.findOne({ where: { id: userId } })
    await user.setSealdId(sealdId)
    global.io.emit('user:created', user.serialize())
    res.json({ sealdId })
  } catch (error) {
    next(error)
  }
})
module.exports = router
