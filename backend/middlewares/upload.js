import multer from 'multer'
import fs from 'fs'
import config from '../config.js'
import { Upload } from '../models.js'

if (!fs.existsSync(config.uploadDir)) { fs.mkdirSync(config.uploadDir) }

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir)
  },
  filename: async (req, file, cb) => {
    const upload = await Upload.create({
      fileName: file.originalname
    })
    req.uploadId = upload.id
    cb(null, upload.id.toString())
  }
})
const limits = { fileSize: 2 * 1024 * 1024 }

export const uploadFile = multer({
  storage,
  limits
}).single('file')

export const uploadDir = config.uploadDir
