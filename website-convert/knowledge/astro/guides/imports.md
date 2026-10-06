---
title: Imports reference
description: Learn how to import different file types into your Astro project.
i18nReady: true
---


```

JavaScript can be imported using normal ESM `import` & `export` syntax.

:::note[Importing JSX files]

An appropriate  (, , or ) is required to render JSX/TSX files.
Use `.jsx`/`.tsx` extensions where appropriate, as Astro does not support JSX in `.js`/`.ts` files.

:::

### TypeScript

```js


```

Astro includes built-in support for . You can import `.ts` and `.tsx` files directly in your Astro project, and even write TypeScript code directly inside your  and any .

**Astro doesn't perform any type checking itself.** Type checking should be taken care of outside of Astro, either by your IDE or through a separate script. For type checking Astro files, the  is provided.

:::note[TypeScript and file extensions]
Per , `.ts` and `.tsx` file extensions should not be used when importing TypeScript files. Instead, either use `.js`/`.jsx` file extensions or completely omit the file extension.

```ts

---
```
If a package was published using a legacy format, Astro will try to convert the package to ESM so that `import` statements work. In some cases, you may need to adjust your  for it to work.

:::caution
Some packages rely on a browser environment. Astro components runs on the server, so importing these packages in the frontmatter may .
:::

### JSON

```js
// Load the JSON object via the default export

```

Astro supports importing JSON files directly into your application. Imported files return the full JSON object in the default import.

### CSS

```js
// Load and inject 'style.css' onto the page

```

Astro supports importing CSS files directly into your application. Imported styles expose no exports, but importing one will automatically add those styles to the page. This works for all CSS files by default, and can support compile-to-CSS languages like Sass & Less via plugins.

<ReadMore>Read more about advanced CSS import use cases such as a direct URL reference for a CSS file, or importing CSS as a string in the .</ReadMore>

### CSS Modules

```astro
---
// 1. Converts './style.module.css' classnames to unique, scoped values.
// 2. Returns an object mapping the original classnames to their final, scoped value.

---

{/* This example uses Astro, but you can use CSS Modules with any framework. */}
<div class={styles.error}>Your Error Message</div>
```

Astro supports CSS Modules using the `[name].module.css` naming convention. Like any CSS file, importing one will automatically apply that CSS to the page. However, CSS Modules export a special default `styles` object that maps your original classnames to unique identifiers.

CSS Modules help you enforce component scoping & isolation on the frontend with uniquely-generated class names for your stylesheets.

### Other assets

```astro
---
// Returns an object with `src` and other properties


---

{/* HTML or UI Framework components use this to render the image */}
<img src={imgReference.src} alt="image description" />

{/* The Astro `<Image />` and `<Picture />` components access `src` by default */}
<Image src={imgReference} alt="image description">
```

All other assets not explicitly mentioned above can be imported via ESM `import` and will return a URL reference to the final built asset (e.g. `/_astro/my-video.C7vXpQtF.mp4`) instead of an object.

This can be useful for referencing non-JS assets by URL, like creating a video element with a `src` attribute pointing to that image.

It can also be useful to place images and other assets in the `public/` folder as explained on the .

<ReadMore>Read more about appending Vite import parameters (e.g. `?url`, `?raw`) in .</ReadMore>

:::note
Adding **alt text** to `<img>` tags is encouraged for accessibility! Don't forget to add an `alt="a helpful description"` attribute to your image elements. You can just leave the attribute empty if the image is purely decorative.
:::

## Aliases

An **alias** is a way to create shortcuts for your imports.

Aliases can help improve the development experience in codebases with many directories or relative imports.

```astro title="src/pages/about/company.astro" del="../../components" del="../../assets"
---


---
```

In this example, a developer would need to understand the tree relationship between `src/pages/about/company.astro`, `src/components/controls/Button.astro`, and `src/assets/logo.png`. And then, if the `company.astro` file were to be moved, these imports would also need to be updated.

You can add import aliases in `tsconfig.json`.

```json title="tsconfig.json" ins={4-5}
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["./src/components/*"],
      "@assets/*": ["./src/assets/*"]
    }
  }
}
```

The development server will automatically restart after this configuration change. You can now import using the aliases anywhere in your project:

```astro title="src/pages/about/company.astro" ins="@components" ins="@assets"
---


---
```

## `import.meta.glob()`

 is a way to import many files at once using glob patterns to find matching file paths.

`import.meta.glob()` takes a relative  matching the local files you'd like to import as a parameter. It returns an array of each matching file's exports. To load all matched modules up front, pass `{ eager: true }` as the second argument:

```astro title="src/components/my-component.astro" {3,4}
---
// imports all files that end with `.md` in `./src/pages/post/`
const matches = import.meta.glob("../pages/post/*.md", { eager: true });
const posts = Object.values(matches);
---

<!-- Renders an <article> for the first 5 blog posts -->
<div>
  {
    posts.slice(0, 5).map((post: any) => (
      <article>
        <h2>{post.frontmatter.title}</h2>
        <p>{post.frontmatter.description}</p>
        <a href={post.url}>Read more</a>
      </article>
    ))
  }
