---
title: Experimental collection storage
sidebar:
  label: Collection storage
i18nReady: true
---


export default defineConfig({
  experimental: {
    collectionStorage: "chunked"
  }
});
```

In chunked mode, files are split across multiple chunks. Astro creates a new chunk when the current chunk is larger than 20 MB.

Alternatively, you can change the limit. This is useful if you have particular limits set by your runtime or host.

The following example reduces the limit to 1MB:

```js title="astro.config.mjs" ins="chunkSize" ins={6-7}

export default defineConfig({
  experimental: {
    collectionStorage: {
      type: "chunked",
      chunkSize: 1024 * 1024
    }
  }
});
```

This option is recommended when deploying to platforms that have a size limit for individual assets.
