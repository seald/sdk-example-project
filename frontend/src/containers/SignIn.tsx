/* eslint-env browser */
import { type FC, type FormEvent, useCallback, useContext, useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation, type Location } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSnackbar } from 'notistack'

import Copyright from '../components/Copyright'
import { Room, User } from '../services/api'
import { SocketActionKind } from '../stores/reducer/constants.js'
import { SocketContext } from '../stores/SocketContext.jsx'
import { getMessageFromUnknownError } from '../utils'
import { retrieveIdentity } from '../services/seald'

const SignIn: FC = () => {
  const theme = useTheme()
  const { enqueueSnackbar } = useSnackbar()
  const [isLoading, setIsLoading] = useState(false)
  const [, dispatch] = useContext(SocketContext)
  const navigate = useNavigate()
  const location: Location<{ from: string }> = useLocation()

  const { from } = location.state ?? { from: { pathname: '/rooms' } }

  const handleSigninSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    const asyncHandleSigninSubmit = async (): Promise<void> => {
      try {
        const formData = new FormData(event.target as HTMLFormElement)

        const emailAddress = formData.get('emailAddress') as string
        const password = formData.get('password') as string
        const currentUser = await User.login({ emailAddress, password })
        const sealdId = await retrieveIdentity({
          userId: currentUser.id,
          password,
          sessionID: currentUser.sessionID!,
          databaseKey: currentUser.databaseKey!
        })
        currentUser.sealdId = sealdId
        dispatch({ type: SocketActionKind.SET_AUTH, payload: { currentUser } })
        dispatch({
          type: SocketActionKind.SET_ROOMS,
          payload: {
            rooms: await Room.list()
          }
        })
        navigate(from, { replace: true })
      } catch (error) {
        enqueueSnackbar(getMessageFromUnknownError(error), {
          variant: 'error'
        })
      } finally {
        setIsLoading(false)
      }
    }
    void asyncHandleSigninSubmit()
  },
  [navigate, enqueueSnackbar, from, dispatch]
  )

  const SigninForm: FC = () => (
    <form style={{ marginTop: theme.spacing(1), width: '100%' }} noValidate onSubmit={handleSigninSubmit}>
      <TextField
        variant="outlined"
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="emailAddress"
        autoFocus
        autoComplete="email"
      />
      <TextField
        variant="outlined"
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
      />
      <div style={{
        margin: theme.spacing(1),
        position: 'relative'
      }}>
        <Button type="submit" disabled={isLoading} fullWidth variant="contained" color="primary" sx={{
          mt: 3,
          mb: 2,
          mx: 0
        }}>
          Sign in
        </Button>
        {isLoading && <CircularProgress size={24} sx={{
          color: 'success',
          position: 'absolute',
          top: '50%',
          left: '50%',
          mt: '-8px',
          ml: '-12px'
        }}/>}
      </div>
    </form>
  )

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline/>
      <div style={{
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <SigninForm/>
        <Grid container>
          <Grid item>
            <Link component={RouterLink} to="/sign-up" variant="body2">
              Don&apos;t have an account? Sign Up
            </Link>
          </Grid>
        </Grid>
      </div>
      <Box mt={8}>
      <Copyright/>
      </Box>
    </Container>
  )
}
export default SignIn