</div>
```

Astro components imported using `import.meta.glob` are of type . You can render each component instance using its `default` property:

```astro title="src/pages/component-library.astro" {14}
---

// imports all files that end with `.astro` in `./src/components/`
const components: AstroInstance[] = Object.values(
  import.meta.glob("../components/*.astro", { eager: true }),
);
---

{/* Display all of our components */}
{
  components.map((component) => (
    <div>
      <component.default size={24} />
    </div>
  ))
}
```

### Supported values

Vite's `import.meta.glob()` function only supports static string literals. It does not support dynamic variables and string interpolation.

A common workaround is to instead import a larger set of files that includes all the files you need, then filter them:

```astro {5-10} title="src/components/featured.astro"
---
const { postSlug } = Astro.props;
const pathToMyFeaturedPost = `src/pages/blog/${postSlug}.md`;

const posts = Object.values(
  import.meta.glob("../pages/blog/*.md", { eager: true }),
);
const myFeaturedPost: any = posts.find((post: any) =>
  post.file.includes(pathToMyFeaturedPost),
);
---

<p>
  Take a look at my favorite post, <a href={myFeaturedPost.url}
    >{myFeaturedPost.frontmatter.title}</a
  >!
</p>
```

### Import type utilities

#### Markdown files

Markdown files loaded with `import.meta.glob()` return the following `MarkdownInstance` interface:

```ts
export interface MarkdownInstance<T extends Record<string, any>> {
  /* Any data specified in this file's YAML/TOML frontmatter */
	frontmatter: T;
  /* The absolute file path of this file */
	file: string;
  /* The rendered path of this file */
	url: string | undefined;
  /* Astro Component that renders the contents of this file */
	Content: AstroComponentFactory;
  /** (Markdown only) Raw Markdown file content, excluding layout HTML and YAML/TOML frontmatter */
	rawContent(): string;
  /** (Markdown only) Markdown file compiled to HTML, excluding layout HTML */
	compiledContent(): string;
  /* Function that returns an array of the h1...h6 elements in this file */
	getHeadings(): Promise<{ depth: number; slug: string; text: string }[]>;
	default: AstroComponentFactory;
}
```

You can optionally provide a type for the `frontmatter` variable using a TypeScript generic.

```astro
---

interface Frontmatter {
    title: string;
    description?: string;
}

const posts = Object.values(import.meta.glob<MarkdownInstance<Frontmatter>>('./posts/**/*.md', { eager: true }));
---

<ul>
  {posts.map(post => <li>{post.frontmatter.title}</li>)}
</ul>
```

#### Astro files

Astro files have the following interface:

```ts
export interface AstroInstance {
  /* The file path of this file */
  file: string;
  /* The URL for this file (if it is in the pages directory) */
	url: string | undefined;
	default: AstroComponentFactory;
}
```

#### Other files

Other files may have various different interfaces, but `import.meta.glob()` accepts a TypeScript generic if you know exactly what an unrecognized file type contains.

```ts
---
interface CustomDataFile {
  default: Record<string, any>;
}
const data = import.meta.glob<CustomDataFile>('../data/**/*.js');
---
```

### Glob patterns

A glob pattern is a file path that supports special wildcard characters. This is used to reference multiple files in your project at once.

For example, the glob pattern `./pages/**/*.{md,mdx}` starts within the pages subdirectory, looks through all of its subdirectories (`/**`), and matches any filename (`/*`) that ends in either `.md` or `.mdx` (`.{md,mdx}`).

#### Glob patterns in Astro

To use with `import.meta.glob()`, the glob pattern must be a string literal and cannot contain any variables.

Additionally, glob patterns must begin with one of the following:
- `./` (to start in the current directory)
- `../` (to start in the parent directory)
- `/` (to start at the root of the project)
 
.

### `import.meta.glob()` vs `getCollection()`

 provide  for loading multiple files instead of `import.meta.glob()`. Use `getCollection()` and `getLiveCollection()` to query your collections and return content entries.

## WASM

```js
// Loads and initializes the requested WASM file
const wasm = await WebAssembly.instantiateStreaming(fetch('/example.wasm'));
```

Astro supports loading WASM files directly into your application using the browser’s  API.


## Node builtins

Astro supports Node.js built-ins, with some limitations, using Node’s newer `node:` prefix. There may be differences between development and production, and some features may be incompatible with on-demand rendering. Some  may also be incompatible with these built-ins modules or require configuration to support a subset (e.g.,  or ).

The following example imports the `util` module from Node to parse a media type (MIME):

```astro title="src/components/MyComponent.astro"
---
// Example: import the "util" built-in from Node.js

export interface Props {
  mimeType: string,
}

const mime = new util.MIMEType(Astro.props.mimeType)
---

<span>Type: {mime.type}</span>
<span>SubType: {mime.subtype}</span>
```

## Extending file type support

With **Vite** and compatible **Rollup** plugins, you can import file types which aren't natively supported by Astro. Learn where to find the plugins you need in the  section of the Vite Documentation.

:::note[Plugin configuration]
Refer to your plugin's documentation for configuration options, and how to correctly install it.
:::

<RecipeLinks slugs={["en/recipes/add-yaml-support"]} />
