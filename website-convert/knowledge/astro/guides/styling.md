---
title: Styles and CSS
description: >-
  Learn how to style components in Astro with scoped styles, external CSS, and
  tooling like Sass and PostCSS.
i18nReady: true
---



Astro was designed to make styling and writing CSS a breeze. Write your own CSS directly inside of an Astro component or import your favorite CSS library like [Tailwind][tailwind]. Advanced styling languages like [Sass][sass] and [Less][less] are also supported.

## Styling in Astro

Styling an Astro component is as easy as adding a `<style>` tag to your component or page template. When you place a `<style>` tag inside of an Astro component, Astro will detect the CSS and handle your styles for you, automatically.

```astro title="src/components/MyComponent.astro"
<style>
  h1 { color: red; }
</style>
```

### Scoped Styles

Astro `<style>` CSS rules are automatically **scoped by default**. Scoped styles are compiled behind-the-scenes to only apply to HTML written inside of that same component. The CSS that you write inside of an Astro component is automatically encapsulated inside of that component.

This CSS:
```astro title="src/pages/index.astro"
<style>
  h1 {
    color: red;
  }

  .text {
    color: blue;
  }
</style>
```

Compiles to this:
```astro
<style>
  h1[data-astro-cid-hhnqfkh6] {
     color: red;
  }

  .text[data-astro-cid-hhnqfkh6] {
    color: blue;
  }
</style>
```


Scoped styles don't leak and won't impact the rest of your site. In Astro, it is okay to use low-specificity selectors like `h1 {}` or `p {}` because they will be compiled with scopes in the final output.

Scoped styles also won't apply to other Astro components contained inside of your template. If you need to style a child component, consider wrapping that component in a `<div>` (or other element) that you can then style.

The specificity of scoped styles is preserved, allowing them to work consistently alongside other CSS files or CSS libraries while still preserving the exclusive boundaries that prevent styles from applying outside the component.

### Global Styles

While we recommend scoped styles for most components, you may eventually find a valid reason to write global, unscoped CSS. You can opt-out of automatic CSS scoping with the `<style is:global>` attribute.

```astro title="src/components/GlobalStyles.astro" "is:global"
<style is:global>
  /* Unscoped, delivered as-is to the browser.
     Applies to all <h1> tags on your site. */
  h1 { color: red; }
</style>
```

You can also mix global & scoped CSS rules together in the same `<style>` tag using the `:global()` selector. This becomes a powerful pattern for applying CSS styles to children of your component.

```astro title="src/components/MixedStyles.astro" ":global(h1)"
<style>
  /* Scoped to this component, only. */
  h1 { color: red; }
  /* Mixed: Applies to child `h1` elements only. */
  article :global(h1) {
    color: blue;
  }
</style>
<h1>Title</h1>
<article><slot /></article>
```

This is a great way to style things like blog posts, or documents with CMS-powered content where the contents live outside of Astro. But be careful: components whose appearance differs based on whether or not they have a certain parent component can become difficult to troubleshoot.

Scoped styles should be used as often as possible. Global styles should be used only as-needed.

### Combining classes with `class:list`

If you need to combine classes on an element dynamically, you can use the `class:list` utility attribute in `.astro` files.

```astro title="src/components/ClassList.astro" /class:list={.*}/
---
const { isRed } = Astro.props;
---
<!-- If `isRed` is truthy, class will be "box red". -->
<!-- If `isRed` is falsy, class will be "box". -->
<div class:list={['box', { red: isRed }]}><slot /></div>

<style>
  .box { border: 1px solid blue; }
  .red { border-color: red; }
</style>
```

<ReadMore>See our  page to learn more about `class:list`.</ReadMore>

### CSS Variables

<p><Since v="0.21.0" /></p>

The Astro `<style>` can reference any CSS variables available on the page. You can also pass CSS variables directly from your component frontmatter using the `define:vars` directive.

```astro title="src/components/DefineVars.astro" /define:vars={{.*}}/ /var\\(.*\\)/
---
const foregroundColor = "rgb(221 243 228)";
const backgroundColor = "rgb(24 121 78)";
---
<style define:vars={{ foregroundColor, backgroundColor }}>
  h1 {
    background-color: var(--backgroundColor);
    color: var(--foregroundColor);
  }
</style>
<h1>Hello</h1>
```

<ReadMore>See our  page to learn more about `define:vars`.</ReadMore>


