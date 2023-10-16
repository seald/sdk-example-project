/* eslint-env browser */
let settings
let loadingPromise

const loadSettings = async () => {
  if (!loadingPromise) {
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
  if (!settings || Object.values(settings).includes('change_me')) {
    console.error("Settings are improperly set, make sure no variable is set at 'change_me'")
    throw Error('settings are not set')
  }
}

const getSetting = async (key) => {
  if (!settings) {
    await loadSettings()
  }
  return settings[key]
}

export default getSetting
