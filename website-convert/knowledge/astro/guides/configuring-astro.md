---
title: Configuration overview
description: Get to know the ways you can configure and customize your new project and your development experience.
i18nReady: true
---

export default defineConfig({
  // your configuration options here...
});
```

It is only required if you have something to configure, but most projects will use this file. The `defineConfig()` helper provides automatic IntelliSense in your IDE and is where you will add all your configuration options to tell Astro how to build and render your project to HTML.

We recommend using the default file format `.mjs` in most cases, or `.ts` if you want to write TypeScript in your config file. However, `astro.config.js` is also supported.

<ReadMore>Read Astro's  for a full overview of all supported configuration options.</ReadMore>

## The TypeScript config File

Every Astro starter project includes a `tsconfig.json` file in your project. Astro's  is TypeScript, which provides Astro's editor tooling and allows you to optionally add syntax to your JavaScript for type checking of your own project code.

Use the `tsconfig.json` file to configure the TypeScript template that will perform type checks on your code, configure TypeScript plugins, set import aliases, and more.

<ReadMore>Read Astro's  for a full overview of TypeScript options and Astro's built-in utility types.</ReadMore>

## Development Experience

While you work in development mode, you can take advantage of your code editor and other tools to improve the Astro developer experience.

Astro provides its own official VS Code extension and is compatible with several other popular editor tools. Astro also provides a customizable toolbar that displays in your browser preview while the dev server is running. You can install and even build your own toolbar apps for additional functionality.

<ReadMore>Read Astro's guides to  and  to learn how to customize your development experience.</ReadMore>

## Common new project tasks

Here are some first steps you might choose to take with a new Astro project.

### Add your deployment domain

For generating your sitemap and creating canonical URLs, configure your deployment URL in the  option. If you are deploying to a path (e.g. `www.example.com/docs`), you can also configure a  for the root of your project.

Additionally, different deployment hosts may have different behavior regarding trailing slashes at the end of your URLs. (e.g. `example.com/about` vs `example.com/about/`). Once your site is deployed, you may need to configure your  preference.

```js title="astro.config.mjs"

export default defineConfig({
  site: "https://www.example.com",
  base: "/docs",
  trailingSlash: "always",
});
```

### Add site metadata

Astro does not use its configuration file for common SEO or meta data, only for information required to build your project code and render it to HTML.

Instead, this information is added to your page `<head>` using standard HTML `<link>` and `<meta>` tags, just as if you were writing plain HTML pages.

One common pattern for Astro sites is to create a `<Head />`  that can be added to a common  so it can apply to all your pages.

```astro title="src/components/MainLayout.astro"
---

const { ...props } = Astro.props;
---
<html>
  <head>
    <meta charset="utf-8">
    <Head />
    <!-- Additional head elements -->
  </head>
  <body>
    <!-- Page content goes here -->
  </body>
</html>
```

Because `Head.astro` is just a regular Astro component, you can import files and receive props passed from other components, such as a specific page title.

```astro title="src/components/Head.astro"
---


const { title = "My Astro Website", ...props } = Astro.props;
---
<link rel="sitemap" href="/sitemap-index.xml">
<title>{title}</title>
<meta name="description" content="Welcome to my new Astro site!">

<!-- Web analytics -->
<script data-goatcounter="https://my-account.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>

<!-- Open Graph tags -->
<meta property="og:title" content="My New Astro Website" />
<meta property="og:type" content="website" />
<meta property="og:url" content="http://www.example.com/" />
<meta property="og:description" content="Welcome to my new Astro site!" />
<meta property="og:image" content="https://www.example.com/_astro/seo-banner.BZD7kegZ.webp">
<meta property="og:image:alt" content="">

<SomeOtherTags />

<Favicon />
```
