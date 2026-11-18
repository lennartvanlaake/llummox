import { describe, expect, test } from "bun:test";
import { filterHtmlString } from "./html";

const SAMPLE = `<!doctype html>
<html lang="en" data-page="home">
<head>
  <meta charset="utf-8">
  <title>Example</title>
  <style>.hero { color: red; }</style>
  <script>alert("no")</script>
</head>
<body class="page" id="top" onclick="bad()">
  <!-- a comment -->
  <header class="site-header">
    <nav><a href="/" title="Home">Home</a><a href="/about" class="nav-link">About</a></nav>
  </header>
  <main id="content">
    <article class="card" data-id="1">
      <h1>Hello <strong style="font-weight:bold">world</strong></h1>
      <p>Visible text.</p>
      <pre>  alpha
    beta  </pre>
      <img src="hero.png" alt="Hero image" aria-label="Hero" class="hero">
    </article>
    <article class="card">
      <h2>Second</h2>
    </article>
    <div hidden><p>Hidden text</p></div>
    <svg viewBox="0 0 10 10"><path d="M0 0"/><text>svg text</text></svg>
    <noscript><p>No script</p></noscript>
    <template><p>Template</p></template>
  </main>
  <footer><p>Footer</p></footer>
  <script type="module">console.log("no")</script>
</body>
</html>`;

describe("filterHtmlString", () => {
  test("marks the output as filtered HTML", () => {
    const html = filterHtmlString(SAMPLE, { path: "page.html" });
    expect(html.startsWith("<!-- filtered HTML:")).toBe(true);
    expect(html).toContain("attributes kept: id, class, href, alt, aria-label");
  });

  test("removes non-content tags, comments, and hidden nodes", () => {
    const html = filterHtmlString(SAMPLE);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<style");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("<noscript");
    expect(html).not.toContain("<template");
    expect(html).not.toContain("<!-- a comment -->");
    expect(html).not.toContain("Hidden text");
    expect(html).not.toContain("svg text");
    expect(html).not.toContain('alert("no")');
  });

  test("keeps only the allowed attributes", () => {
    const html = filterHtmlString(SAMPLE);
    expect(html).toContain('<body class="page" id="top">');
    expect(html).toContain('<a href="/">Home</a>'); // title removed
    expect(html).toContain('<a href="/about" class="nav-link">About</a>');
    expect(html).toContain('<article class="card">');
    expect(html).toContain('<img alt="Hero image" aria-label="Hero" class="hero">');
    expect(html).not.toContain("data-page");
    expect(html).not.toContain("data-id");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain('style="');
    expect(html).not.toContain("src=");
    expect(html).not.toContain("title=");
  });

  test("keeps content and preserves preformatted whitespace", () => {
    const html = filterHtmlString(SAMPLE);
    expect(html).toContain("<title>Example</title>");
    expect(html).toContain("Hello <strong>world</strong>");
    expect(html).toContain("Visible text.");
    expect(html).toContain("<pre>  alpha\n    beta  </pre>");
    expect(html).toContain("Footer");
  });

  test("supports a CSS selector", () => {
    const html = filterHtmlString(SAMPLE, { selector: "article" });
    expect(html).toContain("Hello <strong>world</strong>");
    expect(html).toContain("Second");
    expect(html).not.toContain("Footer");
    expect(html).not.toContain("site-header");
  });

  test("returns a clear message when a selector matches nothing", () => {
    const html = filterHtmlString(SAMPLE, {
      selector: ".does-not-exist",
      path: "page.html",
    });
    expect(html).toBe(
      'No HTML matches for selector ".does-not-exist" in page.html.',
    );
  });

  test("caps output at maxChars", () => {
    const html = filterHtmlString(
      `<html><body><p>${"x".repeat(20_000)}</p></body></html>`,
      { maxChars: 500 },
    );
    expect(html.length).toBeLessThanOrEqual(500);
    expect(html).toContain("<!-- truncated at 500 characters");
  });

  test("defaults to a 10000 character cap", () => {
    const html = filterHtmlString(
      `<html><body><p>${"x".repeat(20_000)}</p></body></html>`,
    );
    expect(html.length).toBeLessThanOrEqual(10_000);
    expect(html).toContain("<!-- truncated at 10000 characters");
  });
});
