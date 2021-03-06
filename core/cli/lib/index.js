'use strict';

module.exports = core;

const {homedir} = require('os')
const path = require('path')
const log = require('@sickle/cli-log')
const exec = require('@sickle/cli-exec')
const {getNpmSemverVersion} = require('@sickle/cli-get-npm-info')
const semver = require('semver')
const colors = require('colors/safe')
const pathExists = require('path-exists').sync
const commander = require('commander')
const {DEFAULT_CLI_HOME} = require('./const')
const pkg = require('../package.json')

const program = new commander.Command()

async function core(...arg) {
    try {
        await prepare()
        registerCommand()
    } catch (error) {
        log.error(error.message)
        if(process.env.LOG_LEVEL === 'verbose') {
            console.log(error)
        }
    }
}

async function prepare() {
    checkPkgVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    await checkGlobalUpdate()
}

function checkPkgVersion() {
    log.notice('cli', pkg.version)
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


function checkEnv() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(homedir(), '.env')
    if(pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
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

function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否制定本地调试文件路径', '')        

    program
        .command('init [projectName]')
        .option('-f, --force', '是否强制初始化项目目录')
        .action(exec)

    program.on('option:debug', () => {
        const option = program.opts()
        if(option.debug) {
            process.env.LOG_LEVEL = 'verbose'
        } else {
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL
    })

    program.on('option:targetPath', () => {
        const option = program.opts()
        process.env.CLI_TARGET_PATH = option.targetPath
    })

    program.on('command:*', (obj) => {
        const availableCommands = program.commands.map(cmd => cmd.name())
        console.log(colors.red('未知命令：' + obj[0]))
        console.log(colors.red('可用命令：' + availableCommands.join(',')))
    })

    program.parse(process.argv)
    if(program.args && program.args.length < 1) {
        program.outputHelp()
        console.log()
    }
}
