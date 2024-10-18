export const getMessageFromUnknownError = (error: unknown): string => {
  if (typeof error === 'string') return error
  else if (error instanceof Error) return error.message
  else if (typeof error === 'object') return JSON.stringify(error)
  return 'An unknown error happened'
}
