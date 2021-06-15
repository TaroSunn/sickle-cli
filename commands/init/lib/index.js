'use strict';
const path = require('path')
const fse = require('fs-extra')
const semver = require('semver')
const inquirer = require('inquirer')
const Command = require('@sickle/cli-command')
const log = require('@sickle/cli-log')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !! this._argv[1].force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    async exec() {
        try {
            const ret = await this.prepare()  
            if(ret) {

            }
        } catch (error) {
            log.error(error)
        }
    }

    async prepare() {
        const localPath = process.cwd()
        if(!this.isDirEmpty(localPath)) {
            let ifContinue = false
            if(!this.force) {
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                })).ifContinue
                if(!ifContinue) {
                    return
                }
            }
            if(ifContinue || this.force) {
                const {confirmDelete} = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？'
                })
                if(confirmDelete) {
                    fse.emptyDirSync(localPath)
                }
            }
        }
        return await this.getProjectInfo()
    }
    async getProjectInfo() {
        const projectInfo = {}
        const {type} = await inquirer.prompt({
            type: 'list',
            message: '请选择项目初始化类型',
            name: 'type',
            default: TYPE_PROJECT,
            choices: [{
                name: '项目',
                value: TYPE_PROJECT
            }, {
                name: '组件',
                value: TYPE_COMPONENT
            }]
        })
        log.verbose('type', type)
        if(type === TYPE_PROJECT) {
            const o = await inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function(v) {
                    const done = this.async();
                    setTimeout(function() {
                    if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])$/.test(v)) {
                        done('请输入合法的项目名称!');
                        return;
                    }
                    done(null, true);
                    }, 0);
                },
                filter: (v) => {
                    return v
                }
            }, {
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
                default: '1.0.0',
                validate: function(v) {
                    const done = this.async();
                    setTimeout(function() {
                    if (!(!!semver.valid(v))) {
                        done('请输入合法的版本号!');
                        return;
                    }
                    done(null, true);
                    }, 0);
                },
                filter: (v) => {
                    return semver.valid(v) ? semver.valid(v) : v
                }
            }])
            console.log(o)
        } else if(type === TYPE_COMPONENT) {

        }
        return projectInfo
    }
    isDirEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ))
        return !fileList || fileList.length <= 0
    }
}

function init(argv) {
    return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand;
