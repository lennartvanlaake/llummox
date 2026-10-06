---
title: Experimental client prerendering
sidebar:
  label: Client prerendering
i18nReady: true
---


export default defineConfig({
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  experimental: {
    clientPrerender: true,
  },
});
```

Continue to use the `data-astro-prefetch` attribute on any `<a />` link on your site to opt in to prefetching.
Instead of appending a `<link>` tag to the head of the document or fetching the page with JavaScript, a `<script>` tag will be appended with the corresponding speculation rules.

Client side prerendering requires browser support. If the Speculation Rules API is not supported, `prefetch` will fallback to the supported strategy.

See the  for more `prefetch` options and usage.
