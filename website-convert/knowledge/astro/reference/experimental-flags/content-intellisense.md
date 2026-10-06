---
title: Experimental Intellisense for content collections
sidebar:
  label: Intellisense for collections
i18nReady: true
---


export default defineConfig({
  experimental: {
    contentIntellisense: true,
  },
});
```

To use this feature with the Astro VS Code extension, you must also enable the `astro.content-intellisense` option in your VS Code settings. For editors using the Astro language server directly, pass the `contentIntellisense: true` initialization parameter to enable this feature.
