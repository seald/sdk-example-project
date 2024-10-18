import express from 'express'
import config from '../config.js'
import { isAuthenticatedMiddleware } from '../middlewares/authentication.js'
import { uploadFile } from '../middlewares/upload.js'
import { Upload } from '../models.js'

const router = express.Router()

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

export default router
