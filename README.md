# MD Editor - Chrome Extension

A markdown editor Chrome extension with real-time preview, Mermaid diagram support, local document management, and offline caching.

## Features

- **Markdown Editing**: Powered by [Milkdown](https://milkdown.dev) (Crepe editor) with WYSIWYG editing experience
- **Remote Markdown Loading**: Open `.md` URLs directly — the extension reads the page content and loads it into the editor
- **Smart Caching**: Two-layer cache (memory + `chrome.storage.local`) with ETag conditional requests to avoid rate limiting
- **Local Document Management**: Save edited documents locally with custom titles, browse and manage them in the sidebar
- **Mermaid Diagrams**: Render ` ```mermaid ` code blocks natively
- **Dark / Light Mode**: Persisted across sessions
- **Export**: Download as Markdown (`.md`) or HTML
- **Table of Contents**: Auto-generated TOC from document headings
- **Code Syntax Highlighting**: One Dark theme via CodeMirror
- **Keyboard Shortcut**: `⌘S` / `Ctrl+S` to save

## Usage

### Open a markdown file

1. Navigate to any `.md` URL in your browser (e.g. `https://raw.githubusercontent.com/user/repo/main/README.md`)
2. Click the MD Editor extension icon in the toolbar
3. The extension reads the page text and opens the editor with the content loaded

### Edit and save

1. Edit the content in the WYSIWYG editor
2. Click the **Save** button (or press `⌘S` / `Ctrl+S`)
3. Enter a title for the document
4. Saved documents appear in the sidebar for quick access

### Sidebar

- Click `[☰]` in the top-left to toggle the document sidebar
- Click any document to load it
- Hover over a document to reveal the delete button

### Export

- Use the **MD** button to download as `.md` file
- Use the **⋯** → **导出 HTML** option to export as HTML

## Installation

### From Chrome Web Store

> *Coming soon*

### Manual install (development)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/md-editor-extension.git
cd md-editor-extension

# Install dependencies
npm install

# Build
npm run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ directory
```

## Development

```bash
npm run dev    # Vite dev server with HMR
npm run build  # Production build
```

### Tech Stack

- **Runtime**: Chrome Extension (Manifest V3)
- **Framework**: React 18 + TypeScript
- **Editor**: Milkdown Crepe
- **Diagrams**: Mermaid
- **Syntax Highlighting**: CodeMirror 6 (One Dark theme)
- **Build**: Vite + @crxjs/vite-plugin
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Project Structure

```
src/
├── background/        # Service worker (extension icon click handler)
├── newtab/
│   ├── components/    # React components
│   │   ├── EditorPanel.tsx   # Milkdown Crepe editor
│   │   ├── Toolbar.tsx       # Top toolbar
│   │   ├── Sidebar.tsx       # Saved documents sidebar
│   │   ├── Toc.tsx           # Table of contents
│   │   ├── SaveDialog.tsx    # Save dialog with title input
│   │   └── Toast.tsx         # Toast notification
│   ├── hooks/         # React hooks
│   ├── lib/           # Utilities
│   │   ├── cache.ts          # Fetch cache (memory + storage)
│   │   ├── doc-store.ts      # Document persistence
│   │   ├── detect-markdown.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── plugins/       # Milkdown plugins
│   ├── App.tsx
│   └── main.tsx
├── styles/
│   └── globals.css
└── ...
```

## License

MIT
