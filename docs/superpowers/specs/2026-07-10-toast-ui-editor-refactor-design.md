# 设计：使用 TOAST UI Editor 重构 Markdown 编辑器

**日期：** 2026-07-10
**状态：** 已确认

## 目标

用 `@toast-ui/react-editor` 替换当前的 Milkdown Crepe 编辑器，采用 Markdown + 预览分屏模式，保留 Mermaid 渲染和深色/浅色主题切换。同时清理未使用的代码和死代码，移除无用依赖。

## 背景与现状

当前项目 `md-editor-extension` 是一个 Chrome MV3 扩展，核心编辑器使用 Milkdown Crepe（WYSIWYG 模式）。编辑器实现集中在 `src/newtab/components/EditorPanel.tsx`，通过 `new Crepe()` 创建实例，用 `editorKey` remount 机制加载新文档。

项目中存在以下未使用代码：
- `src/newtab/plugins/highlight.ts` — Milkdown remark 插件，定义但从未导入
- `src/newtab/hooks/useMarkdown.ts` — 自定义 hook，定义但从未使用
- `globals.css` 中的 `#print-content` 打印样式 — 引用了不存在的 DOM 元素
- `globals.css` 中的 Milkdown/CodeMirror CSS 覆写 — 重构后不再需要

## 架构概览

### 核心变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `EditorPanel.tsx` | 重写 | 从 Milkdown Crepe 改为 TOAST UI Editor |
| `App.tsx` | 调整 | 向 EditorPanel 传递 `dark` prop 用于主题切换 |
| `Toc.tsx` | 调整 | 查询容器从 `.milkdown` 改为 `.toastui-editor-contents` |
| `globals.css` | 清理 | 删除所有 Milkdown/CodeMirror CSS 覆写和 print 死代码 |
| `plugins/highlight.ts` | 删除 | 未使用的 Milkdown 插件 |
| `hooks/useMarkdown.ts` | 删除 | 未使用的 hook |
| `README.md` | 更新 | 技术栈描述更新 |
| `package.json` | 更新 | 移除 `@milkdown/crepe`，新增 `@toast-ui/editor` 和 `@toast-ui/react-editor` |

### 不变的部分

Toolbar、Sidebar、SaveDialog、RenameDialog、Toast 组件不动；doc-store、cache、useCurrentTabUrl、service-worker、constants、utils 等全部不动；App.tsx 的 remount 机制（`editorKey`）保持不变。

## 详细设计

### 1. EditorPanel.tsx 重写

**Props 接口（保持兼容，新增 `dark`）：**

```ts
interface EditorPanelProps {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  getMarkdownRef?: React.MutableRefObject<(() => string) | null>;
  dark?: boolean;
}
```

**实现要点：**

- 使用 `@toast-ui/react-editor` 的 `<Editor>` 组件
- 用 `useRef` 持有 wrapper ref，通过 `getInstance()` 访问底层 API
- 初始化配置：
  - `previewStyle="vertical"` — Markdown + 预览分屏
  - `initialEditType="markdown"` — 默认 Markdown 编辑模式
  - `height="100%"` — 撑满容器
  - `initialValue={defaultValue}` — 初始内容
  - `useCommandShortcut={true}` — 启用快捷键
  - `hideModeSwitch={false}` — 允许用户切换 Markdown/WYSIWYG 模式
- 容器 `<div id="toast-editor">` 替代原 `#milkdown-editor`

**事件绑定（onLoad 回调中）：**

`@toast-ui/react-editor` 不提供 `onChange` prop。在 `onLoad` 回调中：
1. 设置 `getMarkdownRef.current = () => getInstance().getMarkdown()`
2. 注册 `getInstance().on('change', () => onChange?.(getInstance().getMarkdown()))`

`onLoad` 在编辑器实例就绪后触发，是绑定事件和设置 ref 的安全时机。

**Mermaid 集成（customHTMLRenderer）：**

通过 `customHTMLRenderer.codeBlock` 检测 `info` 为 `mermaid` 的 code block：

```ts
customHTMLRenderer: {
  codeBlock(node) {
    if (node.info === 'mermaid' && node.literal) {
      // 同步生成 SVG（mermaid.render 异步，先返回占位 div，
      // 渲染完成后替换 innerHTML）
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      mermaid.render(`${id}-svg`, node.literal)
        .then(({ svg }) => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = svg;
        })
        .catch((err) => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = `<span style="color:#DC362E">Mermaid error: ${err.message}</span>`;
        });
      return [
        { type: 'openTag', tagName: 'div', classNames: ['mermaid-container'], attributes: { id } },
        { type: 'closeTag', tagName: 'div' },
      ];
    }
    // 非 mermaid 的 code block 使用默认渲染
    return null; // 返回 null/null 使用 origin()
  }
}
```

**注意：** `customHTMLRenderer` 中的函数返回 `null` 时使用默认渲染器。由于 context 提供 `origin()`，对于非 mermaid 代码块，调用 `origin()` 获取默认 token。具体实现时根据 API 确认 — 若 codeBlock renderer 不接受 `origin`，则对非 mermaid 块返回默认 token 数组（`[{openTag pre}, {openTag code}, {text}, {closeTag code}, {closeTag pre}]`）。

**主题切换（useEffect 监听 dark prop）：**

```ts
useEffect(() => {
  const instance = editorRef.current?.getInstance();
  if (instance) {
    instance.setTheme(dark ? 'dark' : 'light');
  }
}, [dark]);
```

主题切换通过 `setTheme()` API 动态切换，不需要 remount 编辑器。`onLoad` 时也需设置初始主题。

**mermaid 初始化：** 在模块顶层调用 `mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })`，与当前一致。

