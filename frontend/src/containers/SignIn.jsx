/* eslint-env browser */
import React, { useCallback, useContext, useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import { retrieveIdentity } from '../services/seald'

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

function SignIn () {
  const { enqueueSnackbar } = useSnackbar()
  const [isLoading, setIsLoading] = useState(false)
  const [, dispatch] = useContext(SocketContext)
  const navigate = useNavigate()
  const classes = useStyles()
  const location = useLocation()

  const { from } = location.state || { from: { pathname: '/rooms' } }

  const handleSigninSubmit = useCallback(
    async e => {
      e.preventDefault()
      const formData = new FormData(e.target)
      try {
        setIsLoading(true)
        const emailAddress = formData.get('emailAddress')
        const password = formData.get('password')
        const currentUser = await User.login({ emailAddress, password })
        const { sealdId } = await retrieveIdentity({ userId: currentUser.id, password })
        currentUser.sealdId = sealdId
        dispatch({ type: SET_AUTH, payload: { currentUser } })
        dispatch({
          type: SET_ROOMS,
          payload: {
            rooms: await Room.list()
          }
        })
        navigate(from, { replace: true })
      } catch (error) {
        enqueueSnackbar(error.message, {
          variant: 'error'
        })
      } finally {
        setIsLoading(false)
      }
    },
    [navigate, enqueueSnackbar, from, dispatch]
  )

  function SigninForm () {
    return (
      <form className={classes.form} noValidate onSubmit={handleSigninSubmit}>
        <TextField
          variant='outlined'
          margin='normal'
          required
          fullWidth
          id='email'
          label='Email Address'
          name='emailAddress'
          autoFocus
          autoComplete='email'
        />
        <TextField
          variant='outlined'
          margin='normal'
          required
          fullWidth
          name='password'
          label='Password'
          type='password'
          id='password'
          autoComplete='current-password'
        />
        <div className={classes.wrapperButton}>
          <Button type='submit' disabled={isLoading} fullWidth variant='contained' color='primary' className={classes.submit}>
            Sign in
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
          Sign in
        </Typography>
        <SigninForm />
        <Grid container>
          <Grid item>
            <Link component={RouterLink} to='/sign-up' variant='body2'>
              Don't have an account? Sign Up
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

export default SignIn
