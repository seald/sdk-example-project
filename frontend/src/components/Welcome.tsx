import { type JSX, useContext } from 'react'
import { Box, Link, Typography } from '@mui/material'
import { SocketActionKind } from '../stores/reducer/constants'
import { SocketContext } from '../stores/SocketContext'

export default function Welcome (): JSX.Element {
  const [, dispatch] = useContext(SocketContext)

  return (
    <Box
      display='flex'
      sx={{ height: '70vh' }}
      flexDirection='column'
      alignItems='center'
      justifyContent='center'
      bgcolor='background.paper'
    >
      <Typography color='textPrimary' variant='body1' align='center'>
        Select a user or a room to discuss <br /> or{' '}
        <Link href='#' underline='always' onClick={() => { dispatch({ type: SocketActionKind.START_ADD_DIALOG_ROOM }) }}>
          create a room
        </Link>
      </Typography>
    </Box>
  )
}
