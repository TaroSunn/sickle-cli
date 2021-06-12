'use strict';

module.exports = exec;

const log = require('@sickle/cli-log')
const Package = require('@sickle/cli-package')

const SETTINGS = {
    init: '@sickle/cli-init'
}

function exec(...args) {
    const targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)

    const cmdObj = args[args.length - 1]
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'

    const pkg = new Package({
        targetPath,
        packageName,
        packageVersion
    })
    console.log(pkg.getRootFilePath())
}
