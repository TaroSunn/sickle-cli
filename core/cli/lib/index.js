'use strict';

module.exports = core;
const log = require('@sickle/cli-utils-log')
const pkg = require('../package.json')

function core(...arg) {
    checkPkgVersion()
}


function checkPkgVersion() {
    log.notice('cli', pkg.version)
}