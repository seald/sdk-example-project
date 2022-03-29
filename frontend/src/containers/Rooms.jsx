import React, { useContext, useEffect } from 'react'
import { useNavigate, useMatch } from 'react-router-dom'
import { Box, Container, Fab, Grid, Paper, Tooltip } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import HomeIcon from '@mui/icons-material/Home'
import { useSnackbar } from 'notistack'

import Chat from '../components/Chat'
import ListCustomRooms from '../components/ListCustomRooms'
import ListOnlines from '../components/ListOnline'
import AddRoomDialog from '../components/ManageDialogRoom'
import Welcome from '../components/Welcome'
import { Room, setOffline, setOnline, User } from '../services/api'
import {
  EDIT_OR_ADD_ROOM, REMOVE_ROOM,
  RESET_SOCKET,
  SET_AUTH,
  SET_SOCKET,
  START_ADD_DIALOG_ROOM
} from '../stores/reducer/constants'
import { SocketContext } from '../stores/SocketContext'

const useStyles = makeStyles(theme => {
  return {
    root: {
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    paper: {
      width: '100%'
    },
    screenContainer: {
      height: '70vh',
      overflow: 'hidden',
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText
    },
    signOutIcon: {
      position: 'absolute',
      bottom: theme.spacing(2),
      right: theme.spacing(2)
    },
    addIcon: {
      position: 'absolute',
      bottom: theme.spacing(10),
      right: theme.spacing(2)
    },
    homeIcon: {
      position: 'absolute',
      bottom: theme.spacing(18),
      right: theme.spacing(2)
    }
  }
})

function Rooms () {
  const navigate = useNavigate()
  const [{ socket }, dispatch] = useContext(SocketContext)
  const match = useMatch('/rooms/:currentRoomId')
  const currentRoomId = match?.params?.currentRoomId
  const { enqueueSnackbar } = useSnackbar()
  const classes = useStyles()

  useEffect(() => {
    const leavePage = () => {
      setOffline()
      dispatch({ type: RESET_SOCKET })
      return undefined
    }
    window.addEventListener('onbeforeunload', leavePage)
    const manageOnlineActivity = async () => {
      try {
        const socket = await setOnline()
        dispatch({ type: SET_SOCKET, payload: socket })
      } catch (error) {
        console.error(error)
        enqueueSnackbar(error.message, {
          variant: 'error'
        })
      }
    }
    manageOnlineActivity()
    return () => {
      window.removeEventListener('onbeforeunload', leavePage)
    }
  }, [enqueueSnackbar])

  useEffect(async () => {
    const handler = room => {
      dispatch({
        type: EDIT_OR_ADD_ROOM,
        payload: {
          room: new Room(room)
        }
      })
    }
    const removedHandler = ({ roomId }) => {
      dispatch({
        type: REMOVE_ROOM,
        payload: {
          roomId
        }
      })
    }
    if (socket) {
      socket.on('room:removed', removedHandler)
      socket.on('room:created', handler)
      socket.on('room:edited', handler)
    }
    return () => {
      if (socket) {
        socket.off('room:created')
        socket.off('room:edited')
        socket.off('room:removed')
      }
    }
  }, [dispatch, socket])

  const handleLogout = async () => {
    try {
      await User.logout()
      dispatch({ type: SET_AUTH, payload: { currentUser: null } })
      navigate('/sign-in', { replace: true })
    } catch (error) {
      console.error(error)
      enqueueSnackbar(error.message, {
        variant: 'error'
      })
    }
  }

  return (
    <>
      <Container className={classes.root} component='main' maxWidth='md'>
        <Paper elevation={3} className={classes.paper}>
          <Grid container className={classes.screenContainer}>
            <Grid item xs={5}>
              <Box height='70vh'>
                <Box height='50%' flexGrow={1} style={{ overflow: 'hidden' }}>
                  <ListOnlines />
                </Box>
                <Box height='50%' flexGrow={1} style={{ overflow: 'hidden' }}>
                  <ListCustomRooms />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={7}>
              {currentRoomId ? <Chat roomId={currentRoomId} /> : <Welcome />}
            </Grid>
          </Grid>
        </Paper>
        <Tooltip title='Sign out' placement='top'>
          <Fab aria-label='Sign out' className={classes.signOutIcon} color='primary' onClick={handleLogout}>
            <ExitToAppIcon />
          </Fab>
        </Tooltip>
        <Tooltip title='Add a room' placement='top'>
          <Fab
            aria-label='add room'
            className={classes.addIcon}
            color='primary'
            onClick={() =>
              dispatch({
                type: START_ADD_DIALOG_ROOM
              })}
          >
            <AddCircleIcon />
          </Fab>
        </Tooltip>
        <Tooltip title='Back to Home' placement='top'>
          <Fab aria-label='home' className={classes.homeIcon} color='primary' onClick={() => navigate('/rooms')}>
            <HomeIcon />
          </Fab>
        </Tooltip>
      </Container>
      <AddRoomDialog />
    </>
  )
}

export default Rooms
