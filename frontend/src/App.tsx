import { useContext, useEffect, useState, type FC } from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import { Navigate, HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { SnackbarProvider } from 'notistack'

import ErrorBoundary from './components/ErrorBoundary'
import Rooms from './containers/Rooms'
import SignIn from './containers/SignIn'
import SignUp from './containers/SignUp'
import { SocketContext } from './stores/SocketContext'
import theme from './theme'
import { Room, User } from './services/api'
import { SocketActionKind } from './stores/reducer/constants'

const App: FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [state, dispatch] = useContext(SocketContext)

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        const currentUser = User.getCurrentUser() ?? await User.updateCurrentUser()
        dispatch({ type: SocketActionKind.SET_AUTH, payload: { currentUser } })
        dispatch({
          type: SocketActionKind.SET_ROOMS,
          payload: {
            rooms: await Room.list()
          }
        })
        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
      }
    }

    void init()
  }, [dispatch])

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>
          <ErrorBoundary>
            <CssBaseline />
            {isLoading
              ? (
                <Box height='100vh' width='100vw' display='flex' justifyContent='center' alignItems='center'>
                  <CircularProgress />
                </Box>
                )
              : (
                <Router>
                  <Routes>
                    <Route path='/sign-up' element={state.currentUser == null ? <SignUp /> : <Navigate to='/rooms' />} />
                    <Route path='/sign-in' element={state.currentUser == null ? <SignIn /> : <Navigate to='/rooms' />} />
                    <Route path='/rooms/' element={state.currentUser != null ? <Rooms /> : <Navigate to='/sign-in' />} />
                    <Route path='/rooms/:roomId' element={state.currentUser != null ? <Rooms /> : <Navigate to='/sign-in' />} />
                    <Route path='/' element={<Navigate to='/rooms' />} />
                  </Routes>
                </Router>
                )}
          </ErrorBoundary>
        </SnackbarProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

export default App
