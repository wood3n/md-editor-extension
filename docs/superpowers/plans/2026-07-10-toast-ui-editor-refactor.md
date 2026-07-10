# TOAST UI Editor Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Milkdown Crepe with `@toast-ui/react-editor` using Markdown + preview split mode, preserve Mermaid rendering and dark/light theme, and remove all unused code and dependencies.

**Architecture:** Rewrite `EditorPanel.tsx` to use TOAST UI Editor's React wrapper. Mermaid diagrams render via `customHTMLRenderer.codeBlock`. Theme switching uses `setTheme()` API. App.tsx's existing `editorKey` remount mechanism is preserved for loading documents. Toc.tsx query selectors are updated for TOAST UI's DOM structure. All Milkdown/CodeMirror CSS overrides and dead code are cleaned from `globals.css`. Two unused files (`highlight.ts`, `useMarkdown.ts`) are deleted.

**Tech Stack:** `@toast-ui/editor`, `@toast-ui/react-editor`, React 18, TypeScript, Vite, Tailwind CSS, Mermaid

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Remove `@milkdown/crepe`, add `@toast-ui/editor` + `@toast-ui/react-editor` |
| `src/newtab/components/EditorPanel.tsx` | Rewrite | TOAST UI Editor wrapper with Mermaid + theme support |
| `src/newtab/App.tsx` | Modify | Pass `dark` prop to EditorPanel |
| `src/newtab/components/Toc.tsx` | Modify | Update query selectors for TOAST UI DOM |
| `src/styles/globals.css` | Modify | Remove Milkdown/CodeMirror CSS, add TOAST UI height styles |
| `src/newtab/plugins/highlight.ts` | Delete | Unused Milkdown remark plugin |
| `src/newtab/hooks/useMarkdown.ts` | Delete | Unused hook |
| `README.md` | Modify | Update tech stack and feature descriptions |

---

### Task 1: Install dependencies and remove Milkdown

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove @milkdown/crepe and install TOAST UI packages**

Run:
```bash
cd /Users/a1-6/code/md-editor-extension
npm uninstall @milkdown/crepe
npm install @toast-ui/editor @toast-ui/react-editor
```

- [ ] **Step 2: Verify package.json dependencies are correct**

