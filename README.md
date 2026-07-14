# MD Editor - Chrome 扩展

一个简洁实用的 Markdown 编辑器 Chrome 扩展，支持 Markdown + 预览分屏、Mermaid 图表、远程文档加载、本地文档管理和离线缓存。

<p align="center">
  <img src="public/icons/icon128.png" alt="MD Editor Logo" width="128" height="128">
</p>

<table align="center">
  <tr>
    <td align="center"><img src="screenshots/main.png" alt="MD Editor Light" width="400"></td>
    <td align="center"><img src="screenshots/main-dark.png" alt="MD Editor Dark" width="400"></td>
  </tr>
</table>

## 安装

### Chrome Web Store

<a href="https://chromewebstore.google.com/detail/md-editor/fglfkepmpfamlbogmhhbacghhbanakfi?authuser=0&hl=zh-CN" target="_blank">
  <img src="screenshots/web-store-icon.svg" alt="Chrome Web Store 下载" width="124">
</a>

### 手动安装（开发模式）

```bash
# 克隆仓库
git clone https://github.com/wood3n/md-editor-extension.git
cd md-editor-extension

# 安装依赖
npm install

# 构建
npm run build

# 在 Chrome 中加载
# 1. 打开 chrome://extensions
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 dist/ 目录
```

## 功能特性

- **Markdown + 预览分屏**：基于 [TOAST UI Editor](https://ui.toast.com/tui-editor)，左侧编辑 Markdown 源码，右侧实时预览渲染效果
- **远程 Markdown 加载**：直接在浏览器中打开 `.md` 链接，扩展自动读取页面内容并加载到编辑器
- **智能缓存**：双层缓存（内存 + `chrome.storage.local`），支持 ETag 条件请求，避免服务器限流
- **本地文档管理**：保存编辑的文档到本地，支持自定义标题，侧边栏管理文档列表
- **Mermaid 图表**：原生渲染 `mermaid` 代码块，支持流程图、时序图、甘特图等
- **深色 / 浅色模式**：一键切换，持久化保存
- **导出**：下载为 Markdown（`.md`）或 HTML
- **目录导航**：自动从文档标题生成目录，悬浮在编辑器右上角
- **快捷键**：`⌘S` / `Ctrl+S` 快速保存

## 使用方法

### 打开 markdown 文件

1. 在浏览器中打开任意 `.md` 链接（如 `https://raw.githubusercontent.com/user/repo/main/README.md`）
2. 点击浏览器工具栏中的 MD Editor 扩展图标
3. 扩展自动读取页面文本内容并加载到编辑器

### 编辑和保存

1. 在编辑器中对内容进行编辑
2. 点击 **保存** 按钮（或按 `⌘S` / `Ctrl+S`）
3. 输入文档标题
4. 已保存的文档会出现在左侧侧边栏中，方便快速访问

### 侧边栏

- 点击左上角 `[☰]` 按钮切换侧边栏
- 点击任意文档加载到编辑器
- 鼠标悬停时显示删除按钮

### 导出

- 点击 **MD** 按钮下载 `.md` 文件
- 点击 **⋯** → **导出 HTML** 导出为 HTML

## 开发

```bash
npm run dev    # Vite 开发服务器，支持 HMR
npm run build  # 生产构建
```

### 技术栈

- **运行环境**：Chrome 扩展（Manifest V3）
- **前端框架**：React 18 + TypeScript
- **编辑器**：TOAST UI Editor
- **图表**：Mermaid
- **构建工具**：Vite + @crxjs/vite-plugin
- **样式**：Tailwind CSS
- **图标**：Lucide React

## 项目结构

```
src/
├── background/        # Service worker（扩展图标点击处理）
├── newtab/
│   ├── components/    # React 组件
│   │   ├── EditorPanel.tsx   # TOAST UI Editor 编辑器
│   │   ├── Toolbar.tsx       # 顶部工具栏
│   │   ├── Sidebar.tsx       # 已保存文档侧边栏
│   │   ├── Toc.tsx           # 目录
│   │   ├── SaveDialog.tsx    # 保存弹窗
│   │   └── Toast.tsx         # 提示消息
│   ├── hooks/         # React Hooks
│   ├── lib/           # 工具库
│   │   ├── cache.ts          # 获取缓存（内存 + storage）
│   │   ├── doc-store.ts      # 文档持久化
│   │   ├── detect-markdown.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── App.tsx
│   └── main.tsx
├── styles/
│   └── globals.css
└── ...
```

## 许可证

MIT
