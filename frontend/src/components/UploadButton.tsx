/* eslint-env browser */
import { type ChangeEvent, type FC, useEffect, useRef, useState } from 'react'
import { IconButton, CircularProgress } from '@mui/material'
import AttachIcon from '@mui/icons-material/AttachFile'
import { type Room, uploadFile } from '../services/api'
import type { EncryptionSession } from '@seald-io/sdk/browser'

const UploadButton: FC<{ room: Room | null, sealdSession: EncryptionSession }> = ({ room, sealdSession }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileUploadRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void (async () => {
      if (room != null && selectedFiles.length > 0) {
        setIsUploading(true)
        try {
          // Encrypt file
          const encryptedBlob: Blob = await sealdSession.encryptFile(
            selectedFiles[0],
            selectedFiles[0].name,
            { fileSize: selectedFiles[0].size }
          )
          const encryptedFile = new File([encryptedBlob], selectedFiles[0].name)
          // Upload Encrypted file
          const { uploadId } = await uploadFile(encryptedFile)
          // Send message to room
          await room.postMessage('--FILE--', uploadId)
        } finally {
          setIsUploading(false)
          setSelectedFiles([])
        }
      }
    })()
  }, [room, sealdSession, selectedFiles])

  const handleUploadClick = (): void => {
    fileUploadRef.current?.click()
  }

  const selectFile = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files != null) setSelectedFiles(Array.from(event.target.files))
  }

  return (
    <IconButton
      sx={{ color: 'grey.500' }}
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
        style={{ display: 'none' }}
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
