'use strict';

module.exports = core;

const log = require('@sickle/cli-utils-log')
const semver = require('semver')
const colors = require('colors/safe')
const {LOWEST_NODE_VERSION} = require('./const')
const pkg = require('../package.json')

function core(...arg) {
    try {
        checkPkgVersion()
        checkNodeVersion()
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
    console.log(process.version)
}