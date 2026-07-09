import { remarkPluginsCtx } from "@milkdown/core";
import type { MilkdownPlugin } from "@milkdown/ctx";

/** remark plugin: transforms ==text== into <mark>text</mark> in markdown AST */
function remarkHighlight() {
  return (tree: any) => {
    function walk(node: any) {
      if (node.type === "text") {
        node.value = node.value.replace(
          /==(.+?)==/g,
          (_: string, text: string) => `<mark>${text}</mark>`
        );
      }
      if (node.children) {
        node.children.forEach((child: any) => walk(child));
      }
    }
    walk(tree);
  };
}

export const highlightPlugin: MilkdownPlugin = (ctx) => {
  ctx.update(remarkPluginsCtx, (prev) => [
    ...prev,
    { plugin: remarkHighlight, options: {} },
  ]);
  return () => {};
};
