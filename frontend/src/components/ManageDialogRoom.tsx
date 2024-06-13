import { useCallback, useState, useContext, type FC, type MouseEvent } from 'react'

import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'
import { useSnackbar } from 'notistack'

import { Room, type User } from '../services/api'
import { SocketActionKind } from '../stores/reducer/constants'
import { SocketContext } from '../stores/SocketContext'
import { getMessageFromUnknownError } from '../utils'

const ManageDialogRoom: FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [{ users, currentUser, dialogRoom }, dispatch] = useContext(SocketContext)
  const [isErrorRoomName, setIsErrorRoomName] = useState(false)

  const handleToggle = useCallback(
    (user: User) => () => {
      dispatch({
        type: SocketActionKind.TOGGLE_SELECTED_USERS_ROOM,
        payload: user.id
      })
    },
    [dispatch]
  )

  const handleClose = useCallback(() => {
    dispatch({ type: SocketActionKind.CLOSE_DIALOG_ROOM })
    setIsErrorRoomName(false)
  }, [dispatch])

  const handleSubmit = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault()
    if (dialogRoom.name.trim() === '') {
      setIsErrorRoomName(true)
      return
    }
    const asyncHandleSubmit = async (): Promise<void> => {
      try {
        if (dialogRoom.room != null) {
          await dialogRoom.room.edit({ name: dialogRoom.name, users: dialogRoom.selectedUsers })
        } else {
          const newRoom = await Room.create(
            dialogRoom.name,
            dialogRoom.selectedUsers
          )
          await newRoom.postMessage('Hello 👋')
          navigate(`/rooms/${newRoom.id}`)
        }

        dispatch({ type: SocketActionKind.SUCCESS_DIALOG_ROOM })
      } catch (error) {
        enqueueSnackbar(getMessageFromUnknownError(error), { variant: 'error' })
        dispatch({ type: SocketActionKind.FAILED_DIALOG_ROOM })
        console.error(error)
      }
    }
    void asyncHandleSubmit()
  }

  const { name, selectedUsers, isLoading, isOpen } = dialogRoom

  return (
    <Dialog open={isOpen} onClose={handleClose} aria-labelledby='form-dialog-title'>
      <DialogTitle id='form-dialog-title'>{(dialogRoom.room != null) ? 'Edit room' : 'Add room'}</DialogTitle>
      <DialogContent>
        <DialogContentText>Name your room and select the users you want to chat with</DialogContentText>
        <TextField
          autoFocus
          error={isErrorRoomName}
          value={name}
          helperText={isErrorRoomName ? 'Incorrect entry' : ''}
          onChange={e => {
            const value = e.target.value
            setIsErrorRoomName(false)
            dispatch({
              type: SocketActionKind.SET_ROOM_NAME,
              payload: { name: value }
            })
          }}
          margin='dense'
          id='name'
          spellCheck='false'
          label='Room name'
          type='text'
          fullWidth
        />
        <List dense sx={{
          width: '100%',
          maxHeight: 200,
          overflowY: 'auto',
          py: 1,
          px: 0,
          my: 1,
          mx: 0,
          bgcolor: 'background.paper'
        }}>
          {currentUser != null && Array.from(users)
            .sort(user => user.id === currentUser.id ? -1 : 0)
            .map(user => {
              const labelId = `checkbox-list-secondary-label-${user.id}`
              return (
                <ListItemButton key={user.id} component='label' htmlFor={user.id}>
                  <ListItemAvatar>
                    <Avatar alt={user.name} />
                  </ListItemAvatar>
                  <ListItemText
                    id={labelId}
                    primary={
                      <Box display='flex' alignItems='center'>
                        <Typography>{user.name}</Typography>
                        {currentUser.id === user.id && (
                          <Typography sx={{ ml: 1 }} variant='caption'>
                            (you)
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge='end'
                      id={user.id}
                      disabled={currentUser.id === user.id}
                      checked={currentUser.id === user.id || selectedUsers.includes(user.id)}
                      onChange={handleToggle(user)}
                      inputProps={{ 'aria-labelledby': labelId }}
                    />
                  </ListItemSecondaryAction>
                </ListItemButton>
              )
            })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading} color='primary'>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ManageDialogRoom
