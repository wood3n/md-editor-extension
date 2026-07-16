declare module "*.css" {}

declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";
  function taskLists(md: MarkdownIt): void;
  export = taskLists;
}
