import { randomBytes as randomBytesSync } from 'crypto'
import { promisify } from 'util'
import express from 'express'
import { validate } from 'express-validation'
import fetch from 'node-fetch'
import { authenticate, isAuthenticatedMiddleware, logout } from '../middlewares/authentication.js'
import { createAccountValidator, loginValidator, sealdIdValidator } from '../validators/account.js'
import { User, ValidationError } from '../models.js'
import { generateSignupJWT } from '../utils.js'
import { settings } from '../config.js'

const randomBytes = promisify(randomBytesSync)

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

router.post('/sendChallenge2MR', isAuthenticatedMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.user.id)
    let createUser = true
    if (user.twoManRuleKey != null) createUser = false
    const sendChallengeResult = await fetch(
    `${settings.KEY_STORAGE_URL}tmr/back/challenge_send/`,
    {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'X-SEALD-APPID': settings.APP_ID,
        'X-SEALD-APIKEY': settings.KEY_STORAGE_APP_KEY
      },
      body: JSON.stringify({
        create_user: createUser,
        user_id: user.id,
        // template_id: '00000000-0000-0000-0000-000000000000', // ID of the template to use. Templates are created on the dashboard.
        auth_factor: {
          type: 'EM',
          value: user.emailAddress.normalize('NFKC').replace(/ /g, '').toLowerCase()
        }
      })
    }
    )
    if (!sendChallengeResult.ok) throw new Error(`Error in SSKSBackend createUser: ${sendChallengeResult.status} ${await sendChallengeResult.text()}`)
    const { session_id: twoManRuleSessionId, must_authenticate: mustAuthenticate } = await sendChallengeResult.json()
    if (createUser) {
      user.twoManRuleKey = (await randomBytes(64)).toString('base64')
      await user.save()
    }
    res.status(200).json({
      twoManRuleSessionId,
      twoManRuleKey: user.twoManRuleKey,
      mustAuthenticate
    })
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

export default router
