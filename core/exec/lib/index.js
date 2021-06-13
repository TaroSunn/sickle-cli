'use strict';

module.exports = exec;

const path = require('path')
const log = require('@sickle/cli-log')
const Package = require('@sickle/cli-package')

const SETTINGS = {
    init: '@sickle/cli-init'
}
const CACHE_DIR = 'dependencies'

async function exec(...args) {
    let targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    let storePath = ''
    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)

    let pkg

    const cmdObj = args[args.length - 1]
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'

    if(!targetPath) {
        targetPath = path.resolve(homePath, CACHE_DIR)
        storePath = path.resolve(targetPath, 'node_modules')
        log.verbose('targetPath', targetPath)
        log.verbose('storePath', storePath)

        pkg = new Package({
            targetPath,
            storePath,
            packageName,
            packageVersion
        })
    
        if(await pkg.exists()) {
            console.log('更新package')
            // 检查更新
        } else {
            await pkg.install()
            // 安装
        }
    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        })
    }
    const rootFile = pkg.getRootFilePath()
    if(rootFile) {
        require(rootFile).apply(null, arguments)
    }
}
