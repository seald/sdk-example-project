/* eslint-env browser */
import { type FC, memo, useEffect } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useImmer } from 'use-immer'
import DLIcon from '@mui/icons-material/Description'
import type { EncryptionSession } from '@seald-io/sdk/browser'

const Message: FC<{ value: string | null, isCurrentUser: boolean, uploadId: string | null, uploadFileName: string | null, sealdSession: EncryptionSession | null }> = ({ value, isCurrentUser, uploadId, uploadFileName, sealdSession }) => {
  const [state, setState] = useImmer<{
    isLoading: boolean
    isError: boolean
    val: string | null
    uploadId: string | null
    uploadFileName: string | null
  }>({
    isLoading: typeof value !== 'string',
    isError: false,
    val: typeof value !== 'string' ? null : value,
    uploadId: typeof uploadId !== 'string' ? null : uploadId,
    uploadFileName: typeof uploadFileName !== 'string' ? null : uploadFileName
  })

  useEffect(() => {
    let hasCancelled = false
    void (async () => {
      try {
        if (!hasCancelled) {
          setState(draft => {
            draft.val = value
            draft.isLoading = false
          })
        }
      } catch (error) {
        console.error(error)
        setState(draft => {
          draft.isLoading = false
          draft.isError = true
        })
      }
    })()

    return () => {
      hasCancelled = true
    }
  }, [value, setState])

  const onClick = (): void => {
    const onClickAsync = async (): Promise<void> => {
      if (state.uploadId != null && state.uploadFileName != null) {
        const url = '/api/uploads/' + state.uploadId
        const response = await fetch(url)
        const encryptedBlob = await response.blob()
        const { data: clearBlob, filename }: { data: Blob, filename: string } = await sealdSession.decryptFile(encryptedBlob)
        const href = window.URL.createObjectURL(clearBlob)
        const anchor = document.createElement('a')
        anchor.href = href
        anchor.download = filename
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
      }
    }
    void onClickAsync()
  }

  return (
    <Box sx={[{
      bgcolor: 'grey.400',
      color: 'primary.contrastText',
      p: 1.1,
      borderRadius: '1.3em',
      borderBottomRightRadius: '1.3em',
      borderBottomLeftRadius: 0,
      maxWidth: 250,
      transition: 'background-color 0.3s',
      minWidth: 10,
      wordBreak: 'break-word'
    }, isCurrentUser && {
      bgcolor: 'primary.main',
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: '1.3em'
    },
    state.isError && { bgcolor: 'error.main' },
    state.isLoading && { bgcolor: 'grey.400' }
    ]}>
      {state.isLoading
        ? (
          <CircularProgress
            color='secondary'
            size={18}
            style={{
              color: 'white'
            }}
          />
          )
        : (
          <Typography sx={{ cursor: 'pointer' }} color='inherit' variant='body2' onClick={onClick}>
            {
              state.isError
                ? 'An error occured'
                : (
                    (state.uploadFileName !== null)
                      ? <><DLIcon fontSize='large'/><br />{state.uploadFileName}</>
                      : state.val
                  )
            }
          </Typography>
          )}
    </Box>
  )
}

const MemoizedMessage = memo(Message)

export default MemoizedMessage
