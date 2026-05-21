# Learning Topic Creator

一个用于 Obsidian 的学习主题创建插件，围绕“问题驱动 + 费曼学习法”组织笔记。

## 功能

- 创建学习主题包
- 创建问题驱动笔记
- 自动生成以下目录结构：

```text
学习/分类/主题/
├── 主题 总览.md
├── 问题/
├── 原子笔记/
├── 实践记录/
├── 资源/
└── 归档/
```

## 使用方法

安装并启用插件后，打开 Obsidian 命令面板：

- `新建学习主题`
- `新建问题驱动笔记`

示例：

```text
分类: 网络
主题: HTTP
问题: 为什么登录接口返回 401？
```

插件会创建：

```text
学习/网络/HTTP/问题/为什么登录接口返回 401.md
```

## 模板

插件会优先读取 Vault 中的模板：

- `模板/主题地图模板.md`
- `模板/问题驱动费曼笔记模板.md`

如果这些模板不存在，插件会使用内置的默认模板。

## 推荐学习流程

```text
真实问题
-> 先用自己的话解释
-> 找出卡点
-> 补原子知识点
-> 再讲一遍
-> 实践验证
-> 回链到主题地图
```

## 安装

### 使用 BRAT 安装

1. 安装 Obsidian 社区插件 [BRAT](https://github.com/TfTHacker/obsidian42-brat)。
2. 在 BRAT 中选择 `Add Beta plugin`。
3. 填入本仓库地址。
4. 启用 `Learning Topic Creator`。

### 手动安装

下载以下文件：

- `main.js`
- `manifest.json`
- `styles.css`

放入你的 Vault：

```text
.obsidian/plugins/learning-topic-creator/
```

然后在 Obsidian 设置中启用插件。

## Release 文件

Obsidian/BRAT 安装至少需要仓库根目录包含：

- `main.js`
- `manifest.json`
- `styles.css`

## License

MIT
