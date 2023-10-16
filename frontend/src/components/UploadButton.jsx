import React, { useEffect, useRef, useState } from 'react'
import { IconButton, CircularProgress } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import AttachIcon from '@mui/icons-material/AttachFile'
import { uploadFile } from '../services/api'

const useStyles = makeStyles(theme => ({
  attachButton: {
    color: theme.palette.grey[500]
  },
  fileUpload: {
    display: 'none'
  }
}))

const UploadButton = ({ room }) => {
  const classes = useStyles()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const fileUploadRef = useRef(null)

  useEffect(() => {
    (async () => {
      if (selectedFiles[0]) {
        setIsUploading(true)
        try {
          // Upload selectedFile[0]
          const { uploadId } = await uploadFile(selectedFiles[0])
          // Send message to room
          await room.postMessage('--FILE--', uploadId)
        } finally {
          setIsUploading(false)
          setSelectedFiles([])
        }
      }
    })()
  }, [selectedFiles])

  const handleUploadClick = () => {
    fileUploadRef.current.click()
  }

  const selectFile = (event) => {
    setSelectedFiles(event.target.files)
  }

  return (
    <IconButton
      className={classes.attachButton}
      edge='start'
      disabled={isUploading}
      size='medium'
      color='primary'
      aria-label='send file'
      component='button'
      onClick={handleUploadClick}
    >
      <input
        ref={fileUploadRef}
        type='file'
        className={classes.fileUpload}
        onChange={selectFile}
      />
      {
          isUploading
            ? (
              <>
                <CircularProgress variant='determinate' size={20} />
              </>
              )
            : <AttachIcon />
        }

    </IconButton>

  )
}

export default UploadButton
