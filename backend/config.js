const path = require('path')
const fs = require('fs')

let settingsJson, settings
try {
  settingsJson = process.env.CONFIG_FILE || fs.readFileSync(path.join(__dirname, 'settings.json'))
} catch (err) {
  console.error('Settings file does not exist. Please create it.')
  process.exit(1)
}
try {
  settings = JSON.parse(settingsJson)
} catch (err) {
  console.error('Settings file is not valid. Please fix it.')
  process.exit(1)
}
if (Object.values(settings).includes('change_me')) {
  console.error('Settings are improperly set, make sure no variable is set at "change_me"')
  process.exit(1)
}

const config = {
  session: {
    secret: settings.SESSION_SECRET,
    secureCookie: settings.HTTPS_ENABLED === true
  },
  uploadDir: settings.UPLOAD_DIR || path.join(__dirname, 'storage'),
  sequelize: {
    dialect: 'sqlite',
    storage: './sqlite/database.sqlite'
  },
  settings
}

module.exports = config
