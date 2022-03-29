const multer = require('multer')
const fs = require('fs')
const config = require('../config')
const { Upload } = require('../models')

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

const uploadFile = multer({
  storage,
  limits
}).single('file')

module.exports = {
  uploadFile: uploadFile,
  uploadDir: config.uploadDir
}
