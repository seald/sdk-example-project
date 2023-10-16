import SealdSDK from '@seald-io/sdk'
import SealdSDKPluginSSKS2MR from '@seald-io/sdk-plugin-ssks-2mr'
import { User } from './api'
import getSetting from '../settings'

let sealdSDKInstance = null

const instantiateSealdSDK = async ({ databaseKey, sessionID }) => {
  sealdSDKInstance = SealdSDK({
    appId: await getSetting('APP_ID'),
    apiURL: await getSetting('API_URL'), // Optional. If not set, defaults to public apiURL https://api.seald.io
    databaseKey,
    databasePath: `seald-example-project-session-${sessionID}`,
    plugins: [
      SealdSDKPluginSSKS2MR(await getSetting('KEY_STORAGE_URL')) // Optional. If not set, defaults to public keyStorageURL https://ssks.seald.io
    ]
  })
  await sealdSDKInstance.initialize()
}

export const getSealdSDKInstance = () => sealdSDKInstance

export const createIdentity = async ({ databaseKey, sessionID, signupJWT }) => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  const accountInfo = await sealdSDKInstance.initiateIdentity({ signupJWT })
  return accountInfo.sealdId
}

export const retrieveIdentityFromLocalStorage = async ({ databaseKey, sessionID }) => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  const status = await sealdSDKInstance.registrationStatus()
  if (status !== 'registered') {
    throw new Error('Not registered')
  }
  const accountInfo = await sealdSDKInstance.getCurrentAccountInfo()
  return accountInfo.sealdId
}

export const saveIdentity2MR = async ({ userId, twoManRuleKey, phoneNumber, twoManRuleSessionId, challenge }) => {
  await sealdSDKInstance.ssks2MR.saveIdentity({
    challenge,
    authFactor: {
      type: 'SMS',
      value: phoneNumber
    },
    twoManRuleKey,
    userId,
    sessionId: twoManRuleSessionId
  })
}

export const sendChallenge2MR = async () => {
  return User.sendChallenge2MR()
}

export const retrieveIdentity2MR = async ({ userId, phoneNumber, twoManRuleKey, twoManRuleSessionId, challenge, databaseKey, sessionID }) => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  return await sealdSDKInstance.ssks2MR.retrieveIdentity({
    challenge,
    authFactor: {
      type: 'SMS',
      value: phoneNumber
    },
    twoManRuleKey,
    userId,
    sessionId: twoManRuleSessionId
  })
}
