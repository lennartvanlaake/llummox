---
# NOTE: This file is auto-generated from 'scripts/error-docgen.mjs'
# Do not make edits to it directly, they will be overwritten.
# Instead, change this file: https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts
# Translators, please remove this note and the <DontEditWarning/> component.

title: getImage() must be used on the server.
i18nReady: true
githubURL: https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts
---


const optimizedImage = await getImage({ src: myImage, width: 300 });
---

<script define:vars={{ imageSrc: optimizedImage.src }}>
  // Use imageSrc in client-side code
  document.getElementById('myImage').src = imageSrc;
</script>
```

**See Also:**
-  
-  


