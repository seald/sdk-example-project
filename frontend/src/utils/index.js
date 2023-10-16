import scryptJs from 'scrypt-js'
import { Buffer } from 'buffer'

export const filterWithoutCurrentUser = (users, currentUser) =>
  Object.fromEntries(Object.entries(users).filter(([key]) => key !== currentUser.uid))

export const encode = password => Buffer.from(password.normalize('NFKC'), 'utf8')

export const hashPassword = (password, salt) =>
  scryptJs.scrypt(encode(password), encode(salt), 16384, 8, 1, 64)
    // scryptJs returns Uint8Array so we convert it to a proper buffer
    // to avoid problems
    .then(res => Buffer.from(res).toString('base64'))
