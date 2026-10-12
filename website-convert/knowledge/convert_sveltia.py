#!/usr/bin/env python3
"""Fetch Sveltia CMS docs from sveltiacms.app, convert rendered HTML -> Markdown.
Strips: non-Astro framework paths (Hugo/Eleventy/etc), image syntax, Sveltia-specific imports.
"""
import re, sys, shutil, os, html
import urllib.request

BASE = "https://sveltiacms.app"
# ponytail: dry-run via env override so we can preview before committing to OUT
OUT = os.environ.get("SVELTIA_OUT", "/home/lennart/repos/llumox/website-convert/knowledge/sveltia")
if OUT and os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

def fetch(url):
    import time
    # ponytail: realistic delays + UA avoid rate-limit 404s from sveltiacms.app
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
        "Accept": "text/html,application/xml,application/xhtml+xml,*/*;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)
    for attempt in range(8):
        try:
            time.sleep(1.5)
            with urllib.request.urlopen(req, timeout=30) as r:
                text = r.read().decode("utf-8", "replace")
            return text
        except Exception as e:
            # ponytail: transient DNS/network flakiness — retry hard, then return partial
            if attempt < 7:
                time.sleep(2 ** (attempt + 1))
            else:
                return ""

# ponytail: re.findall over <url><loc> tags — avoids <xhtml:link> RSS entries sharing same paths
# Non-Astro frameworks to strip (other-SG paths, migration guides, non-Astro starter templates)
NON_ASTRO = re.compile(
    r"(?im)^\s*(?:migrat(?:ing|ion|e)?|from|using|built with|powered by|based on)\s*[^\n]{0,40}(?:hugo|eleventy|11ty|next\.js|gatsby|nuxt|vue\.js|react|wordpress|jekyll|grav|decap|netlify cms|pages cms)\b[^\n]{0,30}(?:\.|\n|$)",
)
# Non-Astro starter template headers (e.g. "Eleventy ", "Hugo ", "Jekyll ")
NON_ASTRO_TEMPLATE_HEADER = re.compile(
    r"(?im)^\s*(?:Eleventy|Hugo|Jekyll|Grav|Zola|Gatsby|Nuxt|Vue\.js|Next\.js)\s+\$",
)
# Non-Astro framework headers (e.g. "Eleventy ", "Hugo ", "Jekyll ")
NON_ASTRO_TEMPLATE_HEADER = re.compile(
    r"^(?P<hdr>Eleventy|Hugo|Jekyll|Grav|Zola|Gatsby|Nuxt|Vue\.js|Next\.js)\s+")
# Non-Astro framework mentions in prose (e.g. "built with Hugo")
NON_ASTRO_PROSE = re.compile(
    r"(?im)(?<=\s)(?P<n>Eleventy|Hugo|Jekyll|Grav|Zola|Gatsby)\s+(?=[A-Z][^\n]{0,20}\.|\$)",
)

# Sveltia-specific imports/components
SVELTIA_IMPORT_RE = re.compile(r"(?i)^\s*(import|from)\s+['\"]@sveltia/[^'\"]+['\"]\s*;?\s*$")
SVELTIA_COMP_RE = re.compile(r"(?i)\b(SveltiaConfig|SveltiaAdmin|SveltiaCMS|SveltiaLoader)\b")

# Images
IMG_RE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
IMG_RE2 = re.compile(r"\[[^\]]*\]\([^)]*\)")

def extract_content(page):
    """Extract the docs content region (after first heading)."""
    idx = page.find("<h1 id=")
    if idx == -1:
        return ""
    return page[idx:]

def extract_code_blocks(content):
    """Return list of (lang, code) from shiki colorized code spans."""
    blocks = []
    for m in re.finditer(r"<span class=\"lang\">(\w+)</span>.*?<code>(.*?)</code>", content, re.S):
        lang = m.group(1)
        code = html.unescape(m.group(2))
        blocks.append((lang, code))
    return blocks

def html_to_md(content):
    # Extract code blocks first
    code_blocks = extract_code_blocks(content)
    # Remove code blocks from text processing
    content_nocode = re.sub(r'<span class="lang">[\w]+</span>.*?<code>.*?</code>', "", content, flags=re.S)
    # Strip styles/scripts
    content_nocode = re.sub(r"<style[^>]*>.*?</style>", "", content_nocode, flags=re.S)
    content_nocode = re.sub(r"<script[^>]*>.*?</script>", "", content_nocode, flags=re.S)
    # Strip all remaining tags
    content_nocode = re.sub(r"<[^>]+>", "", content_nocode)
    content_nocode = html.unescape(content_nocode)
    # Reassemble: prose + code fences
    md = []
    last = 0
    for m in re.finditer(r'<span class="lang">([\w]+)</span>.*?<code>.*?</code>', content, re.S):
        start, end = m.start(), m.end()
        md.append(content_nocode[last:start].strip())
        lang = m.group(1)
        code_m = re.search(r"<code>(.*?)</code>", m.group(0), re.S)
        code = html.unescape(code_m.group(1)) if code_m else ""
        md.append("\n" + "```" + lang + "\n" + code.strip() + "\n" + "```" + "\n")
        last = end
    md.append(content_nocode[last:].strip())
    result = "\n\n".join(p for p in md if p.strip())
    result = re.sub(r"\n{3,}", "\n\n\n", result)
    return result

def clean_markdown(md):
    md = SVELTIA_IMPORT_RE.sub("", md)
    md = NON_ASTRO.sub("", md)
    # Strip non-Astro starter template headers (e.g. "Eleventy ", "Hugo ", "Jekyll ")
    # Pattern: framework name + space + zero-width space + rest (the description follows)
    md = re.sub(r"(Eleventy|Hugo|Jekyll|Grav|Zola|Gatsby|Nuxt|Vue\.js|Next\.js)(\s\u200b.*)", "", md, flags=re.I)
    md = SVELTIA_COMP_RE.sub("", md)
    md = IMG_RE.sub("", md)
    md = IMG_RE2.sub("", md)
    return md

# Build page list from sitemap
sitemap = fetch(f"{BASE}/sitemap.xml")
# Only match <url> entries, not <xhtml:link> RSS entries which share the same paths
urls = re.findall(r'<url><loc>(https://sveltiacms.app/en/docs/[^<]+)</loc></url>', sitemap or "")

converted, failed = 0, 0
# ponytail: dry-run preview is capped; full run drops the limit
if os.environ.get("SVELTIA_DRY_RUN") == "1":
    urls = urls[:25]
for slug in urls:
    # slug is a full URL from the sitemap; strip the host to get a fetch URL and a relative path
    rel = slug.split(BASE, 1)[1][1:] if slug.startswith(BASE) else slug  # drop leading '/'
    url = BASE + rel
    try:
        import time as _t
        _t.sleep(0.3)
        page = fetch(url)
    except Exception as e:
        print(f"FAILED fetch {slug}: {e}")
        failed += 1
        continue
    try:
        content = extract_content(page)
        if not content.strip():
            print(f"FAILED parse {slug}: empty content")
            failed += 1
            continue
        md = html_to_md(content)
        md = clean_markdown(md)
        # flatten nested doc paths to one file per page (flat layout)
        target_rel = f"{slug.split('/')[-1]}.md"
        target = os.path.join(OUT, target_rel)
        with open(target, "w", encoding="utf-8") as f:
            f.write(md)
        converted += 1
    except Exception as e:
        print(f"FAILED {slug}: {e}")
        failed += 1

print(f"converted {converted} pages -> {OUT} ({failed} failed)")
