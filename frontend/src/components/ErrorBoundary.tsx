import React, { type ReactNode } from 'react'
import { Box, Alert, AlertTitle } from '@mui/material'

class ErrorBoundary extends React.Component<{ children?: ReactNode }, { hasError: boolean }> {
  constructor (props: { children?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError (): { hasError: boolean } {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch (error: unknown, errorInfo: unknown): void {
    console.error(error, errorInfo)
  }

  render (): ReactNode {
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
