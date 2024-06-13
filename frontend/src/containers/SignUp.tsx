/* eslint-env browser */
import { type FC, type FormEvent, type JSX, useCallback, useContext, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
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
import { useTheme } from '@mui/material/styles'
import { getMessageFromUnknownError } from '../utils'
import { createIdentity, saveIdentity2MR, sendChallenge2MR } from '../services/seald'

const SignUp: FC = () => {
  const theme = useTheme()
  const { enqueueSnackbar } = useSnackbar()
  const [challengeSession, setChallengeSession] = useState<{
    twoManRuleSessionId: string
    twoManRuleKey: string
    phoneNumber: string
  } | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [, dispatch] = useContext(SocketContext)

  const handleSignupSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    const asyncHandleSignupSubmit = async (): Promise<void> => {
      const formData = new FormData(event.target as HTMLFormElement)
      try {
        const emailAddress = formData.get('emailAddress') as string
        const password = formData.get('password') as string
        const phoneNumber = formData.get('phoneNumber') as string
        const name = formData.get('name') as string
        const currentUser = await User.createAccount({ emailAddress, password, phoneNumber, name })
        const sealdId = await createIdentity({
          signupJWT: currentUser.signupJWT!,
          databaseKey: currentUser.databaseKey!,
          sessionID: currentUser.sessionID!
        })
        await currentUser.setSealdId(sealdId)
        const { twoManRuleSessionId, twoManRuleKey, mustAuthenticate } = await sendChallenge2MR()
        setCurrentUser(currentUser)
        if (mustAuthenticate) {
          setChallengeSession({
            twoManRuleSessionId,
            twoManRuleKey,
            phoneNumber
          })
          console.log('session set')
        } else {
          await saveIdentity2MR({
            userId: currentUser.id,
            phoneNumber,
            twoManRuleKey,
            twoManRuleSessionId,
            challenge: undefined
          })
          dispatch({ type: SocketActionKind.SET_AUTH, payload: { currentUser } })
          dispatch({
            type: SocketActionKind.SET_ROOMS,
            payload: {
              rooms: await Room.list()
            }
          })
        }
      } catch (error) {
        enqueueSnackbar(getMessageFromUnknownError(error), {
          variant: 'error'
        })
      } finally {
        setIsLoading(false)
      }
    }
    void asyncHandleSignupSubmit()
  },
  [enqueueSnackbar, dispatch, setCurrentUser, setChallengeSession]
  )

  const handleChallengeSubmit = useCallback((event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    setIsLoading(true)
    const handleChallengeSubmitAsync = async (): Promise<void> => {
      const formData = new FormData(event.target as HTMLFormElement)
      try {
        setIsLoading(true)
        const challenge = formData.get('challenge') as string ?? undefined
        if (currentUser == null) throw new Error('currentUser is not defined')
        if (challengeSession == null) throw new Error('challengeSession is not defined')
        await saveIdentity2MR({
          userId: currentUser.id,
          phoneNumber: challengeSession.phoneNumber,
          twoManRuleKey: challengeSession.twoManRuleKey,
          twoManRuleSessionId: challengeSession.twoManRuleSessionId,
          challenge
        })
        dispatch({ type: SocketActionKind.SET_AUTH, payload: { currentUser } })
        dispatch({
          type: SocketActionKind.SET_ROOMS,
          payload: {
            rooms: await Room.list()
          }
        })
      } catch (error) {
        enqueueSnackbar(getMessageFromUnknownError(error), {
          variant: 'error'
        })
      } finally {
        setIsLoading(false)
      }
    }

    void handleChallengeSubmitAsync()
  },
  [enqueueSnackbar, dispatch, challengeSession, currentUser]
  )

  function SignupForm (): JSX.Element {
    return (
      <form style={{ marginTop: theme.spacing(1), width: '100%' }} onSubmit={handleSignupSubmit}>
        <TextField
          variant='outlined'
          margin='normal'
          required
          fullWidth
          id='email'
          label='Email Address'
          name='emailAddress'
          autoComplete='email'
          autoFocus
        />
        <TextField
          variant='outlined'
          margin='normal'
          required
          fullWidth
          name='password'
          label='Password'
          type='password'
          autoComplete='current-password'
          id='password'
        />
        <TextField
          variant='outlined'
          margin='normal'
          required
          fullWidth
          name='phoneNumber'
          label='phone number'
          type='tel'
          id='phoneNumber'
        />
        <TextField
          variant='outlined'
          margin='normal'
          required
          fullWidth
          name='name'
          label='Display name'
          type='text'
          id='name'
          autoComplete='username'
        />
        <div style={{
          margin: theme.spacing(1),
          position: 'relative'
        }}>
          <Button type='submit' disabled={isLoading} fullWidth variant='contained' color='primary' sx={{
            mt: 3,
            mb: 2,
            mx: 0
          }}>
            Sign up
          </Button>
          {isLoading && <CircularProgress size={24} sx={{
            color: 'success',
            position: 'absolute',
            top: '50%',
            left: '50%',
            mt: '-8px',
            ml: '-12px'
          }} />}
        </div>
      </form>
    )
  }

  const ChallengeForm: FC = () => (
    <form onSubmit={handleChallengeSubmit} style={{
      width: '100%'
    }}>
      <Typography>
        You received an OTP at {challengeSession?.phoneNumber}
      </Typography>
      <TextField
        variant='outlined'
        margin='normal'
        required
        fullWidth
        id='challenge'
        label='challenge'
        name='challenge'
        autoFocus
      />
      <div style={{
        margin: theme.spacing(1),
        position: 'relative'
      }}>
        <Button type='submit' disabled={isLoading} fullWidth variant='contained' color='primary'
                sx={{
                  mt: 3,
                  mb: 2,
                  mx: 0
                }}>
          Sign up
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
    <Container component='main' maxWidth='xs'>
      <CssBaseline />
      <div style={{
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography component='h1' variant='h5'>
          Sign up
        </Typography>
        {challengeSession == null ? <SignupForm /> : <ChallengeForm />}
        <Grid container>
          <Grid item>
            <Link component={RouterLink} to='/sign-in' variant='body2'>
              Already have an account? Sign In
            </Link>
          </Grid>
        </Grid>
      </div>
      <Box mt={8}>
        <Copyright />
      </Box>
    </Container>
  )
}
export default SignUp
