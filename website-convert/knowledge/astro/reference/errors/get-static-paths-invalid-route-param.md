---
# NOTE: This file is auto-generated from 'scripts/error-docgen.mjs'
# Do not make edits to it directly, they will be overwritten.
# Instead, change this file: https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts
# Translators, please remove this note and the <DontEditWarning/> component.

title: Invalid route parameter returned by getStaticPaths().
i18nReady: true
githubURL: https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts
---

}
---
```

In routes using , `undefined` can be used to represent a path with no parameters passed in the URL:

```astro title="/route/[...id].astro"
---
export async function getStaticPaths() {
	return [
		{ params: { id: '1' } } // /route/1
		{ params: { id: '2' } } // /route/2
		{ params: { id: undefined } } // /route/
	];
}
---
```

**See Also:**
-  
-  


