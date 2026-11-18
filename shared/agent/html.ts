const MAX_FILTERED_HTML_CHARS = 10_000;
const ALLOWED_ATTRIBUTES = new Set([
  "id",
  "class",
  "href",
  "alt",
  "aria-label",
]);

const DROP_TAGS = new Set([
  "svg",
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "object",
  "embed",
  "applet",
  "canvas",
  "video",
  "audio",
  "source",
  "track",
  "map",
  "area",
  "link",
  "meta",
  "base",
  "param",
  "colgroup",
  "col",
  "wbr",
]);

const BLOCK_TAGS = new Set([
  "html",
  "head",
  "body",
  "header",
  "footer",
  "nav",
  "main",
  "section",
  "article",
  "aside",
  "div",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "caption",
  "form",
  "fieldset",
  "legend",
  "figure",
  "figcaption",
  "details",
  "summary",
  "blockquote",
  "pre",
  "address",
  "dl",
  "dt",
  "dd",
  "menu",
  "title",
  "hr",
]);

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const RAW_TEXT_TAGS = new Set(["pre", "code", "textarea"]);
const FILTER_HEADER =
  "filtered HTML: removed svg/script/style/noscript/template/comments/hidden nodes; attributes kept: id, class, href, alt, aria-label";

type Frame = {
  tag: string;
  block: boolean;
  hasBlockChild: boolean;
};

export type FilteredHtmlOptions = {
  selector?: string;
  maxChars?: number;
  path?: string;
};

export function filterHtmlString(
  html: string,
  options: FilteredHtmlOptions = {},
): string {
  const filtered = cleanupFormatted(createFilteringRewriter().transform(html));
  return finishFilteredHtml(filtered, options);
}

export async function readFilteredHtmlFile(
  file: string,
  path: string,
  options: FilteredHtmlOptions = {},
): Promise<string> {
  if (!(await Bun.file(file).exists())) {
    throw new Error(`File not found: ${path}`);
  }
  const filtered = cleanupFormatted(
    await createFilteringRewriter().transform(new Response(Bun.file(file))).text(),
  );
  return finishFilteredHtml(filtered, { ...options, path });
}

function createFilteringRewriter(): HTMLRewriter {
  const stack: Frame[] = [];
  let pendingText = "";

  return new HTMLRewriter()
    .onDocument({
      comments(comment) {
        comment.remove();
      },
    })
    .on("*", {
      element(element) {
        const tag = element.tagName.toLowerCase();
        if (DROP_TAGS.has(tag)) {
          element.remove();
          return;
        }

        if (isHidden(element)) {
          element.remove();
          return;
        }

        const names = [...element.attributes].map(([name]) => name);
        for (const name of names) {
          if (!ALLOWED_ATTRIBUTES.has(name.toLowerCase())) {
            element.removeAttribute(name);
          }
        }
        for (const name of [...element.attributes].map(([name]) => name)) {
          if ((element.getAttribute(name) ?? "") === "") {
            element.removeAttribute(name);
          }
        }

        if (tag === "a") {
          const href = element.getAttribute("href");
          if (href && /^\s*(javascript|data):/i.test(href)) {
            element.removeAttribute("href");
          }
        }

        if (tag === "span" && !hasAllowedAttribute(element)) {
          element.removeAndKeepContent();
          return;
        }
        if (
          tag === "a" &&
          !element.hasAttribute("href") &&
          !hasAllowedAttribute(element)
        ) {
          element.removeAndKeepContent();
          return;
        }

        const block = BLOCK_TAGS.has(tag);
        if (block) {
          if (stack.length > 0) {
            stack[stack.length - 1]!.hasBlockChild = true;
          }
          element.before(`\n${"  ".repeat(stack.length)}`);
        }

        if (VOID_TAGS.has(tag) || !element.canHaveContent || element.selfClosing) {
          if (block) {
            element.after("\n");
          }
          return;
        }

        stack.push({ tag, block, hasBlockChild: false });
        element.onEndTag((endTag) => {
          const frame = stack.pop();
          if (frame?.hasBlockChild) {
            endTag.before(`\n${"  ".repeat(stack.length)}`);
          }
        });
      },
      text(text) {
        pendingText += text.text;
        if (!text.lastInTextNode) {
          text.remove();
          return;
        }

        const fullText = pendingText;
        pendingText = "";
        if (insideRawText(stack)) {
          text.replace(fullText);
          return;
        }

        if (!fullText.trim()) {
          const current = stack[stack.length - 1];
          if (fullText.includes("\n") && current?.block) {
            text.replace("");
          } else {
            text.replace(" ");
          }
          return;
        }

        text.replace(fullText.replace(/[ \t\r\n]+/g, " "));
      },
    });
}