### Passing a `class` to a child component

In Astro, HTML attributes like `class` do not automatically pass through to child components.

Instead, accept a `class` prop in the child component and apply it to the root element. When destructuring, you must rename it, because `class` is a  in JavaScript.

Using the default scoped style strategy, you must also pass the `data-astro-cid-*` attribute. You can do this by passing the `...rest` of the props to the component. If you have changed `scopedStyleStrategy` to `'class'` or `'where'`, the `...rest` prop is not necessary.

```astro title="src/components/MyComponent.astro" {2,4}
---
const { class: className, ...rest } = Astro.props;
---
<div class={className} {...rest}>
  <slot/>
</div>
```

```astro title="src/pages/index.astro"
---

  }
</style>
<MyComponent class="red">This will be red!</MyComponent>
```

:::note[Scoped styles from parent components]
Because the `data-astro-cid-*` attribute includes the child in its parent’s scope, it is possible for styles to cascade from parent to child. To avoid this having unintended side effects, ensure you use unique class names in the child component.
:::

### Inline styles

You can style HTML elements inline using the `style` attribute. This can be a CSS string or an object of CSS properties:

```astro title="src/pages/index.astro"
// These are equivalent:
<p style={{ color: "brown", textDecoration: "underline" }}>My text</p>
<p style="color: brown; text-decoration: underline;">My text</p>
```

## External Styles

There are two ways to resolve external global stylesheets: an ESM import for files located within your project source, and an absolute URL link for files in your `public/` directory, or hosted outside of your project.

<ReadMore>Read more about using  located in `public/` or `src/`.</ReadMore>

### Import a local stylesheet

:::caution[Using an npm package?]
You may need to update your `astro.config` when importing from npm packages. See the  below.
:::

You can import stylesheets in your Astro component frontmatter using ESM import syntax. CSS imports work like , which should be referenced as **relative to the component** and must be written at the **top** of your component script, with any other imports.

```astro title="src/pages/index.astro" {4}
---
// Astro will bundle and optimize this CSS for you automatically
// This also works for preprocessor files like .scss, .styl, etc.

---
<html><!-- Your page here --></html>
```

CSS `import` via ESM are supported inside of any JavaScript file, including JSX components like React & Preact.  This can be useful for writing granular, per-component styles for your React components.

### Import a stylesheet from an npm package

You may also need to load stylesheets from an external npm package. This is especially common for utilities like . If your package **recommends using a file extension** (i.e. `package-name/styles.css` instead of `package-name/styles`), this should work like any local stylesheet:

```astro {3}
---
// src/pages/random-page.astro

---
<html><!-- Your page here --></html>
```

If your package **does not suggest using a file extension** (i.e. `package-name/styles`), you'll need to update your Astro config first!

Say you are importing a CSS file from `package-name` called `normalize` (with the file extension omitted). To ensure we can prerender your page correctly, add `package-name` to :

```js ins={7}
// astro.config.mjs

export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['package-name'],
    }
  }
})
```

:::note
This is a  that does _not_ relate to (or require) .
:::

Now, you are free to import `package-name/normalize`. This will be bundled and optimized by Astro like any other local stylesheet.


```astro {3}
---
// src/pages/random-page.astro

---
<html><!-- Your page here --></html>
```

### Load a static stylesheet via "link" tags

You can also use the `<link>` element to load a stylesheet on the page. This should be an absolute URL path to a CSS file located in your `/public` directory, or a URL to an external website. Relative `<link>` href values are not supported.

```astro title="src/pages/index.astro" {3,5}
<head>
  <!-- Local: /public/styles/global.css -->
  <link rel="stylesheet" href="/styles/global.css" />
  <!-- External -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.24.1/themes/prism-tomorrow.css" />
</head>
```

Because this approach uses the `public/` directory, it skips the normal CSS processing, bundling and optimizations that are provided by Astro. If you need these transformations, use the  method above.

## Cascading Order

Astro components will sometimes have to evaluate multiple sources of CSS. For example, your component might import a CSS stylesheet, include its own `<style>` tag, *and* be rendered inside a layout that imports CSS.

When conflicting CSS rules apply to the same element, browsers first use _specificity_ and then _order of appearance_ to determine which value to show.

If one rule is more _specific_ than another, no matter where the CSS rule appears, its value will take precedence:

