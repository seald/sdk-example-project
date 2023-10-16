import React, { useContext, useEffect, useState } from 'react'
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
import { SET_AUTH, SET_ROOMS } from './stores/reducer/constants'

function App () {
  const [isLoading, setIsLoading] = useState(true)
  const [state, dispatch] = useContext(SocketContext)

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = User.getCurrentUser() // || await User.updateCurrentUser() // TODO : Seald-SDK loads in memory, cannot retrieve it from session, must type password
        dispatch({ type: SET_AUTH, payload: { currentUser } })
        dispatch({
          type: SET_ROOMS,
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

    init()
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
                    <Route path='/sign-up' exact element={!!state.currentUser === false ? <SignUp /> : <Navigate to='/rooms' />} />
                    <Route path='/sign-in' exact element={!!state.currentUser === false ? <SignIn /> : <Navigate to='/rooms' />} />
                    <Route path='/rooms/' exact element={!!state.currentUser === true ? <Rooms /> : <Navigate to='/sign-in' />} />
                    <Route path='/rooms/:roomId' exact element={!!state.currentUser === true ? <Rooms /> : <Navigate to='/sign-in' />} />
                    <Route path='/' exact element={<Navigate to='/rooms' />} />
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
