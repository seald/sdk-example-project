import { forwardRef, type ForwardRefRenderFunction, useImperativeHandle } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useSnackbar } from 'notistack'
import { useImmer } from 'use-immer'
import type { Room } from '../services/api.ts'
import { getMessageFromUnknownError } from '../utils'

export interface RemoveDialogRoomHandle {
  openDialog: (room: Room | null) => void
}

const RemoveDialogRoom: ForwardRefRenderFunction<RemoveDialogRoomHandle> = (_props, ref) => {
  const { enqueueSnackbar } = useSnackbar()
  const [state, setState] = useImmer<{ room: Room | null, isOpen: boolean }>({
    isOpen: false,
    room: null
  })

  useImperativeHandle(
    ref,
    () => ({
      openDialog: room => {
        setState(draft => {
          draft.room = room
          draft.isOpen = true
        })
      }
    }),
    [setState]
  )

  const handleClose = (): void => {
    setState(draft => {
      draft.isOpen = false
    })
  }

  const handleConfirm = (): void => {
    const asyncHandleConfirm = async (): Promise<void> => {
      if (state.room != null) {
        try {
          await state.room.delete()
          setState(draft => {
            draft.isOpen = false
          })
        } catch (error) {
          enqueueSnackbar(getMessageFromUnknownError(error), { variant: 'error' })
          console.error(error)
        }
      }
    }
    void asyncHandleConfirm()
  }

  return (
    <Dialog
      open={!!state.isOpen}
      onClose={handleClose}
      aria-labelledby="remove-room"
      aria-describedby={`remove-room-${state.room?.name}`}
      TransitionProps={{
        onExited: () => {
          setState(draft => {
            draft.room = null
          })
        }
      }}
    >
      <DialogTitle id="alert-dialog-title">Remove a room</DialogTitle>
      <DialogContent>
        <DialogContentText id="remove-room-description">
          Are you sure you want to remove the room <b>{state.room?.name}</b>?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="primary" autoFocus>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const RemoveDialogRoomWithForwardedRef = forwardRef<RemoveDialogRoomHandle>(RemoveDialogRoom)

export default RemoveDialogRoomWithForwardedRef
