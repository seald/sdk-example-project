import React from 'react'
import { Box } from '@mui/material'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError () {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch (error, errorInfo) {
    console.error(error, errorInfo)
  }

  render () {
    return this.state.hasError
      ? (
        <Box height='100vh' width='100vw' display='flex' justifyContent='center' alignItems='center'>
          <Alert severity='error'>
            <AlertTitle>Error</AlertTitle>A fatal error has occurred — <strong>check it out!</strong>
          </Alert>
        </Box>
        )
      : (
          this.props.children
        )
  }
}

export default ErrorBoundary
