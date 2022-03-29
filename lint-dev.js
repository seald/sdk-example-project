const fs = require('fs/promises')
const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const patchesDirectory = path.join(__dirname, 'patches-master')

const listPatches = async () => {
  try {
    const files = await fs.readdir(patchesDirectory)
    const seriesFileIndex = files.findIndex(x => x === 'series')
    if (!seriesFileIndex) throw new Error('`series` file not found')
    const series = await fs.readFile(path.join(patchesDirectory, 'series'), { encoding: 'utf8' })
    const patches = series.split('\n')
    patches.shift() // Removing first line, which is a comment
    patches.pop() // Removing last line, which is empty
    for (const patch of patches) {
      if (!files.includes(patch)) throw new Error(`Missing patch ${patch}`)
    }
    return patches
  } catch (err) {
    console.error(err)
    throw err
  }
}

const lint = async () => {
  await exec('npm run lint', { cwd: path.join(__dirname, 'frontend') })
  await exec('npm run lint', { cwd: path.join(__dirname, 'backend') })
}

const lintAll = async () => {
  console.log('Linting bare version...')
  await lint()
  console.log('Bare version is linted')

  await exec(`stg import -s patches-master/series`)
  const patches = await listPatches()
  for (const patchName of patches) {
    await exec(`stg goto ${patchName}`)
    console.log(`${patchName} is applied`)
    console.log(`Linting ${patchName} ...`)
    await lint()
    console.log(`${patchName} is linted, apply next patch...`)
  }
}

const main = async () => {
  let exitCode = 0
  try {
    await lintAll()
    console.log('Linting task successful!')
  } catch (err) {
    console.error('Linting failed:')
    console.error(err.stderr)
    console.error(err.stdout)
    exitCode = 1
  }
  try {
    console.log('Reverting applied patches')
    await exec(`stg pop -k -a`)
    await exec(`stg delete 1-quick-start..6-two-man-rule-sms`)
  } catch (err) {
    exitCode = 2
    console.error('Could not revert patches, leaving a mess, sorry.', err)
  }
  process.exit(exitCode)
}

main()
