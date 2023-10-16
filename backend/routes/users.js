const express = require('express')
const { isAuthenticatedMiddleware } = require('../middlewares/authentication')
const { ValidationError, User } = require('../models')
const router = express.Router()

router.use(isAuthenticatedMiddleware)

// get users
router.get('', async (req, res, next) => {
  try {
    const users = await User.findAll()
    res.json({ users: users.map(u => u.serialize()) })
  } catch (err) {
    if (err instanceof ValidationError) res.status(400).json({ detail: err.toString() })
    else next(err)
  }
})

module.exports = router
