import { Buffer } from 'buffer'
import scryptJs from 'scrypt-js'

export const getMessageFromUnknownError = (error: unknown): string => {
  if (typeof error === 'string') return error
  else if (error instanceof Error) return error.message
  else if (typeof error === 'object') return JSON.stringify(error)
  return 'An unknown error happened'
}

export const encode = (password: string): Buffer => Buffer.from(password.normalize('NFKC'), 'utf8')

export const hashPassword = async (password: string, salt: string): Promise<string> =>
  // scryptJs returns Uint8Array so we convert it to a proper buffer
  // to avoid problems
  Buffer.from(await scryptJs.scrypt(encode(password), encode(salt), 16384, 8, 1, 64)).toString('base64')
