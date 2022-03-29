const jose = require('jose')
const { v4: UUID } = require('uuid')
const crypto = require('crypto')
const { promisify } = require('util')
const { settings } = require('./config.js')

const randomBytes = promisify(crypto.randomBytes)
const scrypt = promisify(crypto.scrypt)

const hashPassword = async (password, salt) => {
  if (!salt) salt = await randomBytes(64)
  const derivedKey = await scrypt(
    Buffer.from(password.normalize('NFKC'), 'utf-8'),
    salt,
    64,
    { N: 16384, r: 8, p: 1 }
  )
  return `${salt.toString('base64')};${derivedKey.toString('base64')}`
}

const parseHashedPassword = hashedPassword => {
  const [saltb64, derivedKeyb64] = hashedPassword.split(';')
  return {
    salt: Buffer.from(saltb64, 'base64'),
    derivedKey: Buffer.from(derivedKeyb64, 'base64')
  }
}

const generateSignupJWT = async (JWTSharedSecret, JWTSharedSecretId, userId) => {
  const token = new jose.SignJWT({
    iss: JWTSharedSecretId,
    jti: UUID(), // So the JWT is only usable once. The `random` generates a random string, with enough entropy to never repeat : a UUIDv4 would be a good choice.
    iat: Math.floor(Date.now() / 1000), // Validité limitée à 10 minutes. `Date.now()` donne la date en millisecondes, il faut la date en secondes.
    join_team: true,
    connector_add: {
      value: `${userId}@${settings.APP_ID}`,
      type: 'AP'
    }
  })
    .setProtectedHeader({ alg: 'HS256' })
  return token.sign(Buffer.from(JWTSharedSecret, 'ascii'))
}

module.exports = { hashPassword, parseHashedPassword, generateSignupJWT }
