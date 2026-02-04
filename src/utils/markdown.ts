import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import MarkdownIt from "markdown-it";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("text", plaintext);
hljs.registerLanguage("plaintext", plaintext);

export interface CodeBlockData {
  id: number;
  lang: string;
  code: string;
  highlighted: string;
}

const PLACEHOLDER_PREFIX = "\u200BCODEBLOCK";
const PLACEHOLDER_SUFFIX = "CODEBLOCK\u200B";

export function renderMarkdown(raw: string): {
  html: string;
  codeBlocks: CodeBlockData[];
} {
  const codeBlocks: CodeBlockData[] = [];
  let blockId = 0;

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(str: string, lang: string) {
      if (!lang) lang = "plaintext";
      const code = str.trim();
      let highlighted: string;
      try {
        highlighted = hljs.highlight(code, {
          language: lang,
          ignoreIllegals: true,
        }).value;
      } catch {
        highlighted = md.utils.escapeHtml(code);
      }
      const id = blockId++;
      codeBlocks.push({
        id,
        lang,
        code,
        highlighted,
      });
      return `${PLACEHOLDER_PREFIX}${id}${PLACEHOLDER_SUFFIX}`;
    },
  });

  const html = md.render(raw);
  return { html, codeBlocks };
}

export function splitHtmlByCodeBlocks(
  html: string,
  codeBlocks: CodeBlockData[]
): Array<
  { type: "html"; content: string } | { type: "code"; data: CodeBlockData }
> {
  const parts: Array<
    { type: "html"; content: string } | { type: "code"; data: CodeBlockData }
  > = [];
  const regex = new RegExp(
    `${escapeRe(PLACEHOLDER_PREFIX)}(\\d+)${escapeRe(PLACEHOLDER_SUFFIX)}`,
    "g"
  );
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const id = parseInt(m[1], 10);
    parts.push({
      type: "html",
      content: html.slice(lastIndex, m.index),
    });
    const block = codeBlocks.find((b) => b.id === id);
    if (block) {
      parts.push({ type: "code", data: block });
    }
    lastIndex = regex.lastIndex;
  }
  parts.push({ type: "html", content: html.slice(lastIndex) });
  return parts;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
