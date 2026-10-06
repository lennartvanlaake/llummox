---
title: TypeScript
description: Learn how to use Astro's built-in TypeScript support.
i18nReady: true
---


```

This way, you avoid edge cases where Astro's bundler may try to incorrectly bundle your imported types as if they were JavaScript.

You can configure TypeScript to enforce type imports in your `tsconfig.json` file. Set  to `true`. TypeScript will check your imports and tell you when `import type` should be used. This setting is enabled by default in all our presets.

```json title="tsconfig.json" ins={3}
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

## Import Aliases

Astro supports import aliases that you define in your `tsconfig.json` `paths` configuration.  to learn more.

```astro title="src/pages/about/nate.astro" "@components" "@layouts"
---


---
```

```json title="tsconfig.json" {4-5}
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["./src/components/*"],
      "@layouts/*": ["./src/layouts/*"]
    }
  }
}
```

## Extending global types

You can create `src/env.d.ts` as a convention for adding custom types declarations, or to benefit from Astro types if you don't have a `tsconfig.json`:

```ts title="src/env.d.ts"
// Custom types declarations
declare var myString: string;

// Astro types, not necessary if you already have a `tsconfig.json`
/// <reference path="../.astro/types.d.ts" />
```

### `window` and `globalThis`

You may want to add a property to the global object. You can do this by adding top-level declarations using the `declare` keyword to your `env.d.ts` file:

```ts title="src/env.d.ts"
declare var myString: string;
declare function myFunction(): boolean;
```

This will provide typing to `globalThis.myString` and `globalThis.myFunction`, as well as `window.myString` and `window.myFunction`.

Note that `window` is only available in client-side code. `globalThis` is available both server-side and client-side, but its server-side value won't be shared with the client.

If you only want to type a property on the `window` object, provide a `Window` interface instead:

```ts title="src/env.d.ts"
interface Window {
	myFunction(): boolean;
}
```

### Add non-standard attributes

You may want to define a type for custom attributes or CSS properties. You can extend the default JSX definitions to add non-standard attributes by redeclaring the `astroHTML.JSX` namespace in a `.d.ts` file.

```ts title="src/env.d.ts"
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    "data-count"?: number;
    "data-label"?: string;
  }

  // Add a CSS custom property to the style object
  interface CSSProperties {
    "--theme-color"?: "black" | "white";
  }
}
```

:::note
`astroHTML` is injected globally inside `.astro` components. To use it in TypeScript files, use a :

```ts
/// <reference types="astro/astro-jsx" />

type MyAttributes = astroHTML.JSX.ImgHTMLAttributes;
```
:::

### Using imports

You may want to extend global types by reusing types declared elsewhere in your project or from an external library. To do this, use :

```ts title="src/env.d.ts"
type Product = {
  id: string;
  name: string;
  price: number;
};

declare namespace App {
  interface Locals {
    orders: Map<string, Product[]>
    session: import("./lib/server/session").Session | null;
    user: import("my-external-library").User;
  }
}
```

A `.d.ts` file is an  declaration. While its syntax is similar to ES modules, these files do not allow top-level imports/exports. If TypeScript encounters one, the file will be considered a  and this will break your global types.

## Component Props

Astro supports typing your component props via TypeScript. To enable, add a TypeScript `Props` interface to your component frontmatter. An `export` statement may be used, but is not necessary. The  will automatically look for the `Props` interface and give you proper TS support when you use that component inside another template.

```astro title="src/components/HelloProps.astro" ins={2-5}
---
interface Props {
  name: string;
  greeting?: string;
}

const { greeting = "Hello", name } = Astro.props;
---
<h2>{greeting}, {name}!</h2>
```

### Common prop type patterns

- If your component takes no props or slotted content, you can use `type Props = Record<string, never>`.
- If your component must be passed children to its default slot, you can enforce this by using `type Props = { children: any; };`.

## Type Utilities

<p><Since v="1.6.0" /></p>

