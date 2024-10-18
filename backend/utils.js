import crypto from 'crypto'
import { promisify } from 'util'
import { SignJWT } from 'jose'
import { settings } from './config.js'

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

const randomString = (length = 10) => randomBytes(length)
  .then(randomBytes => randomBytes
    .toString('base64')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, length)
  )

export const generateSignupJWT = async () => {
  const token = new SignJWT({
    iss: settings.JWT_SHARED_SECRET_ID,
    jti: await randomString(), // So the JWT is only usable once.
    iat: Math.floor(Date.now() / 1000), // JWT valid only for 10 minutes. `Date.now()` returns the timestamp in milliseconds, this needs it in seconds.
    join_team: true
  })
    .setProtectedHeader({ alg: 'HS256' })
  return token.sign(Buffer.from(settings.JWT_SHARED_SECRET, 'ascii'))
}
