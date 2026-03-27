# Pencil - 将 Markdown 转换为优雅的 HTML 博客

## 技术要点

### 技术栈

- PNPM
- JavaScript（无需 TypeScript）
- CSS

### 目录结构

- `./posts`：Markdown 文件目录
- `./public`：生成的 HTML 文件目录
- `./src`：源代码目录，以下文件必须存在，可按需增加其它文件：
  - `./src/styles.css`：样式文件
  - `./src/index.html`：首页模板
  - `./src/post.html`：文章模板

### 其它要求

- 产物是静态网站，无需服务器，可直接部署到任何静态网站托管服务

## 执行说明

- 每次修改后，请更新版本号至 `./package.json` 文件
- 每次修改后，请更新版本号并更新变更纪要以及时间至 `./CHANGELOG.md` 文件
