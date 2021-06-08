'use strict';

module.exports = core;

const log = require('@sickle/cli-utils-log')
const semver = require('semver')
const colors = require('colors/safe')
const {homedir} = require('os')
const pathExists = require('path-exists')
const {LOWEST_NODE_VERSION} = require('./const')
const pkg = require('../package.json')

function core(...arg) {
    try {
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
        checkInputArgs()
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
