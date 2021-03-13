# sickle-cli

# workspace

根package.json 配置
`"private": true,`

因根目录不会提交到 npm 中

``` json
"workspaces": [
    "packages/*"
],
```

lerna.json 配置

```json
"useWorkspaces": true,
```

如果需要在packages 里的安装具体模块

安装
`yarn workspace @sickle/cli add axios`

卸载
`yarn workspace @sickle/cli remove axios`

发布

每个package.json 都需要添加
```
"publishConfig": {
    "access": "public"
}
```