### 2. App.tsx 调整

仅一处变更：向 `<EditorPanel>` 传递 `dark` prop：

```tsx
<EditorPanel
  key={editorKey.current}
  defaultValue={displayContent}
  onChange={setMarkdown}
  getMarkdownRef={getMarkdownRef}
  dark={dark}  // 新增
/>
```

其余逻辑（remount、save、export、TOC 等）全部不变。

### 3. Toc.tsx 调整

两处查询选择器变更：

1. **标题扫描的 MutationObserver** — 容器不变（`containerRef`），标题选择器 `h1, h2, h3, h4` 不变。因为容器是包裹 EditorPanel 的外层 div，TOAST UI 的预览内容在其内部，`querySelectorAll` 仍然有效。

2. **滚动监听元素** — 从 `.milkdown` 改为 `.toastui-editor-contents`：

```ts
// 原: const scrollEl = container.querySelector(".milkdown") || container;
const scrollEl = container.querySelector(".toastui-editor-contents") || container;
```

**注意：** TOAST UI 的预览区是 `.toastui-editor-contents`，滚动可能发生在 `.toastui-editor` 容器上而非 `.toastui-editor-contents`。实现时需确认实际的滚动元素（可能需要改为 `.toastui-editor` 或编辑器预览区的滚动父级）。

### 4. globals.css 清理

**删除以下所有内容：**

- `#milkdown-editor .ProseMirror` 高度和 padding 样式（原行 63-71）
- 全部 CodeMirror One Dark 样式（原行 73-115）— `!important` 覆写不再需要
- `.milkdown .highlight-mark` 样式（原行 117-129）
- `.milkdown-code-block .language-button` 工具按钮样式（原行 131-137）
- `@media print` 中的 `#print-content` 死代码（原行 139-159）
- `html.dark .milkdown` 变量覆写（原行 161-181）

**保留：**

- `@tailwind` directives
- `:root` 和 `html.dark` 的 shadcn CSS 变量
- `* { border-border }` 和 body 字体样式

**新增：**

- `#toast-editor` 撑满容器高度的样式：
  ```css
  #toast-editor {
    height: 100%;
  }
  #toast-editor .toastui-editor {
    height: 100%;
  }
  ```
- TOAST UI 深色主题下的微调（如有必要，预览区字体颜色等）

### 5. 依赖变更

**移除：**
- `@milkdown/crepe` — Milkdown 编辑器核心（含其传递依赖的 CodeMirror）

**新增：**
- `@toast-ui/editor` — TOAST UI Editor 核心
- `@toast-ui/react-editor` — React 封装

**保留不变：**
- `mermaid` — Mermaid 图表渲染
- `marked` — HTML 导出
- `clsx`, `tailwind-merge`, `lucide-react` — UI 工具
- 所有 devDependencies 不变

**注意：** `@codemirror/theme-one-dark` 不在 package.json 中（是 Milkdown 的传递依赖），移除 Milkdown 后自动消失。代码语法高亮由 TOAST UI Editor 内置处理，本次不引入 `@toast-ui/editor-plugin-code-syntax-highlight`，保持精简。

### 6. 文件删除

- `src/newtab/plugins/highlight.ts` — Milkdown remark 插件，从未导入使用
- `src/newtab/hooks/useMarkdown.ts` — 自定义 hook，从未使用

删除后检查 `src/newtab/plugins/` 目录是否为空，若空则一并删除目录。

### 7. README.md 更新

**技术栈部分：**
- "Milkdown Crepe" → "TOAST UI Editor"
- 删除 "CodeMirror 6 (One Dark)" 条目
- 功能描述中 "WYSIWYG 编辑" → "Markdown + 预览分屏编辑"

## 风险与注意事项

1. **Mermaid 渲染时序：** `customHTMLRenderer` 是同步返回 token 的，但 `mermaid.render()` 是异步的。设计采用"返回占位 div + 异步替换 innerHTML"的方式。需要确认 TOAST UI 在重新渲染预览时不会清空已渲染的 SVG（预览区 DOM 更新时机）。若预览每次内容变化都重新渲染，mermaid 占位 div 的 id 需要稳定，否则异步回调找不到元素。

2. **TOC 滚动元素：** TOAST UI 的 DOM 结构与 Milkdown 不同，需在实现时确认实际的滚动元素。预览区可能是 `.toastui-editor-contents`，但滚动容器可能是 `.toastui-editor` 或其内部 `.toastui-editor-md-preview`。

3. **`initialValue` 只在首次挂载生效：** TOAST UI Editor 的 `initialValue` 类似 Milkdown 的 `defaultValue`，只在组件挂载时生效。因此保留 App.tsx 的 `editorKey` remount 机制是正确的选择。

4. **主题切换的 CSS 引入：** TOAST UI 的深色主题需要引入额外的 CSS 文件 `@toast-ui/editor/dist/toastui-editor-dark.css`，或通过 `setTheme('dark')` 动态切换（该方法会自动添加/移除 dark class）。需确认 `@toast-ui/react-editor` 的 `setTheme` 是否需要额外 CSS 导入。

## 测试验证

1. 编辑器正常显示，Markdown 源码 + 预览分屏
2. 输入内容时 `onChange` 正确触发，`getMarkdown()` 返回正确内容
3. Mermaid 代码块在预览区渲染为图表
4. 深色/浅色主题切换正常，无需 remount
5. 从侧边栏加载文档时编辑器内容更新（remount 机制）
6. TOC 正确扫描标题并高亮当前章节
7. 导出 MD 和 HTML 功能正常
8. `npm run build` 构建成功，无 TypeScript 错误
9. 加载 `dist/` 到 Chrome，功能正常
