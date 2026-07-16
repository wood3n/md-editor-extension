/** Preview theme definitions */
export interface PreviewTheme {
  id: string;
  name: string;
  className: string;
}

export const PREVIEW_THEMES: PreviewTheme[] = [
  { id: "github-light", name: "github-light", className: "md-theme-github-light" },
  { id: "github-dark", name: "github-dark", className: "md-theme-github-dark" },
  { id: "one-dark", name: "one-dark", className: "md-theme-one-dark" },
  { id: "tailwind", name: "tailwind", className: "md-theme-tailwind" },
  { id: "tailwind-dark", name: "tailwind-dark", className: "md-theme-tailwind-dark" },
];

export const DEFAULT_PREVIEW_THEME = "github-light";

/** Shiki code highlighting theme definitions */
export interface CodeTheme {
  id: string;
  name: string;
}

export const CODE_THEMES: CodeTheme[] = [
  { id: "github-light", name: "github-light" },
  { id: "github-dark", name: "github-dark" },
  { id: "one-dark-pro", name: "one-dark-pro" },
  { id: "dracula", name: "dracula" },
  { id: "nord", name: "nord" },
  { id: "vitesse-dark", name: "vitesse-dark" },
  { id: "vitesse-light", name: "vitesse-light" },
  { id: "material-theme-darker", name: "material-theme-darker" },
  { id: "solarized-dark", name: "solarized-dark" },
  { id: "solarized-light", name: "solarized-light" },
  { id: "ayu-dark", name: "ayu-dark" },
  { id: "min-dark", name: "min-dark" },
];

export const DEFAULT_CODE_THEME = "github-light";

/** CodeMirror editor theme definitions */
export interface EditorTheme {
  id: string;
  name: string;
}

export const EDITOR_THEMES: EditorTheme[] = [
  { id: "light", name: "light" },
  { id: "github-light", name: "github-light" },
  { id: "github-dark", name: "github-dark" },
  { id: "vscode-dark", name: "vscode-dark" },
  { id: "one-dark", name: "one-dark" },
  { id: "monokai", name: "monokai" },
  { id: "dracula", name: "dracula" },
  { id: "nord", name: "nord" },
  { id: "sublime", name: "sublime" },
];

export const DEFAULT_EDITOR_THEME = "light";

/** Unified theme preset: one-click apply to all areas */
export interface ThemePreset {
  id: string;
  name: string;
  dark: boolean;
  previewTheme: string;
  codeTheme: string;
  editorTheme: string;
  /** Toolbar / sidebar background color */
  chromeBg: string;
  chromeBorder: string;
  chromeHover: string;
  chromeActive: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "github-light", name: "GitHub Light", dark: false, previewTheme: "github-light", codeTheme: "github-light", editorTheme: "github-light", chromeBg: "#ffffff", chromeBorder: "#d0d7de", chromeHover: "#f3f4f6", chromeActive: "#e5e7eb" },
  { id: "github-dark", name: "GitHub Dark", dark: true, previewTheme: "github-dark", codeTheme: "github-dark", editorTheme: "github-dark", chromeBg: "#0d1117", chromeBorder: "#30363d", chromeHover: "#161b22", chromeActive: "#1c2128" },
  { id: "one-dark", name: "One Dark", dark: true, previewTheme: "one-dark", codeTheme: "one-dark-pro", editorTheme: "one-dark", chromeBg: "#21252b", chromeBorder: "#3e4452", chromeHover: "#2c313a", chromeActive: "#353b45" },
  { id: "tailwind", name: "Tailwind", dark: false, previewTheme: "tailwind", codeTheme: "github-light", editorTheme: "light", chromeBg: "#ffffff", chromeBorder: "#e2e8f0", chromeHover: "#f1f5f9", chromeActive: "#e2e8f0" },
  { id: "tailwind-dark", name: "Tailwind Dark", dark: true, previewTheme: "tailwind-dark", codeTheme: "houston", editorTheme: "github-dark", chromeBg: "#0f172a", chromeBorder: "#334155", chromeHover: "#1e293b", chromeActive: "#334155" },
  { id: "monokai", name: "Monokai", dark: true, previewTheme: "one-dark", codeTheme: "monokai", editorTheme: "monokai", chromeBg: "#272822", chromeBorder: "#3e3d32", chromeHover: "#3e3d32", chromeActive: "#49483e" },
  { id: "dracula", name: "Dracula", dark: true, previewTheme: "github-dark", codeTheme: "dracula", editorTheme: "dracula", chromeBg: "#282a36", chromeBorder: "#44475a", chromeHover: "#31344b", chromeActive: "#44475a" },
  { id: "nord", name: "Nord", dark: true, previewTheme: "one-dark", codeTheme: "nord", editorTheme: "nord", chromeBg: "#2e3440", chromeBorder: "#4c566a", chromeHover: "#3b4252", chromeActive: "#434c5e" },
  { id: "solarized-light", name: "Solarized Light", dark: false, previewTheme: "github-light", codeTheme: "solarized-light", editorTheme: "light", chromeBg: "#fdf6e3", chromeBorder: "#eee8d5", chromeHover: "#f5ecce", chromeActive: "#eee8d5" },
  { id: "solarized-dark", name: "Solarized Dark", dark: true, previewTheme: "github-dark", codeTheme: "solarized-dark", editorTheme: "github-dark", chromeBg: "#002b36", chromeBorder: "#073642", chromeHover: "#073642", chromeActive: "#0a4b5c" },
  { id: "vscode-dark", name: "VS Code Dark", dark: true, previewTheme: "github-dark", codeTheme: "github-dark", editorTheme: "vscode-dark", chromeBg: "#1e1e1e", chromeBorder: "#333333", chromeHover: "#2a2a2a", chromeActive: "#333333" },
  { id: "sublime", name: "Sublime", dark: true, previewTheme: "one-dark", codeTheme: "github-dark", editorTheme: "sublime", chromeBg: "#272822", chromeBorder: "#3e3d32", chromeHover: "#3e3d32", chromeActive: "#49483e" },
];
