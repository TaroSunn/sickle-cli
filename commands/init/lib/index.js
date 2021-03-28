'use strict';

const inquirer = require('inquirer')
const fse = require('fs-extra')
const fs = require('fs')
const path = require('path')
const semver = require('semver')
const userHome = require('user-home')
const glob = require('glob')
const ejs = require('ejs')
const {spinnerStart, sleep, execAsync} = require('@sickle/cli-utils')
const Command = require('@sickle/cli-command')
const Package = require('@sickle/cli-package')

const log = require('@sickle/cli-log')
const getProjectTemplate = require('./getProjectTemplate')
const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'
const WHITE_COMMAND = ['npm', 'cnpm', 'yarn']

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
                await this.installTemplate()
            }
        } catch (error) {
            log.error(error.message)
        }
    }

    async installTemplate() {
        if(this.templateInfo) {
            if(!this.templateInfo.type) {
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL
            }
            if(this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                // 标准模版
                await this.installNormalTemplate()
            } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                // 自定义模版
                await this.installCustomTemplate()
            } else {
                throw new Error('项目模版类型无法识别')
            }
        } else {
            throw new Error('项目模版信息不存在！')
        }
    }

    checkCommand(cmd) {
        if(WHITE_COMMAND.includes(cmd)) {
            return cmd
        }
        return null
    }

    async execCommand(command, errMsg) {
        let ret
        if(command) {
            const cmdArray = command.split(' ')
            const cmd = this.checkCommand(cmdArray[0])
            if(!cmd) {
                throw new Error('命令不存在！命令：' + command)
            }
            const args = cmdArray.slice(1)
            ret = await execAsync(cmd, args, {
                stdio: 'inherit',
                cwd: process.cwd()
            })
        }
        if(ret !== 0) {
            throw new Error(errMsg ,'项目依赖安装失败')
        }
    }

    ejsRender(options) {
        const dir = process.cwd()
        return new Promise((resolve, reject) => {
            glob('**', {
                cwd: dir,
                ignore: options.ignore || '',
                nodir: true
            }, (err, files) => {
                if(err) {
                    reject(err)
                }
                Promise.all(files.map(file => {
                    const filePath = path.join(dir, file)
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, this.projectInfo, {}, (err, result) => {
                            if(err) {
                                reject1(err)
                            } else {
                                fse.writeFileSync(filePath, result)
                                resolve1(result)
                            }
                        })
                    })                    
                })).then(() => {
                    resolve()
                }).catch(err => {
                    reject(err)
                })
            })
        })    
    }

    async installNormalTemplate() {
        let spinner = spinnerStart('正在安装模版...')
        await sleep()
        try {
            // 获取模版代码目录
            const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template')
            // 获取当前目录
            const targetPath = process.cwd()
            fse.ensureDirSync(templatePath)
            fse.ensureDirSync(targetPath)
            // 拷贝模版代码至当前目录
            fse.copySync(templatePath, targetPath)
        } catch (error) {
            throw error
        } finally {
            spinner.stop(true)
            log.success('模版安装成功')
        }
        const ignore = ['node_modules/**', 'public/**']
        await this.ejsRender({ignore})
        const {installCommand, startCommand} = this.templateInfo
        // 依赖安装
        await this.execCommand(installCommand, '项目依赖安装失败')
        // 项目启动
        await this.execCommand(startCommand, '项目启动失败')     
    }

    async installCustomTemplate() {
        console.log('custom')
    }

    async downloadTemplate() {
        const {projectTemplate} = this.projectInfo
        const templateInfo = this.template.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome, '.sickle-cli', 'template')
        const storePath = path.resolve(userHome, '.sickle-cli', 'template', 'node_modules')
        const {npmName, version} = templateInfo
        this.templateInfo = templateInfo
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
            } catch (error) {
                throw error
            } finally {
                sipnner.stop(true)
                if(await templateNpm.exists()) {
                    log.success('模版下载成功')
                    this.templateNpm = templateNpm
                }
            }
        } else {
            const sipnner = spinnerStart('正在更新模版...')
            await sleep()
            try {
                await templateNpm.update()
            } catch (error) {
                throw error
            } finally {
                sipnner.stop(true)
                if(await templateNpm.exists()) {
                    log.success('模版更新成功')
                    this.templateNpm = templateNpm
                }
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
                } else {
                    return
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
        function isValidName(v) {
            return /^[a-zA-Z]+([-][a-zA-Z]+[a-zA-Z0-9]*|[_][a-zA-Z]+[a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
        }
        let projectInfo = {}
        let isProjectNameVaild = false
        if(isValidName(this.projectName)) {
            isProjectNameVaild = true
            projectInfo.projectName = this.projectName
        }
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
            const projectNamePrompt = {
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function(v) {
                    const done = this.async()
                    setTimeout(() => {
                        if(!isValidName(v)) {
                            done('请输入合法项目名称')
                            return
                        }
                        done(null, true)
                    }, 0);
                },
                filter: (v) => {
                    return v
                }
            }
            let projectPrompt = []
            if(!isProjectNameVaild) {
                projectPrompt.push(projectNamePrompt)
            }
            projectPrompt.push(
            {
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
            })
            const project = await inquirer.prompt(projectPrompt)
            projectInfo = {
                ...projectInfo,
                type,
                ...project
            }
        } else if (type === TYPE_PROJECT) {

        }
        if(projectInfo.projectName) {
            projectInfo.name = projectInfo.projectName
            projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
        }
        if(projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion
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
