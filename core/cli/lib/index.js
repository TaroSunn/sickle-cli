'use strict';

module.exports = core;

const {homedir} = require('os')
const path = require('path')
const log = require('@sickle/cli-log')
const {getNpmSemverVersion} = require('@sickle/cli-get-npm-info')
const semver = require('semver')
const colors = require('colors/safe')
const pathExists = require('path-exists')
const {LOWEST_NODE_VERSION, DEFAULT_CLI_HOME} = require('./const')
const pkg = require('../package.json')

async function core(...arg) {
    try {
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
        checkInputArgs()
        checkEnv()
        await checkGlobalUpdate()
    } catch (error) {
        log.error(error.message)
    }
}

function checkPkgVersion() {
    log.notice('cli', pkg.version)
}

function checkNodeVersion() {
    const currentVersion = process.version
    if(!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
        throw new Error(colors.red(`@sickel/cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Nodejs`))
    }
}

function checkRoot() {
    const rootCheck = require('root-check')
    rootCheck()
}


function checkUserHome() {
    if(!homedir() || !pathExists(homedir())) {
        throw new Error(colors.red('当前登陆用户主目录不存在！'))
    }
}

function checkInputArgs() {
    const minimist = require('minimist')
    const args = minimist(process.argv.slice(2))
    checkArgs(args)
}
function checkArgs(args) {
    if(args.debug) {
        process.env.LOG_LEVEL = 'verbose'
    } else {
        process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
}


function checkEnv() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(homedir(), '.env')
    if(pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
    log.verbose('环境变量', process.env.CLI_HOME_PATH)
}

function createDefaultConfig() {
    const cliConfig = {
        home: homedir()
    }
    if(process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(homedir(), process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(homedir(), DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome
    return cliConfig
}

async function checkGlobalUpdate() {
    const currentVersion = pkg.version
    const npmName = pkg.name
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
    if(lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(colors.yellow(`请手动更新${npmName},当前版本: ${currentVersion}, 最新版本: ${lastVersion}
            更新命令: npm install -g ${npmName}
        `))
    }
}