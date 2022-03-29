import React from 'react'
import { Link, Typography } from '@mui/material'

function Copyright () {
  return (
    <Typography variant='body2' color='textSecondary' align='center'>
      {'Copyright © '}
      <Link color='inherit' href='https://seald.io'>
        Seald
      </Link>{' '}
      {new Date().getFullYear()}
      .
    </Typography>
  )
}

export default Copyright
