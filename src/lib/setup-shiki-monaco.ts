import { textmateThemeToMonacoTheme } from "@shikijs/monaco"
import type { Highlighter } from "shiki"
import { EncodedTokenMetadata, INITIAL } from "shiki/textmate"

const RE_FONT_STYLE_SPLIT = /[\s,]+/
const VALID_FONT_STYLES = ["italic", "bold", "underline", "strikethrough"]
const VALID_FONT_ALIASES: Record<string, string> = {
  "line-through": "strikethrough",
}

class TokenizerState {
  _ruleStack: any
  constructor(_ruleStack: any) {
    this._ruleStack = _ruleStack
  }
  get ruleStack() {
    return this._ruleStack
  }
  clone() {
    return new TokenizerState(this._ruleStack)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equals(other: any) {
    if (
      !other ||
      !(other instanceof TokenizerState) ||
      other !== this ||
      other._ruleStack !== this._ruleStack
    ) {
      return false
    }
    return true
  }
}

function normalizeColor(
  color: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(color)) {
    color = color[0]
  }
  if (!color) {
    return undefined
  }
  color = color.charCodeAt(0) === 35 ? color.slice(1) : color
  color = color.toLowerCase()
  if (color.length === 3 || color.length === 4) {
    color = [...color].map((c) => c + c).join("")
  }
  return color
}

function normalizeFontStyleBits(fontStyle: number): string {
  if (fontStyle <= 0) {
    return ""
  }
  const styles: string[] = []
  if (fontStyle & 1) {
    styles.push("italic")
  }
  if (fontStyle & 2) {
    styles.push("bold")
  }
  if (fontStyle & 4) {
    styles.push("underline")
  }
  if (fontStyle & 8) {
    styles.push("strikethrough")
  }
  return styles.join(" ")
}

function normalizeFontStyleString(fontStyle: string | undefined): string {
  if (!fontStyle) {
    return ""
  }
  const styles = new Set(
    fontStyle
      .split(RE_FONT_STYLE_SPLIT)
      .map((s) => s.trim().toLowerCase())
      .map((s) => VALID_FONT_ALIASES[s] || s)
      .filter(Boolean),
  )
  return VALID_FONT_STYLES.filter((s) => styles.has(s)).join(" ")
}

function getColorStyleKey(color: string, fontStyle: string): string {
  if (!fontStyle) {
    return color
  }
  return `${color}|${fontStyle}`
}

interface SetupOptions {
  tokenizeMaxLineLength?: number
  tokenizeTimeLimit?: number
}

interface ThemeRule {
  token: string
  foreground?: string | string[]
  fontStyle?: string
}

export function setupShikiMonaco(
  highlighter: Highlighter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  monaco: any,
  options?: SetupOptions,
) {
  const themeMap = new Map<string, { rules: ThemeRule[] }>()
  const themeIds = highlighter.getLoadedThemes()
  for (const themeId of themeIds) {
    const monacoTheme = textmateThemeToMonacoTheme(
      highlighter.getTheme(themeId),
    )
    themeMap.set(themeId, monacoTheme as unknown as { rules: ThemeRule[] })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco.editor.defineTheme(themeId, monacoTheme)
  }

  const colorMap: (string | undefined)[] = []
  const colorStyleToScopeMap = new Map<string, string>()
  const _setTheme = monaco.editor.setTheme.bind(monaco.editor)
  monaco.editor.setTheme = (themeName: string) => {
    const ret = highlighter.setTheme(themeName)
    const theme = themeMap.get(themeName)
    colorMap.length = ret.colorMap.length
    for (let i = 0; i < ret.colorMap.length; i++) {
      colorMap[i] = ret.colorMap[i]
    }
    colorStyleToScopeMap.clear()
    theme?.rules.forEach((rule: ThemeRule) => {
      const c = normalizeColor(rule.foreground)
      if (!c) {
        return
      }
      const key = getColorStyleKey(c, normalizeFontStyleString(rule.fontStyle))
      if (!colorStyleToScopeMap.has(key)) {
        colorStyleToScopeMap.set(key, rule.token)
      }
    })
    _setTheme(themeName)
  }

  const _create = monaco.editor.create.bind(monaco.editor)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  monaco.editor.create = (
    element: any,
    monacoOptions?: any,
    override?: any,
  ) => {
    if (monacoOptions?.theme) {
      monaco.editor.setTheme(monacoOptions.theme)
    }
    return _create(element, monacoOptions, override)
  }

  monaco.editor.setTheme(themeIds[0])

  function findScopeByColorAndStyle(
    color: string,
    fontStyle: number,
  ): string | undefined {
    const key = getColorStyleKey(color, normalizeFontStyleBits(fontStyle))
    return colorStyleToScopeMap.get(key)
  }

  const { tokenizeMaxLineLength = 20_000, tokenizeTimeLimit = 500 } =
    options ?? {}
  const monacoLanguageIds = new Set(
    monaco.languages.getLanguages().map((l: { id: string }) => l.id),
  )

  for (const lang of highlighter.getLoadedLanguages()) {
    if (monacoLanguageIds.has(lang)) {
      const provider = {
        getInitialState() {
          return new TokenizerState(INITIAL)
        },
        tokenize(line: string, state: TokenizerState) {
          if (line.length >= tokenizeMaxLineLength) {
            return {
              endState: state,
              tokens: [{ startIndex: 0, scopes: "" }],
            }
          }
          const result = highlighter
            .getLanguage(lang)
            .tokenizeLine2(line, state.ruleStack, tokenizeTimeLimit)
          if (result.stoppedEarly) {
            console.warn(
              `[shiki-monaco] Time limit reached when tokenizing line: ${line.substring(0, 100)}`,
            )
          }
          const tokensLength = result.tokens.length / 2
          const tokens: { startIndex: number; scopes: string }[] = []
          for (let j = 0; j < tokensLength; j++) {
            const startIndex = result.tokens[2 * j]
            const metadata = result.tokens[2 * j + 1]
            const color = normalizeColor(
              colorMap[EncodedTokenMetadata.getForeground(metadata)] ?? "",
            )
            const fontStyle = EncodedTokenMetadata.getFontStyle(metadata)
            const scope = color
              ? (findScopeByColorAndStyle(color, fontStyle) ?? "")
              : ""
            tokens.push({ startIndex, scopes: scope })
          }
          return {
            endState: new TokenizerState(result.ruleStack),
            tokens,
          }
        },
      }
      monaco.languages.setTokensProvider(lang, provider)
    }
  }
}
