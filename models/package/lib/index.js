'use strict';

const path = require('path')
const os = require('os')
const npminstall = require('npminstall')
const pkgDir = require('pkg-dir').sync
const pathExists = require('path-exists').sync
const {getDefaultRegistry, getNpmLatestVersion} = require('@sickle/cli-get-npm-info')
const {isObject} = require('@sickle/cli-utils')
const formatPath = require('@sickle/cli-formatPath')
class Package {
    constructor(options) {
        if(!options) {
            throw new Error('Package类的options参数不能为空！')
        }
        if(!isObject(options)) {
            throw new Error('Package类的options参数必须为对象！')
        }
        this.targetPath = options.targetPath
        this.storePath = options.storePath
        this.packageName = options.packageName
        this.packageVersion = options.packageVersion
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    async prepare() {
        if(this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
    }

    get cacheFilePath() {
        return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    async exists() {
        if(this.storePath) {
            await this.prepare()
            return pathExists(this.cacheFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }

    async install() {
        await this.prepare()
        return npminstall({
            root: this.targetPath,
            storeDir: this.storePath,
            registry: getDefaultRegistry(),
            pkgs: [{
                name: this.packageName,
                version: this.packageVersion
            }]
        })
    }

    update() {

    }

    getRootFilePath() {
        const dir = pkgDir(this.targetPath)
        if(dir) {
            const pkgFile = require(path.resolve(dir, 'package.json'))
            if(pkgFile && (pkgFile.main)) {
                return formatPath(path.resolve(dir, pkgFile.main))
            }
        }
        return null
    }
}

module.exports = Package;
