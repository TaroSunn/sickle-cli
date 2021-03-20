'use strict';

const commander = require('commander')
const log = require('@sickle/cli-log')
const {getNpmSemverVersion} = require('@sickle/cli-get-npm-info')
const exec = require('@sickle/cli-exec')
const path = require('path')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const colors = require('colors/safe')
const {version, name, bin} = require('../package.json')
const {DEFAULT_CLI_HOME} = require('./const')

const program = new commander.Command()

async function core() {
    try {
        await prepare()
        registerCommand()
    } catch (error) {
        log.error(error.message)
        if(program.opts().debug) {
            console.log(e)
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

// 获取项目版本号
function checkPkgVersion() {
    log.info('cli', version)
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


// 命令注册
function registerCommand() {
    program
        .name(Object.keys(bin)[0])
        .usage('<command> [options]')
        .version(version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')

    // init命令
    program
        .command('init [projectName]')
        .option('-f, --force', '是否强制初始化项目') // 处理初始化项目文件夹有内容
        .action(exec)
    
    // debug模式
    program.on('option:debug', () => {
        if(program.opts().debug) {
            process.env.LOW_LEVEL = 'verbose'
        } else {
            process.env.LOW_LEVEL = 'info'
        }
        log.level = process.env.LOW_LEVEL
    })

    // 指定targetPath
    program.on('option:targetPath', () => {
        process.env.CLI_TARGET_PATH = program.opts().targetPath
    })

    // 未知命令
    program.on('command:*', (obj) => {
        const availableCommands = program.commands.map(cm => cmd.name())
        console.log(colors.red(`未知命令: ${obj[0]}`))
        console.log(colors.red(`可用命令: ${availableCommands.join(',')}`))
    })


    program.parse(process.argv)
    // 帮助信息
    if (program.args && program.args.length < 1) {
        program.outputHelp()
        console.log()
    }
}

module.exports = core;