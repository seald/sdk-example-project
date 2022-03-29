const express = require('express')
const config = require('../config')
const { isAuthenticatedMiddleware } = require('../middlewares/authentication')
const { uploadFile } = require('../middlewares/upload')
const router = express.Router()
const { Upload } = require('../models')

router.use(isAuthenticatedMiddleware)

// download a file
router.get('/:file/', async (req, res, next) => {
  try {
    const upload = await Upload.findByPk(req.params.file)
    res.download(`${config.uploadDir}/${req.params.file}`, upload.fileName)
  } catch (err) {
    next(err)
  }
})

// upload a file
router.post('/', uploadFile, async (req, res, next) => {
  try {
    res.json({ uploadId: req.uploadId })
  } catch (err) {
    next(err)
  }
})

module.exports = router
