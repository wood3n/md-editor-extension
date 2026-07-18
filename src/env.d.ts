declare module "*.css" {}

declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";
  function taskLists(md: MarkdownIt): void;
  export = taskLists;
}

declare module "markdown-it-sub" {
  import type MarkdownIt from "markdown-it";
  function sub(md: MarkdownIt): void;
  export = sub;
}

declare module "markdown-it-sup" {
  import type MarkdownIt from "markdown-it";
  function sup(md: MarkdownIt): void;
  export = sup;
}

declare module "markdown-it-ins" {
  import type MarkdownIt from "markdown-it";
  function ins(md: MarkdownIt): void;
  export = ins;
}

declare module "markdown-it-mark" {
  import type MarkdownIt from "markdown-it";
  function mark(md: MarkdownIt): void;
  export = mark;
}

declare module "markdown-it-footnote" {
  import type MarkdownIt from "markdown-it";
  function footnote(md: MarkdownIt): void;
  export = footnote;
}

declare module "markdown-it-deflist" {
  import type MarkdownIt from "markdown-it";
  function deflist(md: MarkdownIt): void;
  export = deflist;
}

declare module "markdown-it-emoji" {
  import type MarkdownIt from "markdown-it";
  export const full: (md: MarkdownIt) => void;
  export const light: (md: MarkdownIt) => void;
  export const bare: (md: MarkdownIt) => void;
}
