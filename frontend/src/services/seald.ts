import SealdSDKConstructor, { type SealdSDK } from '@seald-io/sdk/browser'
import SealdSDKPluginSSKSPassword from '@seald-io/sdk-plugin-ssks-password/browser'
import getSetting from '../settings'

let sealdSDKInstance: SealdSDK

const instantiateSealdSDK = async ({ databaseKey, sessionID }: { databaseKey: string, sessionID: string }): Promise<void> => {
  sealdSDKInstance = SealdSDKConstructor({
    appId: await getSetting('APP_ID'),
    apiURL: await getSetting('API_URL'), // Optional. If not set, defaults to public apiURL https://api.seald.io
    databaseKey,
    databasePath: `seald-example-project-session-${sessionID}`,
    plugins: [SealdSDKPluginSSKSPassword(await getSetting('KEY_STORAGE_URL'))] // Optional. If not set, defaults to public keyStorageURL https://ssks.seald.io
  })
}

export const getSealdSDKInstance = (): SealdSDK => sealdSDKInstance

export const createIdentity = async ({ userId, password, signupJWT, databaseKey, sessionID }: { userId: string, password: string, signupJWT: string, databaseKey: string, sessionID: string }): Promise<string> => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  const accountInfo = await sealdSDKInstance.initiateIdentity({ signupJWT })
  await sealdSDKInstance.ssksPassword.saveIdentity({ userId, password })
  return accountInfo.sealdId
}

export const retrieveIdentityFromLocalStorage = async ({ databaseKey, sessionID }: { databaseKey: string, sessionID: string }): Promise<string> => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  await sealdSDKInstance.initialize()
  const status = await sealdSDKInstance.registrationStatus()
  if (status !== 'registered') {
    throw new Error('Not registered')
  }
  const accountInfo = await sealdSDKInstance.getCurrentAccountInfo()
  return accountInfo.sealdId
}

export const retrieveIdentity = async ({ userId, password, databaseKey, sessionID }: { userId: string, password: string, databaseKey: string, sessionID: string }): Promise<string> => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  return (await sealdSDKInstance.ssksPassword.retrieveIdentity({ userId, password })).sealdId
}
