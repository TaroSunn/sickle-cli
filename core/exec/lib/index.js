'use strict';

module.exports = exec;

const Package = require('@sickle/cli-package')

function exec() {
    const pkg = new Package()
    console.log(process.env.CLI_TARGET_PATH,'123')
    // TODO
}
