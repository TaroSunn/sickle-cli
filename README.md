# learn 用处
关于`learn`，只是使用`learn` 发布项目、创建包的命令

# monorepo

关于 `monorepo` 有三个解决方案
* `npm link` or `file`
* `yarn workspace`
* `npm workspace`

第一个方案，会导致项目整体会特别大，每一个项目的`package.json`都会下载一遍

不同项目之间的引用 通过 `npm link` 或者 `file` 的方式，这种方式只能手动操作

第二个方案

在实践过程中 `yarn` 对于 `package.json` 中的 `name`属性的值要求特别严格， 对于后期模版项目，`name`通过 `ejs`动态加载，处理比较麻烦

[第一版](https://github.com/TaroSunn/sickle-cli/tree/main)使用`yarn workspace` 方案

所以此次重构 使用 npm workspace，踩一下 npm workspace 的坑

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
