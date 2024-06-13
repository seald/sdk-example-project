import SealdSDKConstructor, { type SealdSDK } from '@seald-io/sdk/browser'
import SealdSDKPluginSSKS2MR from '@seald-io/sdk-plugin-ssks-2mr/browser'
import getSetting from '../settings'
import { User } from './api.ts'

let sealdSDKInstance: SealdSDK

const instantiateSealdSDK = async ({ databaseKey, sessionID }: { databaseKey: string, sessionID: string }): Promise<void> => {
  sealdSDKInstance = SealdSDKConstructor({
    appId: await getSetting('APP_ID'),
    apiURL: await getSetting('API_URL'), // Optional. If not set, defaults to public apiURL https://api.seald.io
    databaseKey,
    databasePath: `seald-example-project-session-${sessionID}`,
    plugins: [SealdSDKPluginSSKS2MR(await getSetting('KEY_STORAGE_URL'))] // Optional. If not set, defaults to public keyStorageURL https://ssks.seald.io
  })
}

export const getSealdSDKInstance = (): SealdSDK => sealdSDKInstance

export const createIdentity = async ({ signupJWT, databaseKey, sessionID }: { signupJWT: string, databaseKey: string, sessionID: string }): Promise<string> => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  const accountInfo = await sealdSDKInstance.initiateIdentity({ signupJWT })
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

export const saveIdentity2MR = async ({ userId, twoManRuleKey, emailAddress, twoManRuleSessionId, challenge }: { userId: string, twoManRuleKey: string, emailAddress: string, twoManRuleSessionId: string, challenge?: string }): Promise<void> => {
  await sealdSDKInstance.ssks2MR.saveIdentity({
    challenge,
    authFactor: {
      type: 'EM',
      value: emailAddress
    },
    twoManRuleKey,
    userId,
    sessionId: twoManRuleSessionId
  })
}

export const sendChallenge2MR = async (): Promise<{ twoManRuleSessionId: string, twoManRuleKey: string, mustAuthenticate: boolean }> => {
  return await User.sendChallenge2MR()
}

export const retrieveIdentity2MR = async ({ userId, emailAddress, twoManRuleKey, twoManRuleSessionId, challenge, databaseKey, sessionID }: { userId: string, twoManRuleKey: string, emailAddress: string, twoManRuleSessionId: string, challenge: string, databaseKey: string, sessionID: string }): Promise<string> => {
  await instantiateSealdSDK({ databaseKey, sessionID })
  return (await sealdSDKInstance.ssks2MR.retrieveIdentity({
    challenge,
    authFactor: {
      type: 'EM',
      value: emailAddress
    },
    twoManRuleKey,
    userId,
    sessionId: twoManRuleSessionId
  })).accountInfo.sealdId
}
