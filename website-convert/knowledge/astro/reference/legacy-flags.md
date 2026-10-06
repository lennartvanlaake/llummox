---
title: Legacy flags
i18nReady: true
---


```

This flag preserves some legacy v4 content collections features:

- Supports `type: 'content'` and `type: 'data'` without loaders
- Preserves legacy entry API: `entry.slug` and `entry.render()`
- Uses path-based entry IDs instead of slug-based IDs

This is a temporary migration helper. Migrate collections to the Content Layer API, then disable this flag.
