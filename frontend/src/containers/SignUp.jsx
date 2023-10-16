/* eslint-env browser */
import React, { useCallback, useContext, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import makeStyles from '@mui/styles/makeStyles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSnackbar } from 'notistack'

import Copyright from '../components/Copyright'
import { Room, User } from '../services/api'
import { SET_AUTH, SET_ROOMS } from '../stores/reducer/constants.js'
import { SocketContext } from '../stores/SocketContext.jsx'
import { createIdentity } from '../services/seald'

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  logo: {
    width: 200,
    marginBottom: 20
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1)
  },
  wrapperButton: {
    margin: theme.spacing(1),
    position: 'relative'
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  },
  buttonProgress: {
    color: theme.success,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -12
  }
}))

function SignUp () {
  const { enqueueSnackbar } = useSnackbar()
  const [isLoading, setIsLoading] = useState(false)
  const [, dispatch] = useContext(SocketContext)
  const classes = useStyles()

  const handleSignupSubmit = useCallback(
    async e => {
      e.preventDefault()
      const formData = new FormData(e.target)
      try {
        setIsLoading(true)
        const emailAddress = formData.get('emailAddress')
        const password = formData.get('password')
        const name = formData.get('name')
        const currentUser = await User.createAccount({ emailAddress, password, name })
        const sealdId = await createIdentity({
          userId: currentUser.id,
          password,
          databaseKey: currentUser.databaseKey,
          sessionID: currentUser.sessionID,
          signupJWT: currentUser.signupJWT
        })
        await currentUser.setSealdId(sealdId)
        dispatch({ type: SET_AUTH, payload: { currentUser } })
        dispatch({
          type: SET_ROOMS,
          payload: {
            rooms: await Room.list()
          }
        })
      } catch (error) {
        enqueueSnackbar(error.message, {
          variant: 'error'
        })
      } finally {
        setIsLoading(false)
      }
    },
    [enqueueSnackbar, dispatch]
  )

  function SignupForm () {
    return (
      <form className={classes.form} onSubmit={handleSignupSubmit}>
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
          name='name'
          label='Display name'
          type='text'
          id='name'
          autoComplete='username'
        />
        <div className={classes.wrapperButton}>
          <Button type='submit' disabled={isLoading} fullWidth variant='contained' color='primary' className={classes.submit}>
            Sign up
          </Button>
          {isLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
        </div>
      </form>
    )
  }

  return (
    <Container component='main' maxWidth='xs'>
      <CssBaseline />
      <div className={classes.paper}>
        <Typography component='h1' variant='h5'>
          Sign up
        </Typography>
        <SignupForm />
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
