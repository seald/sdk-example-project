import SealdSDK from '@seald-io/sdk'
import SealdSDKPluginSSKSPassword from '@seald-io/sdk-plugin-ssks-password'
import getSetting from '../settings'

let sealdSDKInstance = null

const instantiateSealdSDK = async ({ databaseKey, sessionID }) => {
  sealdSDKInstance = SealdSDK({
    appId: await getSetting('APP_ID'),
    apiURL: await getSetting('API_URL'), // Optional. If not set, defaults to public apiURL https://api.seald.io
    databaseKey,
    databasePath: `seald-example-project-session-${sessionID}`,
    plugins: [
      SealdSDKPluginSSKSPassword(await getSetting('KEY_STORAGE_URL')) // Optional. If not set, defaults to public keyStorageURL https://ssks.seald.io
    ]
  })
  await sealdSDKInstance.initialize()
}

export const getSealdSDKInstance = () => sealdSDKInstance

export const createIdentity = async ({ userId, password, databaseKey, sessionID, signupJWT }) => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  const accountInfo = await sealdSDKInstance.initiateIdentity({ signupJWT })
  await sealdSDKInstance.ssksPassword.saveIdentity({ userId, password })
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

export const retrieveIdentity = async ({ userId, password, databaseKey, sessionID }) => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  return await sealdSDKInstance.ssksPassword.retrieveIdentity({ userId, password })
}
