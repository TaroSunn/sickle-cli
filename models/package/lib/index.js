'use strict';

const path = require('path')
const pathExists = require('path-exists').sync
const npminstall = require('npminstall')
const fse = require('fs-extra')
const pkgDir = require('pkg-dir').sync
const {getDefaultRegistry, getNpmLatestVersion} = require('@sickle/cli-get-npm-info')
const {isObject } = require('@sickle/cli-utils')
const formatPath = require('@sickle/cli-format-path')


class Package {
    constructor(options) {
        if(!options) {
            throw new Error('Package类的options参数不能为空！')
        }
        if(!isObject(options)) {
            throw new Error('Package类的options参数必须为对象！')
        }
        // package 目标路径
        this.targetPath = options.targetPath
        // package 缓存路径
        this.storePath = options.storePath
        // package 名称
        this.packageName = options.packageName
        // package 版本
        this.packageVersion = options.packageVersion
        // package 缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }
    get cacheFilePath() {
        return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }
    getSpecificCacheFilePath(packageVersion) {
        return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
    }
    async prepare() {
        // 没有缓冲路径创建缓存路径
        if(this.storePath && !pathExists(this.storePath)) {
            fse.mkdirpSync(this.storePath)
        }
        if(this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
    }
    // 判断当前package 是否存在
    async exists() {
        if(this.storePath) {
            await this.prepare()
            return pathExists(this.cacheFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }
    // 安装package
    async install() {
        await this.prepare()
        return npminstall({
            root: this.targetPath,
            storeDir: this.storePath,
            registry: getDefaultRegistry(true),
            pkgs: [{
                name: this.packageName,
                version: this.packageVersion
            }]
        })
    }
    // 更新package
    async update() {
        await this.prepare()
        // 拿到最新版本号
        const latestPackageVersion = await getNpmLatestVersion(this.packageName)
        // 查询最新版本号对应路径是否存在
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
        // 如果不存在，则安装
        if(!pathExists(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storePath,
                registry: getDefaultRegistry(true),
                pkgs: [{
                    name: this.packageName,
                    version: latestPackageVersion
                }]
            })
            this.packageVersion = latestPackageVersion
        } else {
            this.packageVersion = latestPackageVersion
        }
    }
    // 获取入口文件路径
    getRootFilePath() {
        function _getRootFile(targetPath) {
            // 获取 package.json 所在目录
            const dir = pkgDir(targetPath)
            if(dir) {
                // 读取 package.json
                const pkgFile = require(path.resolve(dir, 'package.json'))
                // 获取 main/lib 路径
                if(pkgFile && pkgFile.main) {
                    // 路径兼容
                    return formatPath(path.resolve(dir, pkgFile.main))
                }
            }
            return null
        }
        if(this.storePath) {
            return _getRootFile(this.cacheFilePath)
        } else {
            return _getRootFile(this.targetPath)
        }
    }
}

module.exports = Package