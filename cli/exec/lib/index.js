'use strict';

const path = require('path')
const cp = require('child_process')
const Package = require('@sickle/cli-package')
const log = require('@sickle/cli-log')

const SETTINGS = {
    init: '@sickle/cli-init'
}

const CACHE_DIR = 'dependencies'

async function exec(...args) {
    let targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    let storePath = ''
    let pkg

    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)

    const [name,options,command] = [...args]

    const cmdName = command.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'

    if(!targetPath) {
        // 生成缓存路径
        targetPath = path.resolve(homePath, CACHE_DIR)
        storePath = path.resolve(targetPath, 'node_modules')
        log.verbose('targetPath', targetPath)
        log.verbose('sotrPath', storePath)
        pkg = new Package({
            targetPath,
            storePath,
            packageName,
            packageVersion
        })
        if(await pkg.exists()) {
            // 更新package
            await pkg.update()
        } else {
            // 安装package
            await pkg.install()
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
        try {
            let newArgs = [...args]
            const o = Object.create(null)
            Object.keys(command).forEach(key => {
                if(command.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
                    o[key] = command[key]
                }
            })
            newArgs[newArgs.length - 1] = o
            // const code = `require('${rootFile}').call(null ,${JSON.stringify(newArgs)})`
            const code = `require('${rootFile}')(${JSON.stringify(newArgs)})`
            const child = spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            })
            child.on('error', e => {
                log.error(e.message)
                process.exit(1)
            })
            child.on('exit', e => {
                log.verbose('命令执行成功:' + e)
                process.exit(e)
            })
            // require(rootFile)(...args)
        } catch (e) {
            log.error(e.message)
        }
    }

}

function spawn(command, args, options) {
    const win32 = process.platform === 'win32'
    const cmd = win32 ? 'cmd' : command
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args

    return cp.spawn(cmd, cmdArgs, options || {})

}

module.exports = exec;
