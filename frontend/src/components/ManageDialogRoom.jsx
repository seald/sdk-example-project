import React, { useCallback, useState, useContext } from 'react'

import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Typography
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useSnackbar } from 'notistack'

import { Room } from '../services/api'
import {
  CLOSE_DIALOG_ROOM,
  FAILED_DIALOG_ROOM,
  SET_ROOM_NAME,
  SUCCESS_DIALOG_ROOM,
  TOGGLE_LOADING_ROOM,
  TOGGLE_SELECTED_USERS_ROOM
} from '../stores/reducer/constants'
import { SocketContext } from '../stores/SocketContext'
import { getSealdSDKInstance } from '../services/seald'

const useStyles = makeStyles(theme => {
  return {
    listUsers: {
      width: '100%',
      maxHeight: 200,
      overflowY: 'auto',
      padding: theme.spacing(1, 0),
      margin: theme.spacing(1, 0),
      backgroundColor: theme.palette.background.paper
    },
    you: {
      marginLeft: theme.spacing(1)
    }
  }
})

function ManageDialogRoom () {
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [{ users, currentUser, dialogRoom }, dispatch] = useContext(SocketContext)
  const classes = useStyles()
  const [isErrorRoomName, setIsErrorRoomName] = useState(false)

  const handleToggle = useCallback(
    id => () => {
      dispatch({
        type: TOGGLE_SELECTED_USERS_ROOM,
        payload: { id }
      })
    },
    [dispatch]
  )

  const handleClose = useCallback(() => {
    dispatch({ type: CLOSE_DIALOG_ROOM })
    setIsErrorRoomName(false)
  }, [dispatch])

  const handleSubmit = async e => {
    e.preventDefault()
    if (dialogRoom.name.trim() === '') {
      setIsErrorRoomName(true)
      return
    }
    try {
      dispatch({ type: TOGGLE_LOADING_ROOM })
      if (dialogRoom.room) {
        await dialogRoom.sealdSession.revokeRecipients({ userIds: dialogRoom.room.users.filter(id => !dialogRoom.selectedUsersId.includes(id)) })
        await dialogRoom.sealdSession.addRecipients({ userIds: dialogRoom.selectedUsersId.filter(id => !dialogRoom.room.users.includes(id)) })
        await dialogRoom.room.edit({ name: dialogRoom.name, users: dialogRoom.selectedUsersId })
      } else {
        const newRoom = await Room.create(
          dialogRoom.name,
          dialogRoom.selectedUsersId
        )
        const sealdSession = await getSealdSDKInstance().createEncryptionSession({ userIds: dialogRoom.selectedUsersId }, { metadata: newRoom.id })
        await newRoom.postMessage(await sealdSession.encryptMessage('Hello 👋'))
        navigate(`/rooms/${newRoom.id}`)
      }

      dispatch({ type: SUCCESS_DIALOG_ROOM })
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' })
      dispatch({ type: FAILED_DIALOG_ROOM })
      console.error(error)
    }
  }

  const { name, selectedUsersId, isLoading, isOpen } = dialogRoom

  return (
    <Dialog open={isOpen} onClose={handleClose} aria-labelledby='form-dialog-title'>
      <DialogTitle id='form-dialog-title'>{dialogRoom.room ? 'Edit room' : 'Add room'}</DialogTitle>
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
              type: SET_ROOM_NAME,
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
        <List dense className={classes.listUsers}>
          {Array.from(users)
            .sort(user => user.id === currentUser.id ? -1 : 0)
            .map(user => {
              const labelId = `checkbox-list-secondary-label-${user.id}`
              return (
                <ListItem key={user.id} button component='label' htmlFor={user.id}>
                  <ListItemAvatar>
                    <Avatar alt={user.name} src={user.photoURL} />
                  </ListItemAvatar>
                  <ListItemText
                    id={labelId}
                    primary={
                      <Box display='flex' alignItems='center'>
                        <Typography>{user.name}</Typography>
                        {currentUser.id === user.id && (
                          <Typography className={classes.you} variant='caption'>
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
                      checked={currentUser.id === user.id || selectedUsersId.indexOf(user.id) !== -1}
                      onChange={handleToggle(user.id)}
                      inputProps={{ 'aria-labelledby': labelId }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
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