```astro title="src/components/MyComponent.astro"
<style>
  h1 { color: red }
  div > h1 {
    color: purple
  }
</style>
<div>
  <h1>
    This header will be purple!
  </h1>
</div>
```

If two rules have the same specificity, then the _order of appearance_ is evaluated, and the last rule's value will take precedence:
```astro title="src/components/MyComponent.astro"
<style>
  h1 { color: purple }
  h1 { color: red }
</style>
<div>
  <h1>
    This header will be red!
  </h1>
</div>
```

Astro CSS rules are evaluated in this order of appearance:

- **`<link>` tags in the head** (lowest precedence)
- **imported styles**
- **scoped styles** (highest precedence)

### Scoped Styles

Depending on your chosen value for , scoped styles may or may not increase the .

However,  will always come last in the order of appearance. These styles will therefore take precedence over other styles of the same specificity. For example, if you import a stylesheet that conflicts with a scoped style, the scoped style’s value will apply:

```css title="src/components/make-it-purple.css"
h1 {
  color: purple;
}
```
```astro title="src/components/MyComponent.astro"
---

}
```
```astro title="src/components/MyComponent.astro"
---

}
```
```css title="src/components/make-it-green.css"
div > h1 {
  color: green;
}
```
```astro title="src/components/MyComponent.astro"
---

---
<style>
  h1 { color: red }
</style>
<div>
  <h1>
    This header will be purple!
  </h1>
</div>
```

:::tip
A common pattern in Astro is to import global CSS inside a . Be sure to import the Layout component before other imports so that it has the lowest precedence.
:::

### Link Tags
Style sheets loaded via  are evaluated in order, before any other styles in an Astro file. Therefore, these styles will have lower precedence than imported stylesheets and scoped styles:

```astro title="src/pages/index.astro"
---

```

Import this file in the pages where you want Tailwind to apply. This is often done in a layout component so that Tailwind styles can be used on all pages sharing that layout:

```astro title="src/layouts/Layout.astro"
---

---
```

### Upgrade from Tailwind 3

Follow the steps to update an existing Astro project using Tailwind v3 (using the `@astrojs/tailwind` integration) to Tailwind 4 (using ).

<Steps>
1.  through the CLI for the latest version of Astro, or by adding the Vite plugin manually.

2. Uninstall the `@astrojs/tailwind` integration from your project:

    <PackageManagerTabs>
      <Fragment slot="npm">
      ```shell
      npm uninstall @astrojs/tailwind
      ```
      </Fragment>
      <Fragment slot="pnpm">
      ```shell
      pnpm remove @astrojs/tailwind
      ```
      </Fragment>
      <Fragment slot="yarn">
      ```shell
      yarn remove @astrojs/tailwind
      ```
      </Fragment>
    </PackageManagerTabs>

3. Remove the `@astrojs/tailwind` integration from your `astro.config.mjs`:

    ```js title="astro.config.mjs" del={2} del="tailwind()"
    import { defineConfig } from 'astro/config';
    import tailwind from '@astrojs/tailwind';

    export default defineConfig({
      // ...
      integrations: [tailwind()],
      // ...
    });
    ```

4. Then, upgrade your project according to .
</Steps>

### Legacy Tailwind 3 support

To add (or keep) support for Tailwind 3, you will need to have both `tailwindcss@3` and the official Astro Tailwind integration `@astrojs/tailwind` installed. Installing these dependencies manually is only used for legacy Tailwind 3 compatibility, and is not required for Tailwind 4. You will also need a :

<Steps>
1. Install Tailwind and the Astro Tailwind integration to your project dependencies using your preferred package manager:

   <PackageManagerTabs>
     <Fragment slot="npm">
     ```shell
     npm install tailwindcss@3 @astrojs/tailwind
     ```
     </Fragment>
     <Fragment slot="pnpm">
     ```shell
     pnpm add tailwindcss@3 @astrojs/tailwind
     ```
     </Fragment>
     <Fragment slot="yarn">
     ```shell
     yarn add tailwindcss@3 @astrojs/tailwind
     ```
     </Fragment>
   </PackageManagerTabs>

2. Import the integration to your `astro.config.mjs` file, and add it to your `integrations[]` array:

    ```js title="astro.config.mjs" ins={2} ins="tailwind()"
    import { defineConfig } from 'astro/config';
    import tailwind from '@astrojs/tailwind';

    export default defineConfig({
      // ...
      integrations: [tailwind()],
      // ...
    });
    ```
