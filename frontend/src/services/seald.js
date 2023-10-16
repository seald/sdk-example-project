import SealdSDK from '@seald-io/sdk'
import SealdSDKPluginSSKSPassword from '@seald-io/sdk-plugin-ssks-password'
import getSetting from '../settings'

let sealdSDKInstance = null

const instantiateSealdSDK = async () => {
  sealdSDKInstance = SealdSDK({
    appId: await getSetting('APP_ID'),
    apiURL: await getSetting('API_URL'), // Optional. If not set, defaults to public apiURL https://api.seald.io
    plugins: [SealdSDKPluginSSKSPassword(await getSetting('KEY_STORAGE_URL'))] // Optional. If not set, defaults to public keyStorageURL https://ssks.seald.io
  })
}

export const getSealdSDKInstance = () => sealdSDKInstance

export const createIdentity = async ({ userId, password, signupJWT }) => {
  await instantiateSealdSDK()
  const accountInfo = await sealdSDKInstance.initiateIdentity({ signupJWT })
  await sealdSDKInstance.ssksPassword.saveIdentity({ userId, password })
  return accountInfo.sealdId
}

export const retrieveIdentity = async ({ userId, password }) => {
  await instantiateSealdSDK()
  return await sealdSDKInstance.ssksPassword.retrieveIdentity({ userId, password })
}