Read `package.json` and confirm:
- `@milkdown/crepe` is gone from `dependencies`
- `@toast-ui/editor` and `@toast-ui/react-editor` are in `dependencies`
- `mermaid`, `marked`, `clsx`, `tailwind-merge`, `lucide-react`, `react`, `react-dom` are still present

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: replace @milkdown/crepe with @toast-ui/editor and @toast-ui/react-editor"
```

---

### Task 2: Rewrite EditorPanel.tsx

**Files:**
- Rewrite: `src/newtab/components/EditorPanel.tsx`

- [ ] **Step 1: Write the new EditorPanel.tsx**

Replace the entire contents of `src/newtab/components/EditorPanel.tsx` with:

```tsx
import { useEffect, useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import type { Editor as EditorType } from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/toastui-editor-dark.css";
import mermaid from "mermaid";

interface EditorPanelProps {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  getMarkdownRef?: React.MutableRefObject<(() => string) | null>;
  dark?: boolean;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

export function EditorPanel({ defaultValue, onChange, getMarkdownRef, dark }: EditorPanelProps) {
  const editorRef = useRef<EditorType>(null);

  // Set up getMarkdownRef and onChange listener on mount
  const handleLoad = () => {
    const instance = editorRef.current;
    if (!instance) return;

    if (getMarkdownRef) {
      getMarkdownRef.current = () => instance.getMarkdown();
    }

    if (onChange) {
      instance.on("change", () => {
        onChange(instance.getMarkdown());
      });
    }

    // Apply initial theme
    instance.setTheme(dark ? "dark" : "light");
  };

  // Theme switching without remount
  useEffect(() => {
    const instance = editorRef.current;
    if (instance) {
      instance.setTheme(dark ? "dark" : "light");
    }
  }, [dark]);

  // Clean up getMarkdownRef on unmount
  useEffect(() => {
    return () => {
      if (getMarkdownRef) {
        getMarkdownRef.current = null;
      }
    };
  }, [getMarkdownRef]);

  return (
    <div id="toast-editor" className="h-full overflow-hidden">
      <Editor
        ref={editorRef}
        initialValue={defaultValue}
        previewStyle="vertical"
        initialEditType="markdown"
        height="100%"
        useCommandShortcut={true}
        hideModeSwitch={false}
        onLoad={handleLoad}
        customHTMLRenderer={{
          codeBlock(node) {
            if (node.info === "mermaid" && node.literal) {
              const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
              mermaid
                .render(`${id}-svg`, node.literal)
                .then(({ svg }) => {
                  const el = document.getElementById(id);
                  if (el) el.innerHTML = svg;
                })
                .catch((err) => {
                  const el = document.getElementById(id);
                  if (el)
                    el.innerHTML = `<span style="color:#DC362E">Mermaid error: ${err.message}</span>`;
                });
              return [
                {
                  type: "openTag",
                  tagName: "div",
                  classNames: ["mermaid-container"],
                  attributes: { id },
                },
                { type: "closeTag", tagName: "div" },
              ];
            }
            // Non-mermaid: use default rendering
            return [
              { type: "openTag", tagName: "pre", outerNewLine: true },
              { type: "openTag", tagName: "code", attributes: node.info ? { class: `language-${node.info}` } : {} },
              { type: "text", content: node.literal || "" },
              { type: "closeTag", tagName: "code" },
              { type: "closeTag", tagName: "pre", outerNewLine: true },
            ];
          },
        }}
      />
    </div>
  );
}
```

**Key notes about this implementation:**
- `@toast-ui/editor/dist/toastui-editor.css` is the base stylesheet
- `@toast-ui/editor/dist/toastui-editor-dark.css` provides the dark theme CSS that `setTheme('dark')` activates
- The `ref` is typed as `EditorType` (the underlying `@toast-ui/editor` `Editor` class) because `@toast-ui/react-editor`'s `Editor` component forwards the ref to the wrapper, and we call `getInstance()` implicitly through the ref (the React wrapper's ref gives direct access to the editor instance methods)
- `onLoad` fires after the editor is ready — safe to register events and set theme
- `customHTMLRenderer.codeBlock` returns token arrays; for mermaid we return a placeholder div and async-replace its innerHTML
- For non-mermaid code blocks, we return the default `<pre><code>` token structure

- [ ] **Step 2: Verify the ref type works with @toast-ui/react-editor**

The `@toast-ui/react-editor` `Editor` component's `ref` points to a wrapper object with a `getInstance()` method, not the editor instance directly. We need to adjust the ref usage.

Check the actual API by reading the installed types:

Run:
```bash
cat node_modules/@toast-ui/react-editor/dist/toastui-react-editor.d.ts 2>/dev/null | head -80
```

If the ref gives a wrapper with `getInstance()`, update the code:
- Change `editorRef` type to `EditorType` wrapper from `@toast-ui/react-editor` (or use `any` and access via `getInstance()`)
- Replace all `editorRef.current` usages with `editorRef.current?.getInstance()`

The corrected pattern:

```tsx
import { useRef, useEffect } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/toastui-editor-dark.css";
import mermaid from "mermaid";

interface EditorPanelProps {
  defaultValue: string;
  onChange?: (markdown: string) => void;
  getMarkdownRef?: React.MutableRefObject<(() => string) | null>;
  dark?: boolean;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

export function EditorPanel({ defaultValue, onChange, getMarkdownRef, dark }: EditorPanelProps) {
  // The ref from @toast-ui/react-editor — use `any` because the wrapper type
  // exposes getInstance() but the exact type varies across versions.
  const editorRef = useRef<any>(null);

  const getInstance = () => editorRef.current?.getInstance?.();

  const handleLoad = () => {
    const instance = getInstance();
    if (!instance) return;

    if (getMarkdownRef) {
      getMarkdownRef.current = () => instance.getMarkdown();
    }

    if (onChange) {
      instance.on("change", () => {
        onChange(instance.getMarkdown());
      });
    }

    instance.setTheme(dark ? "dark" : "light");
  };

  useEffect(() => {
    const instance = getInstance();
    if (instance) {
      instance.setTheme(dark ? "dark" : "light");
    }
  }, [dark]);

  useEffect(() => {
    return () => {
      if (getMarkdownRef) {
        getMarkdownRef.current = null;
      }
    };
  }, [getMarkdownRef]);

  return (
    <div id="toast-editor" className="h-full overflow-hidden">
      <Editor
        ref={editorRef}
        initialValue={defaultValue}
        previewStyle="vertical"
        initialEditType="markdown"
        height="100%"
        useCommandShortcut={true}
        hideModeSwitch={false}
        onLoad={handleLoad}
        customHTMLRenderer={{
          codeBlock(node: any) {
            if (node.info === "mermaid" && node.literal) {
              const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
              mermaid
                .render(`${id}-svg`, node.literal)
                .then(({ svg }: { svg: string }) => {
                  const el = document.getElementById(id);
                  if (el) el.innerHTML = svg;
                })
                .catch((err: Error) => {
                  const el = document.getElementById(id);
                  if (el)
                    el.innerHTML = `<span style="color:#DC362E">Mermaid error: ${err.message}</span>`;
                });
              return [
                {
                  type: "openTag",
                  tagName: "div",
                  classNames: ["mermaid-container"],
                  attributes: { id },
                },
                { type: "closeTag", tagName: "div" },
              ];
            }
            return [
              { type: "openTag", tagName: "pre", outerNewLine: true },
              {
                type: "openTag",
                tagName: "code",
                attributes: node.info ? { class: `language-${node.info}` } : {},
              },
              { type: "text", content: node.literal || "" },
              { type: "closeTag", tagName: "code" },
              { type: "closeTag", tagName: "pre", outerNewLine: true },
            ];
          },
        }}
      />
    </div>
  );
}
```

Use this corrected version as the final file content. The `any` types for `editorRef` and `node` are pragmatic given the wrapper's type complexity.

- [ ] **Step 3: Commit**

```bash
git add src/newtab/components/EditorPanel.tsx
git commit -m "feat: rewrite EditorPanel with TOAST UI Editor

Replace Milkdown Crepe with @toast-ui/react-editor using Markdown +
preview split mode. Mermaid diagrams render via customHTMLRenderer.
Theme switching via setTheme() API."
```

---

### Task 3: Update App.tsx to pass dark prop

**Files:**
- Modify: `src/newtab/App.tsx:225-230`

- [ ] **Step 1: Add dark prop to EditorPanel usage**

In `src/newtab/App.tsx`, find the `<EditorPanel>` JSX block (around line 225-230) and add the `dark` prop.

Change from:
```tsx
            <EditorPanel
              key={editorKey.current}
              defaultValue={displayContent}
              onChange={setMarkdown}
              getMarkdownRef={getMarkdownRef}
            />
```

To:
```tsx
            <EditorPanel
              key={editorKey.current}
              defaultValue={displayContent}
              onChange={setMarkdown}
              getMarkdownRef={getMarkdownRef}
              dark={dark}
            />
```

- [ ] **Step 2: Commit**

```bash
git add src/newtab/App.tsx
git commit -m "feat: pass dark prop to EditorPanel for theme switching"
```

---

### Task 4: Update Toc.tsx query selectors

**Files:**
- Modify: `src/newtab/components/Toc.tsx:53`

- [ ] **Step 1: Update the scroll element selector**

In `src/newtab/components/Toc.tsx`, find line 53 which reads:

```ts
    const scrollEl = container.querySelector(".milkdown") || container;
```

Change it to:

```ts
    const scrollEl = container.querySelector(".toastui-editor") || container;
```

**Rationale:** TOAST UI Editor's root container is `.toastui-editor`. The scrollable area is this element. The heading scan (`querySelectorAll("h1, h2, h3, h4")`) still works because it scans the entire `containerRef` subtree, and TOAST UI's preview pane contains rendered headings within that subtree.

- [ ] **Step 2: Commit**

```bash
git add src/newtab/components/Toc.tsx
git commit -m "fix: update Toc scroll selector for TOAST UI Editor DOM"
```

---

### Task 5: Clean up globals.css

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Remove all Milkdown/CodeMirror CSS and dead print code, add TOAST UI styles**

Replace the entire contents of `src/styles/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  html.dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
  }
}

/* TOAST UI Editor: fill container height */
#toast-editor {
  height: 100%;
}
#toast-editor .toastui-editor {
  height: 100%;
}

