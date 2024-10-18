import { type FC, useContext, useEffect } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { Box, Container, Fab, Grid, Paper, Tooltip } from '@mui/material'
import { AddCircle, ExitToApp, Home } from '@mui/icons-material'
import { useSnackbar } from 'notistack'

import Chat from '../components/Chat'
import ListCustomRooms from '../components/ListCustomRooms'
import ListOnlines from '../components/ListOnline'
import AddRoomDialog from '../components/ManageDialogRoom'
import Welcome from '../components/Welcome'
import { Room, setOffline, setOnline, User } from '../services/api'
import { SocketActionKind } from '../stores/reducer/constants'
import { type ServerToClientEvents, SocketContext } from '../stores/SocketContext'
import { getMessageFromUnknownError } from '../utils'

const Rooms: FC = () => {
  const navigate = useNavigate()
  const [{ socket }, dispatch] = useContext(SocketContext)
  const match = useMatch('/rooms/:currentRoomId')
  const currentRoomId = match?.params?.currentRoomId
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    const leavePage = (): void => {
      void setOffline()
      dispatch({ type: SocketActionKind.RESET_SOCKET })
    }
    window.addEventListener('onbeforeunload', leavePage)
    const manageOnlineActivity = async (): Promise<void> => {
      try {
        const socket = await setOnline()
        dispatch({ type: SocketActionKind.SET_SOCKET, payload: socket })
      } catch (error: Error | unknown) {
        console.error(error)
        enqueueSnackbar(getMessageFromUnknownError(error), {
          variant: 'error'
        })
      }
    }
    void manageOnlineActivity()
    return () => {
      window.removeEventListener('onbeforeunload', leavePage)
    }
  }, [dispatch, enqueueSnackbar])

  useEffect(() => {
    const init = async () => {
      const handler: ServerToClientEvents['room:edited'] | ServerToClientEvents['room:created'] = (room): void => {
        dispatch({
          type: SocketActionKind.EDIT_OR_ADD_ROOM,
          payload: {
            room: new Room(room)
          }
        })
      }
      const removedHandler: ServerToClientEvents['room:removed'] = ({ roomId }) => {
        dispatch({
          type: SocketActionKind.REMOVE_ROOM,
          payload: {
            roomId
          }
        })
      }
      if (socket != null) {
        socket.on('room:removed', removedHandler)
        socket.on('room:created', handler)
        socket.on('room:edited', handler)
      }
      return () => {
        if (socket != null) {
          socket.off('room:created')
          socket.off('room:edited')
          socket.off('room:removed')
        }
      }
    }
    void init()
  }, [dispatch, socket])

  const handleLogout = (): void => {
    void (async () => {
      try {
        await User.logout()
        dispatch({ type: SocketActionKind.SET_AUTH, payload: { currentUser: null } })
        navigate('/sign-in', { replace: true })
      } catch (error) {
        console.error(error)
        enqueueSnackbar(getMessageFromUnknownError(error), {
          variant: 'error'
        })
      }
    })()
  }

  return (
    <>
      <Container sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} component='main' maxWidth='md'>
        <Paper elevation={3} sx={{
          width: '100%'
        }}>
          <Grid container sx={{
            height: '70vh',
            overflow: 'hidden',
            bgcolor: 'primary.dark',
            color: 'primary.contrastText'
          }}>
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
              {(currentRoomId != null) ? <Chat roomId={currentRoomId} /> : <Welcome />}
            </Grid>
          </Grid>
        </Paper>
        <Tooltip title='Sign out' placement='top'>
          <Fab aria-label='Sign out' sx={(theme) => ({
            position: 'absolute',
            bottom: theme.spacing(2),
            right: theme.spacing(2)
          })} color='primary' onClick={handleLogout}>
            <ExitToApp />
          </Fab>
        </Tooltip>
        <Tooltip title='Add a room' placement='top'>
          <Fab
            aria-label='add room'
            sx={(theme) => ({
              position: 'absolute',
              bottom: theme.spacing(10),
              right: theme.spacing(2)
            })}
            color='primary'
            onClick={() => {
              dispatch({
                type: SocketActionKind.START_ADD_DIALOG_ROOM
              })
            }}
          >
            <AddCircle />
          </Fab>
        </Tooltip>
        <Tooltip title='Back to Home' placement='top'>
          <Fab aria-label='home' sx={(theme) => ({
            position: 'absolute',
            bottom: theme.spacing(18),
            right: theme.spacing(2)
          })} color='primary' onClick={() => { navigate('/rooms') }}>
            <Home />
          </Fab>
        </Tooltip>
      </Container>
      <AddRoomDialog />
    </>
  )
}
export default Rooms
