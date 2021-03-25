'use strict';

const inquirer = require('inquirer')
const fse = require('fs-extra')
const fs = require('fs')
const path = require('path')
const semver = require('semver')
const userHome = require('user-home')
const {spinnerStart, sleep} = require('@sickle/cli-utils')
const Command = require('@sickle/cli-command')
const Package = require('@sickle/cli-package')

const log = require('@sickle/cli-log')
const getProjectTemplate = require('./getProjectTemplate')
const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._argv[1].force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    async exec() {
        try {
            // 准备阶段
            const projectInfo = await this.prepare()
            this.projectInfo = projectInfo
            if(projectInfo) {
                // 下载模版
                await this.downloadTemplate()
                // 安装模版
            }
        } catch (error) {
            log.error(error.message)
        }
    }
    async downloadTemplate() {
        const {projectTemplate} = this.projectInfo
        const templateInfo = this.template.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome, '.sickle-cli', 'template')
        const storePath = path.resolve(userHome, '.sickle-cli', 'template', 'node_modules')
        const {npmName, version} = templateInfo
        const templateNpm = new Package({
            targetPath,
            storePath,
            packageName: npmName,
            packageVersion: version
        })
        if(!await templateNpm.exists()) {
            const sipnner = spinnerStart('正在下载模版...')
            await sleep()
            try {
                await templateNpm.install()
                log.success('模版下载成功')
            } catch (error) {
                throw error
            } finally {
                sipnner.stop(true)
            }
        } else {
            const sipnner = spinnerStart('正在更新模版...')
            await sleep()
            try {
                await templateNpm.update()
                log.success('模版更新成功')
            } catch (error) {
                throw error
            } finally {
                sipnner.stop(true)
            }

        }
    }
    async prepare() {
        // 判断项目模版
        const template = await getProjectTemplate()
        if(!template || template.length === 0) {
            throw new Error('项目模版不存在！')
        }
        this.template = template
        const localPath = process.cwd() // 命令执行文件夹目录
        // 判断当前目录是否为空
        if(!this.ifDirIsEmpty(localPath)) {
            let ifContinue = false
            if(!this.force) {
                // 为空时，询问是否继续创建
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空, 是否继续创建项目？'
                })).ifContinue
                if(!ifContinue) {
                    return
                }
            }
 
            // 是否启动强制更新
            if(ifContinue || this.force) {
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？'
                })
                if(confirmDelete) {
                    // 清空当前目录
                    fse.emptyDirSync(localPath)
                }
            }
        }
        return await this.getProjectInfo()
    }
    ifDirIsEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        fileList = fileList.filter(file => (
            !file.startsWith('.') && !file.includes('node_modules')
        ))
        return !fileList || fileList.length <= 0
    }
    async getProjectInfo() {
        let projectInfo = {}
        // 选择创建类型
        const {type} = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择项目初始化类型',
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
        // 获取项目基本信息
        if(type === TYPE_PROJECT) {
            const project = await inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function(v) {
                    const done = this.async()
                    setTimeout(() => {
                        if(!/^[a-zA-Z]+([-][a-zA-Z]+[a-zA-Z0-9]*|[_][a-zA-Z]+[a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
                            done('请输入合法项目名称')
                            return
                        }
                        done(null, true)
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
                    const done = this.async()
                    setTimeout(() => {
                        if(!(!!semver.valid(v))) {
                            done('请输入合法版本号')
                            return
                        }
                        done(null, true)
                    }, 0);
                },
                filter: (v) => {
                    if(!!semver.valid(v)) {
                        return semver.valid(v)
                    } else {
                        return v
                    }
                }
            }, {
                type: 'list',
                name: 'projectTemplate',
                message: '请选择项目模版',
                choices: this.createTemplateChoice()
            }])
            projectInfo = {
                type,
                ...project
            }
        } else if (type === TYPE_PROJECT) {

        }
        return projectInfo
    }
    createTemplateChoice() {
        return this.template.map(item => ({
            value: item.npmName,
            name: item.name
        }))
    }
}
function init(...argv) {
    // console.log('init', projectName, options.force, process.env.CLI_TARGET_PATH)
    return new InitCommand(...argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
