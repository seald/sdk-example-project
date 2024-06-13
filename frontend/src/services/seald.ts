import SealdSDKConstructor, { type SealdSDK } from '@seald-io/sdk/browser'
import SealdSDKPluginSSKSPassword from '@seald-io/sdk-plugin-ssks-password/browser'
import getSetting from '../settings'

let sealdSDKInstance: SealdSDK

const instantiateSealdSDK = async (): Promise<void> => {
  sealdSDKInstance = SealdSDKConstructor({
    appId: await getSetting('APP_ID'),
    apiURL: await getSetting('API_URL'), // Optional. If not set, defaults to public apiURL https://api.seald.io
    plugins: [SealdSDKPluginSSKSPassword(await getSetting('KEY_STORAGE_URL'))] // Optional. If not set, defaults to public keyStorageURL https://ssks.seald.io
  })
}

export const getSealdSDKInstance = (): SealdSDK => sealdSDKInstance

export const createIdentity = async ({ userId, password, signupJWT }: { userId: string, password: string, signupJWT: string }): Promise<string> => {
  await instantiateSealdSDK()
  const accountInfo = await sealdSDKInstance.initiateIdentity({ signupJWT })
  await sealdSDKInstance.ssksPassword.saveIdentity({ userId, password })
  return accountInfo.sealdId
}

export const retrieveIdentity = async ({ userId, password }: { userId: string, password: string }): Promise<string> => {
  await instantiateSealdSDK()
  return (await sealdSDKInstance.ssksPassword.retrieveIdentity({ userId, password })).sealdId
}
