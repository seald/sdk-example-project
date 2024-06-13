import crypto from 'crypto'
import { promisify } from 'util'

const randomBytes = promisify(crypto.randomBytes)
const scrypt = promisify(crypto.scrypt)

export const hashPassword = async (password, salt) => {
  if (!salt) salt = await randomBytes(64)
  const derivedKey = await scrypt(
    Buffer.from(password.normalize('NFKC'), 'utf-8'),
    salt,
    64,
    { N: 16384, r: 8, p: 1 }
  )
  return `${salt.toString('base64')};${derivedKey.toString('base64')}`
}

export const parseHashedPassword = hashedPassword => {
  const [saltb64, derivedKeyb64] = hashedPassword.split(';')
  return {
    salt: Buffer.from(saltb64, 'base64'),
    derivedKey: Buffer.from(derivedKeyb64, 'base64')
  }
}
