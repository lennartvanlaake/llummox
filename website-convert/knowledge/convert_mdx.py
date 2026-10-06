#!/usr/bin/env python3
"""Clone astro docs repo, convert MDX -> Markdown (keep text + code, drop images/components)."""
import re, sys, subprocess, shutil, os

SRC = "/tmp/astro-docs-src"
if os.path.exists(SRC):
    shutil.rmtree(SRC)
subprocess.check_call(["git", "clone", "--depth", "1", "https://github.com/withastro/docs", SRC])

CONTENT = os.path.join(SRC, "src", "content", "docs", "en")
OUT = "/home/lennart/repos/llumox/website-convert/knowledge/astro"
if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)

# Strip: custom astro component imports (~/...) and starlight imports + code-in-imports
SKIP_IMPORT_RE = re.compile(r"^import\s+.*?\;?\s*$")

def clean(path):
    with open(path, encoding="utf-8") as f:
        txt = f.read()
    # Remove fenced code blocks that are imports only? No — keep code.
    # Drop starlight/component imports, keep everything else (incl. code fences)
    txt = re.sub(r"^import\s+[\s\S]*?;\s*$", "", txt, flags=re.MULTILINE)
    # Remove image syntax ![](url) and any referenced image src
    txt = re.sub(r"\[[^\]]*\]\([^)]*\)", "", txt)
    txt = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", txt)
    return txt

files = []
for root, _, names in os.walk(CONTENT):
    for n in names:
        if n.endswith(".mdx"):
            files.append(os.path.join(root, n))

for f in sorted(files):
    try:
        rel = os.path.splitext(os.path.relpath(f, CONTENT))[0] + ".md"
        target = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        md = clean(f)
        with open(target, "w", encoding="utf-8") as g:
            g.write(md)
    except Exception as e:
        print(f"FAILED {os.path.relpath(f, CONTENT)}: {e}")
        raise

print(f"converted {len(files)} mdx files -> {OUT}")
