# sickle-cli

# workspace

根package.json 配置
`"private": true,`

因根目录不会提交到 npm 中

``` json
"workspaces": [
    "packages/*" // 
],
```

匹配的时根目录下的packages下的所有文件

例子 如果 packages 下有 a 和 b 两个包

那么以上写法 会自动 在workspaces 中 引入这两个包

那么后面拆包后 workspaces 会做出调整

``` json
"workspaces": [
    "cli/*",
    "commands/*",
    "models/*",
    "utils/*"
],
```

查看workspaces 信息
```
yarn workspaces info
```

安装
`yarn workspace @sickle/cli add axios`

卸载
`yarn workspace @sickle/cli remove axios`

lerna.json 配置

```json
"useWorkspaces": true,
```

如果需要在packages 里的安装具体模块

发布

每个package.json 都需要添加
```
"publishConfig": {
    "access": "public"
}
```
# 项目安装

`yarn install`
