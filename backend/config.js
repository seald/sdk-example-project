import path from 'path'
import fs from 'fs'

let settingsJson, _settings
try {
  settingsJson = process.env.CONFIG_FILE || fs.readFileSync(path.join(import.meta.dirname, 'settings.json'))
} catch (err) {
  console.error('Settings file does not exist. Please create it.')
  process.exit(1)
}
try {
  _settings = JSON.parse(settingsJson)
} catch (err) {
  console.error('Settings file is not valid. Please fix it.')
  process.exit(1)
}
if (Object.values(_settings).includes('change_me')) {
  console.error('Settings are improperly set, make sure no variable is set at "change_me"')
  process.exit(1)
}

export const settings = _settings

const config = {
  session: {
    secret: settings.SESSION_SECRET,
    secureCookie: settings.HTTPS_ENABLED === true
  },
  uploadDir: settings.UPLOAD_DIR || path.join(import.meta.dirname, 'storage'),
  sequelize: {
    dialect: 'sqlite',
    storage: './sqlite/database.db'
  },
  settings
}

export default config