function isHidden(element: HTMLRewriterTypes.Element): boolean {
  if (element.hasAttribute("hidden")) {
    return true;
  }
  if (element.getAttribute("aria-hidden")?.toLowerCase() === "true") {
    return true;
  }
  const style = (element.getAttribute("style") ?? "").toLowerCase();
  return /display\s*:\s*none|visibility\s*:\s*hidden/.test(style);
}

function hasAllowedAttribute(element: HTMLRewriterTypes.Element): boolean {
  return [...ALLOWED_ATTRIBUTES].some((name) => element.hasAttribute(name));
}

function insideRawText(stack: Frame[]): boolean {
  return stack.some((frame) => RAW_TEXT_TAGS.has(frame.tag));
}

function finishFilteredHtml(
  filtered: string,
  options: FilteredHtmlOptions,
): string {
  const maxChars = filteredHtmlLimit(options.maxChars);
  const selector = options.selector?.trim();
  const path = options.path ?? "HTML input";

  let body = filtered;
  if (selector) {
    const matches = selectFilteredHtml(filtered, selector);
    if (matches.length === 0) {
      return `No HTML matches for selector "${selector}" in ${path}.`;
    }
    body = matches.join("\n");
  }

  if (!body.trim()) {
    return `No readable HTML content found in ${path}.`;
  }

  const selectorNote = selector ? `; selector="${sanitizeComment(selector)}"` : "";
  const header = `<!-- ${FILTER_HEADER}${selectorNote} -->`;
  return capOutput(
    `${header}\n${body.trim()}`,
    maxChars,
    `<!-- truncated at ${maxChars} characters; narrow selector, raise maxChars, or use read mode=file -->`,
  );
}

function selectFilteredHtml(html: string, selector: string): string[] {
  const startMarker = "<!--__FX_HTML_MATCH_START__-->";
  const endMarker = "<!--__FX_HTML_MATCH_END__-->";

  let marked: string;
  try {
    marked = new HTMLRewriter()
      .on(selector, {
        element(element) {
          element.before(startMarker, { html: true });
          element.after(endMarker, { html: true });
        },
      })
      .transform(html);
  } catch (error) {
    throw new Error(
      `Invalid HTML selector "${selector}": ${(error as Error).message}`,
    );
  }

  const segments: string[] = [];
  let depth = 0;
  let start = -1;
  for (let index = 0; index < marked.length; ) {
    if (marked.startsWith(startMarker, index)) {
      if (depth === 0) {
        start = index + startMarker.length;
      }
      depth += 1;
      index += startMarker.length;
      continue;
    }
    if (marked.startsWith(endMarker, index)) {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        segments.push(marked.slice(start, index));
        start = -1;
      }
      index += endMarker.length;
      continue;
    }
    index += 1;
  }

  return segments.map((segment) =>
    segment.replaceAll(startMarker, "").replaceAll(endMarker, ""),
  );
}

function cleanupFormatted(html: string): string {
  return html
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function capOutput(text: string, maxChars: number, notice: string): string {
  if (text.length <= maxChars) {
    return text;
  }
  if (maxChars <= notice.length + 1) {
    return notice.slice(0, maxChars);
  }

  const budget = maxChars - notice.length - 1;
  const cut = text.slice(0, budget);
  const candidates = [cut.lastIndexOf("\n"), cut.lastIndexOf(">")].filter(
    (index) => index >= budget * 0.8,
  );
  const boundary = Math.max(...candidates, -1);
  const body = boundary > 0 ? cut.slice(0, boundary + 1) : cut;
  return `${body}\n${notice}`;
}

function filteredHtmlLimit(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return MAX_FILTERED_HTML_CHARS;
  }
  return Math.max(1, Math.min(Math.floor(value), MAX_FILTERED_HTML_CHARS));
}

function sanitizeComment(value: string): string {
  return value.replace(/-->/g, "").replace(/--/g, "-");
}
