'use strict';

const Command = require('@sickle/cli-command')
const log = require('@sickle/cli-log')

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._argv[1].force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    exec() {
        console.log('init')
    }
}
function init(...argv) {
    // console.log('init', projectName, options.force, process.env.CLI_TARGET_PATH)
    return new InitCommand(...argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
