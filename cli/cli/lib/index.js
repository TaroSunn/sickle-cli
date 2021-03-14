'use strict';

const log = require('@sickle/cli-log')
const {getNpmSemverVersion} = require('@sickle/cli-get-npm-info')
const path = require('path')
const semver = require('semver')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const colors = require('colors/safe')
const {version, name} = require('../package.json')
const {DEFAULT_CLI_HOME, LOWEST_NODE_VERSION} = require('./const')



async function core() {
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

// 获取项目版本号
function checkPkgVersion() {
    log.notice('cli', version)
}

// 检查 Nodejs 版本
function checkNodeVersion() {
    // 获取 当前node版本号
    const currentVersion = process.version
    const lowestVersion = LOWEST_NODE_VERSION
    // 对比最低node版本号
    if(!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(colors.red(`sickle-cli 需要安装 v${lowestVersion} 以上的的Nodejs 版本`))
    }
}

// 检查root账户
function checkRoot() {
    const checkRoot = require('root-check')
    checkRoot()
}

// 检查用户主目录
function checkUserHome() {
    if(!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登陆用户主目录不存在'))
    }
}

// 检查入参
function checkInputArgs() {
    const minimist = require('minimist')
    const args = minimist(process.argv.slice(2))
    checkArgs(args)
}

// debug模式
function checkArgs(args) {
    if(args.debug) {
        process.env.LOW_LEVEL = 'verbose'
    } else {
        process.env.LOW_LEVEL = 'info'
    }
    log.level = process.env.LOW_LEVEL
}

// 检查环境变量
function checkEnv() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env')
    let config = {}
    if(pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
    log.verbose('环境变量', process.env.CLI_HOME_PATH)
}

// 配置环境变量
function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if(process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome
}

// 检查脚手架版本
async function checkGlobalUpdate() {
    // 获取当前版本号和包名 name version
    // 调用npm api 获取npm上的包版本
    // 比对版本
    const lastVersion = await getNpmSemverVersion(name, version)
    // 提示
    if(lastVersion) {
        log.warn(colors.yellow(`请手动更新 ${name}, 当前版本: ${version}, 最新版本: ${lastVersion}
            更新命令: npm install -g ${name}    
    `))
    }
}

module.exports = core;