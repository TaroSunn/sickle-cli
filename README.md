# learn 用处
关于`lerna`，只是使用`lerna` 发布项目、创建包的命令

# monorepo

关于 `monorepo` 有三个解决方案
* `npm link` or `file`
* `yarn workspace`
* `npm workspace`

第一个方案，会导致项目整体会特别大，每一个项目的`package.json`都会下载一遍

不同项目之间的引用 通过 `npm link` 和 `file` 的方式，这种方式只能手动操作

第二个方案

在实践过程中 `yarn` 对于 `package.json` 中的 `name`属性的值要求特别严格， 对于后期模版项目，`name`通过 `ejs`动态加载，处理比较麻烦

[第一版](https://github.com/TaroSunn/sickle-cli/tree/main)使用`yarn workspace` 方案

~~所以此次重构 使用 npm workspace，踩一下 npm workspace 的坑~~

使用这种方式无法删除`node_modules`中的依赖包

暂时采用`yarn workspace`方案 😂

# npm workspace使用
 
`npm workspace` 的使用方式与`yarn workspace`类似

根目录下 配置 `workspace` 目录

```
"workspaces": [
    "./packages/*"
],
```

安装 package

例如在 `@sickle/cli` 下安装 `axios`，则需要执行命令`npm i axios --workspace @sickle/cli`

# yarn workspace使用

配置 `package.json`
``` json
{
  "private": true,
  "workspaces": ["workspace-a", "workspace-b"]
}
```

安装依赖

```
yarn workspace package名 (add or remove) 依赖名

yarn workspace @sickle/cli add axios
```

默认 执行`add`时会去npm上下载，此时安装的不是当前本地的版本，那么可以通过加版本号来更新本地版本

安装全部依赖
```
yarn install
```

# 根目录安装pakcage
如果想要在根目录安装包，需要使用 `-W`的方式

```
yarn add package名 -W
```


# lerna 使用

常用命令
* lerna create 包名
* lerna version
* lerna publish

使用`lerna create`命令时，可以传入创建package目录地址，默认不写地址，会`lerna.json`中的`packages`中的第一个作为默认地址 

# 项目目录

项目分为四个主目录

* commands
* core
* models
* utils

## commands
将脚手架所需要的命令逻辑放到commands文件夹下
现在存在的命令有

`init`命令

## core

脚手架主要逻辑都放到了core目录下

* cli 脚手架命令执行目录
* exec 动态加载npm包

## models

把有些统一的功能封装成一个models，使用类的方式，来服用这些功能

### package


## utils
脚手架封装了一下utils方法，放到utils目录下

现在封装的方法有

* get-npm-info 获取npm包信息、版本等
* log 用于打印日志


# 脚手架执行命令过程

## 最低Nodejs版本

脚手架最低支持的node版本为`v12.0.0`,如果低于这个版本，将会报错

这里处理判断版本采用[semver](https://www.npmjs.com/package/semver)

## 检查root账号

如果用户使用 root 账号来创建项目，会导致项目开发遇到问题，那么在用户使用root账户创建项目时，要对root账号进行降级，以满足创建的项目可以被修改

在mac环境下，使用`process.geteuid()`,普通用户的`uid`是501，root用户为0

可以使用[root-check](https://www.npmjs.com/package/root-check)

## 获取用户主目录

获取用户主目录的主要原因是，后期会对项目和项目模版做缓存，缓存的地址为用户主目录

可以使用Node.js原生方法`os.homedir()`

## 获取环境变量

会讲一部分信息储存到环境变量中，读取环境变量，使用[dotenv](https://www.npmjs.com/package/dotenv)来获取

## 版本提示

在执行脚手架业务逻辑之前，需要对脚手架的版本进行判断，如果有新版本发布，那么需要提示用户更新脚手架版本

具体流程
* 获取package
* 通过npm api 获取package信息
* 借助semver，将package的version 与npm最新版本比较
* 提示或继续执行后续流程

## 注册脚手架(commander)

### 脚手架命令

脚手架命令部分，使用`commander`这个包来开发

除了`commander`提供的`-V`输出版本号、`-h`输出帮助信息外，我们自定义了

* -d debug选项，用于debug，这里debug不会有实质的操作，只是用于打印信息用

对于配有配备到的命令，我们采用输出帮助信息的方式做一个提示

#### 命令 init

`init`命令，代码统一在`commands/init`目录下

`init`命令后面可以跟一个项目名称，例如 `init testProject`

`init`命令，有一个`-f, --force`的选项，这个选项主要用处是清空当前命令执行目录文件，可能安装脚手架目录存在其他文件，此时使用`-f`，将会强制清楚当前目录

#### 选项 targetPath

`-tp, --targetPath`这个选项用于执行本地代码的路径, 用于调试