Astro comes with some built-in utility types for common prop type patterns. These are available under the `astro/types` entrypoint.

### Built-in HTML attributes

Astro provides the `HTMLAttributes` type to check that your markup is using valid HTML attributes. You can use these types to help build component props.

For example, if you were building a `<Link>` component, you could do the following to mirror the default HTML attributes for `<a>` tags in your component’s prop types.

```astro title="src/components/Link.astro" ins="HTMLAttributes" ins="HTMLAttributes<'a'>"
---

// use a `type`
type Props = HTMLAttributes<"a">;

// or extend with an `interface`
interface Props extends HTMLAttributes<"a"> {
  myProp?: boolean;
}

const { href, ...attrs } = Astro.props;
---
<a href={href} {...attrs}>
  <slot />
</a>
```

### `ComponentProps` type

<p><Since v="4.3.0" /></p>

This type export allows you to reference the `Props` accepted by another component, even if that component doesn't export that `Props` type directly.

The following example shows using the `ComponentProps` utility from `astro/types` to reference a `<Button />` component's `Props` types:

```astro title="src/pages/index.astro"
---


type ButtonProps = ComponentProps<typeof Button>;
---
```

### Polymorphic type

<p><Since v="2.5.0" /></p>

Astro includes a helper to make it easier to build components that can render as different HTML elements with full type safety. This is useful for components like `<Link>` that can render as either `<a>` or `<button>` depending on the props passed to it.

The example below implements a fully-typed, polymorphic component that can render as any HTML element. The  type is used to ensure that the `as` prop is a valid HTML element.

```astro
---

type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }>;

const { as: Tag, ...props } = Astro.props;
---
<Tag {...props} />
```

### Infer `getStaticPaths()` types

<p><Since v="2.1.0" /></p>

Astro includes helpers for working with the types returned by your  function for dynamic routes.

You can get the type of  with `InferGetStaticParamsType` and the type of  with `InferGetStaticPropsType` or you can use `GetStaticPaths` to infer both at once:

```astro title="src/pages/posts/[...id].astro" {2-6,19-20} "satisfies GetStaticPaths;"
---


export const getStaticPaths = (async () => {
  const posts = await getCollection("blog");
  return posts.map((post) => {
    return {
      params: { id: post.id },
      props: { draft: post.data.draft, title: post.data.title },
    };
  });
}) satisfies GetStaticPaths;

type Params = InferGetStaticParamsType<typeof getStaticPaths>;
type Props = InferGetStaticPropsType<typeof getStaticPaths>;

const { id } = Astro.params;
//                   ^? { id: string; }

const { title } = Astro.props;
//                      ^? { draft: boolean; title: string; }
---
```

## Type checking

To see type errors in your editor, please make sure that you have the  installed. Please note that the `astro start` and `astro build` commands will transpile the code with esbuild, but will not run any type checking. To prevent your code from building if it contains TypeScript errors, change your "build" script in `package.json` to the following:

```json title="package.json" del={3} ins={4} ins="astro check &&"
{
  "scripts": {
    "build": "astro build",
    "build": "astro check && astro build",
  },
}
```

:::note
`astro check` checks all the files included in your TypeScript project. To check types within Svelte and Vue files, you can use the  and the  packages respectively.
:::

import ReadMore from '~/components/ReadMore.astro'

<ReadMore>Read more about  in Astro.</ReadMore>

<ReadMore>Read more about .</ReadMore>

## Troubleshooting

### Errors typing multiple JSX frameworks at the same time

An issue may arise when using multiple JSX frameworks in the same project, as each framework requires different, sometimes conflicting, settings inside `tsconfig.json`.

**Solution**: Set the  to `react` (default), `preact` or `solid-js` depending on your most-used framework. Then, use a  inside any conflicting file from a different framework.

For the default setting of `jsxImportSource: react`, you would use:

```jsx
// For Preact
/** @jsxImportSource preact */

// For Solid
/** @jsxImportSource solid-js */
```