3. Create a `tailwind.config.mjs` file in your project’s root directory. You can use the following command to generate a basic configuration file for you:

   <PackageManagerTabs>
     <Fragment slot="npm">
     ```shell
     npx tailwindcss init
     ```
     </Fragment>
     <Fragment slot="pnpm">
     ```shell
     pnpm dlx tailwindcss init
     ```
     </Fragment>
     <Fragment slot="yarn">
     ```shell
     yarn dlx tailwindcss init
     ```
     </Fragment>
   </PackageManagerTabs>

4. Add the following basic configuration to your `tailwind.config.mjs` file:

    ```ts title="tailwind.config.mjs" ins={3}
    /** @type {import('tailwindcss').Config} */
    export default {
      content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
      theme: {
        extend: {},
      },
      plugins: [],
    };
    ```
</Steps>

<RecipeLinks slugs={["en/recipes/tailwind-rendered-markdown"]}/>

## CSS Preprocessors

Astro supports CSS preprocessors such as [Sass][sass], [Stylus][stylus], and [Less][less] through [Vite][vite-preprocessors].

### Sass and SCSS

 ```shell
 npm install sass
 ```

Use `<style lang="scss">` or `<style lang="sass">` in `.astro` files.

### Stylus

```shell
npm install stylus
```

Use `<style lang="styl">` or `<style lang="stylus">` in `.astro` files.

### Less

```shell
npm install less
```

Use `<style lang="less">` in `.astro` files.

### LightningCSS

```shell
npm install lightningcss
```

Update your `vite` configuration in `astro.config.mjs`:

```js title="astro.config.mjs" ins={4-8}

```


## Frameworks and Libraries

### 📘 React / Preact

`.jsx` files support both global CSS and CSS Modules. To enable the latter, use the `.module.css` extension (or `.module.scss`/`.module.sass` if using Sass).

```jsx title="src/components/MyReactComponent.jsx" /[a-z]+(\\.module\\.css)/

export default defineConfig({
  vite: {
    build: {
      assetsInlineLimit: 1024,
    }
  }
});
```

If you would rather all project styles remain external, you can configure the `inlineStylesheets` build option.

```js title="astro.config.mjs"

export default defineConfig({
  build: {
    inlineStylesheets: 'never'
  }
});
```

You can also set this option to `'always'` which will inline all stylesheets.

## Advanced

:::caution
Be careful when bypassing Astro's built-in CSS bundling! Styles won't be automatically included in the built output, and it is your responsibility to make sure that the referenced file is properly included in the final page output.
:::

### `?raw` CSS Imports

For advanced use cases, CSS can be read directly from disk without being bundled or optimized by Astro. This can be useful when you need complete control over some snippet of CSS, and need to bypass Astro's automatic CSS handling.

This is not recommended for most users.

```astro title="src/components/RawInlineStyles.astro" "?raw"
---
// Advanced example! Not recommended for most users.

---
<style is:inline set:html={rawStylesCSS}></style>
```

See  for full details.
### `?url` CSS Imports

For advanced use cases, you can import a direct URL reference for a CSS file inside of your project `src/` directory. This can be useful when you need complete control over how a CSS file is loaded on the page. However, this will prevent the optimization of that CSS file with the rest of your page CSS .

This is not recommended for most users. Instead, place your CSS files inside of `public/` to get a consistent URL reference.

:::caution
Importing a smaller CSS file with `?url` may return the base64 encoded contents of the CSS file as a data URL in your final build. Either write your code to support encoded data URLs (`data:text/css;base64,...`) or set the  config option to `0`  to disable this feature.
:::

```astro title="src/components/RawStylesUrl.astro" "?url"
---
// Advanced example! Not recommended for most users.

---
<link rel="preload" href={stylesUrl} as="style">
<link rel="stylesheet" href={stylesUrl}>
```

See  for full details.


[less]: https://lesscss.org/
[sass]: https://sass-lang.com/
[stylus]: https://stylus-lang.com/
[svelte-style]: https://svelte.dev/docs#component-format-style
[tailwind]: https://tailwindcss.com/docs/installation/framework-guides/astro
[vite-preprocessors]: https://vite.dev/guide/features.html#css-pre-processors
[vue-css-modules]: https://vue-loader.vuejs.org/guide/css-modules.html
[vue-scoped]: https://vue-loader.vuejs.org/guide/scoped-css.html