/* Mermaid container in preview */
.mermaid-container {
  text-align: center;
  padding: 8px 0;
}
.mermaid-container svg {
  max-width: 100%;
}
```

**What was removed:**
- `#milkdown-editor .ProseMirror` height/padding rules
- All CodeMirror One Dark `!important` token color overrides (lines 73-115 of old file)
- `.milkdown .highlight-mark` / `mark` highlight styles
- `.milkdown-code-block .language-button` tool button visibility overrides
- `@media print` block with `#print-content` dead code
- `html.dark .milkdown` CSS variable overrides

**What was added:**
- `#toast-editor` and `.toastui-editor` height: 100% rules
- `.mermaid-container` centering and max-width for rendered SVGs

- [ ] **Step 2: Commit**

```bash
git add src/styles/globals.css
git commit -m "refactor: remove Milkdown/CodeMirror CSS overrides and dead print code

Remove all Milkdown-specific CSS (ProseMirror, CodeMirror One Dark token
colors, highlight mark, code block tools, dark theme variables) and
unused #print-content print styles. Add TOAST UI Editor height rules
and mermaid container styling."
```

---

### Task 6: Delete unused files

**Files:**
- Delete: `src/newtab/plugins/highlight.ts`
- Delete: `src/newtab/hooks/useMarkdown.ts`

