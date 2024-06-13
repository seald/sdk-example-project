/* eslint-env browser */

interface Settings {
  APP_ID: string
  API_URL: string
  KEY_STORAGE_URL: string
  APPLICATION_SALT: string
}

let settings: Settings | undefined
let loadingPromise: Promise<Response> | undefined

const loadSettings = async (): Promise<void> => {
  if (loadingPromise == null) {
    loadingPromise = fetch('settings.json')
  }
  try {
    const response = await loadingPromise
    settings = await response.json()
  } catch {
    console.error('Failed to fetch settings, make sure settings.json is set.')
    throw Error('failed to fetch settings')
  }
  loadingPromise = undefined
  if ((settings == null) || Object.values(settings).includes('change_me')) {
    console.error("Settings are improperly set, make sure no variable is set at 'change_me'")
    throw Error('settings are not set')
  }
}

const getSetting = async (key: keyof Settings): Promise<string> => {
  if (settings == null) {
    await loadSettings()
  }

  return settings![key]
}

export default getSetting
