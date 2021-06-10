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

# 最低Nodejs版本

脚手架最低支持的node版本为`v12.0.0`,如果低于这个版本，将会报错

这里处理判断版本采用[semver](https://www.npmjs.com/package/semver)

# 检查root账号

如果用户使用 root 账号来创建项目，会导致项目开发遇到问题，那么在用户使用root账户创建项目时，要对root账号进行降级，以满足创建的项目可以被修改

在mac环境下，使用`process.geteuid()`,普通用户的`uid`是501，root用户为0

可以使用[root-check](https://www.npmjs.com/package/root-check)

# 获取用户主目录

获取用户主目录的主要原因是，后期会对项目和项目模版做缓存，缓存的地址为用户主目录

可以使用Node.js原生方法`os.homedir()`

# 获取环境变量

会讲一部分信息储存到环境变量中，读取环境变量，使用[dotenv](https://www.npmjs.com/package/dotenv)来获取

# 版本提示

在执行脚手架业务逻辑之前，需要对脚手架的版本进行判断，如果有新版本发布，那么需要提示用户更新脚手架版本

具体流程
* 获取package
* 通过npm api 获取package信息
* 借助semver，将package的version 与npm最新版本比较
* 提示或继续执行后续流程

# 脚手架命令
脚手架命令部分，使用`commander`这个包来开发

除了`commander`提供的`-V`输出版本号、`-h`输出帮助信息外，我们自定义了

* -d debug选项，用于debug，这里debug不会有实质的操作，只是用于打印信息用

对于配有配备到的命令，我们采用输出帮助信息的方式做一个提示