- [ ] **Step 1: Delete the highlight plugin**

Run:
```bash
rm /Users/a1-6/code/md-editor-extension/src/newtab/plugins/highlight.ts
```

- [ ] **Step 2: Delete the useMarkdown hook**

Run:
```bash
rm /Users/a1-6/code/md-editor-extension/src/newtab/hooks/useMarkdown.ts
```

- [ ] **Step 3: Check if the plugins directory is now empty**

Run:
```bash
ls /Users/a1-6/code/md-editor-extension/src/newtab/plugins/ 2>/dev/null
```

If the directory is empty (no output or only `.`/`..`), remove it:
```bash
rmdir /Users/a1-6/code/md-editor-extension/src/newtab/plugins/ 2>/dev/null || true
```

- [ ] **Step 4: Check if the hooks directory still has files**

Run:
```bash
ls /Users/a1-6/code/md-editor-extension/src/newtab/hooks/
```

`useCurrentTabUrl.ts` should still exist — do NOT remove the `hooks/` directory.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove unused highlight plugin and useMarkdown hook"
```

---

### Task 7: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update feature description and tech stack**

In `README.md`, make these changes:

**Line 11** — Change the Milkdown feature description:
From:
```
- **Markdown 编辑**：基于 [Milkdown](https://milkdown.dev) Crepe 编辑器，提供所见即所得的编辑体验
```
To:
```
- **Markdown 编辑**：基于 [TOAST UI Editor](https://ui.toast.com/tui-editor) 编辑器，提供 Markdown + 预览分屏的编辑体验
```

**Line 19** — Remove the CodeMirror code highlighting feature line:
From:
```
- **代码高亮**：基于 CodeMirror + One Dark 主题
```
To: (delete this line entirely)

**Line 85** — Update editor tech stack:
From:
```
- **编辑器**：Milkdown Crepe
```
To:
```
- **编辑器**：TOAST UI Editor
```

**Line 87** — Remove the CodeMirror tech stack line:
From:
```
- **代码高亮**：CodeMirror 6（One Dark 主题）
```
To: (delete this line entirely)

**Line 99** — Update project structure comment:
From:
```
│   │   ├── EditorPanel.tsx   # Milkdown Crepe 编辑器
```
To:
```
│   │   ├── EditorPanel.tsx   # TOAST UI Editor 编辑器
```

**Lines 112-113** — Remove the plugins section from project structure:
From:
```
│   ├── plugins/       # Milkdown 插件
```
To: (delete this line entirely)

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for TOAST UI Editor refactor"
```

---

### Task 8: Build and verify

**Files:**
- None (verification only)

- [ ] **Step 1: Run TypeScript check and build**

Run:
```bash
cd /Users/a1-6/code/md-editor-extension
npm run build
```

Expected: Build succeeds with no TypeScript errors. Output in `dist/` directory.

- [ ] **Step 2: Fix any build errors**

If the build fails, common issues and fixes:

1. **Type error on `editorRef`**: If TypeScript complains about the `any` ref or the `Editor` component's ref type, adjust the ref type. Check `node_modules/@toast-ui/react-editor/dist/index.d.ts` for the correct wrapper type.

2. **CSS import path wrong**: If `@toast-ui/editor/dist/toastui-editor.css` or `toastui-editor-dark.css` can't be found, check the actual filenames:
   ```bash
   ls node_modules/@toast-ui/editor/dist/*.css
   ```

3. **`customHTMLRenderer` type error**: If TypeScript complains about the return type of `codeBlock`, cast the return value or use `as any` on the customHTMLRenderer object.

4. **`node.info` or `node.literal` type error**: The `node` parameter type may need to be explicitly typed as `any` (already done in the plan code).

After fixing, re-run `npm run build` until it passes.

- [ ] **Step 3: Verify the dist output contains the editor**

Run:
```bash
ls /Users/a1-6/code/md-editor-extension/dist/manifest.json
ls /Users/a1-6/code/md-editor-extension/dist/assets/
```

Confirm the build produced the manifest and bundled assets.

- [ ] **Step 4: Commit any build fixes (if any)**

```bash
git add -A
git commit -m "fix: resolve build errors for TOAST UI Editor integration" || echo "No fixes needed"
```

---

### Task 9: Final cleanup verification

**Files:**
- None (verification only)

- [ ] **Step 1: Verify no Milkdown references remain**

Run:
```bash
cd /Users/a1-6/code/md-editor-extension
grep -rn "milkdown\|Milkdown\|@milkdown\|@codemirror\|CodeMirror\|codemirror\|crepe\|Crepe\|ProseMirror" src/ --include="*.ts" --include="*.tsx" --include="*.css"
```

Expected: No output (no references found).

- [ ] **Step 2: Verify deleted files are gone**

Run:
```bash
test -f /Users/a1-6/code/md-editor-extension/src/newtab/plugins/highlight.ts && echo "STILL EXISTS" || echo "DELETED OK"
test -f /Users/a1-6/code/md-editor-extension/src/newtab/hooks/useMarkdown.ts && echo "STILL EXISTS" || echo "DELETED OK"
```

Expected: Both print "DELETED OK".

- [ ] **Step 3: Verify package.json has no Milkdown**

Run:
```bash
grep "milkdown" /Users/a1-6/code/md-editor-extension/package.json
```

Expected: No output.

- [ ] **Step 4: Final commit if there are any uncommitted changes**

```bash
git status
git add -A
git commit -m "chore: final cleanup verification" || echo "Nothing to commit"
```
