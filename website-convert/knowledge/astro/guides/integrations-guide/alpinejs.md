---
type: integration
title: '@astrojs/alpinejs'
description: Learn how to use the @astrojs/alpinejs framework integration to extend component support in your Astro project.
sidebar:
  label: Alpine.js
githubIntegrationURL: 'https://github.com/withastro/astro/tree/main/packages/integrations/alpinejs/'
category: renderer
i18nReady: true
---


This **[Astro integration][astro-integration]** adds  to your project so that you can use Alpine.js anywhere on your page.

## Installation

Astro includes an `astro add` command to automate the setup of official integrations. If you prefer, you can  instead.

To install `@astrojs/alpinejs`, run the following from your project directory and follow the prompts:

<PackageManagerTabs>
  <Fragment slot="npm">
    ```sh
    npx astro add alpinejs
    ```
  </Fragment>
  <Fragment slot="pnpm">
    ```sh
    pnpm astro add alpinejs
    ```
  </Fragment>
  <Fragment slot="yarn">
    ```sh
    yarn astro add alpinejs
    ```
  </Fragment>
</PackageManagerTabs>

If you run into any issues,  and try the manual installation steps below.

### Manual Install

First, install the `@astrojs/alpinejs` package.

<PackageManagerTabs>
  <Fragment slot="npm">
    ```sh
    npm install @astrojs/alpinejs
    ```
  </Fragment>
  <Fragment slot="pnpm">
    ```sh
    pnpm add @astrojs/alpinejs
    ```
  </Fragment>
  <Fragment slot="yarn">
    ```sh
    yarn add @astrojs/alpinejs
    ```
  </Fragment>
</PackageManagerTabs>

Most package managers will install associated peer dependencies as well. However, if you see a `Cannot find package 'alpinejs'` (or similar) warning when you start up Astro, you'll need to manually install Alpine.js yourself:

<PackageManagerTabs>
  <Fragment slot="npm">
  ```sh
  npm install alpinejs @types/alpinejs
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```sh
  pnpm add alpinejs @types/alpinejs
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```sh
  yarn add alpinejs @types/alpinejs
  ```
  </Fragment>
</PackageManagerTabs>

Then, apply the integration to your `astro.config.*` file using the `integrations` property:

```js ins="alpinejs()" title="astro.config.mjs" ins={2}


export default defineConfig({
  // ...
  integrations: [alpinejs()],
});
```

## Configuration Options

### `entrypoint`

<p>

**Type:** `string`<br />
<Since v="0.4.0" pkg="@astrojs/alpinejs" />
</p>

You can extend Alpine by setting the `entrypoint` option to a root-relative import specifier (e.g. `entrypoint: "/src/entrypoint"`).

The default export of this file should be a function that accepts an Alpine instance prior to starting. This allows the use of custom directives, plugins and other customizations for advanced use cases.

```js title="astro.config.mjs"


export default defineConfig({
  // ...
  integrations: [alpinejs({ entrypoint: '/src/entrypoint' })],
});
```

```js title="src/entrypoint.ts"

}
```

## Examples

* The  shows how to use Alpine.js in an Astro project.

[astro-integration]: /en/guides/integrations/

[astro-ui-frameworks]: /en/guides/framework-components/#using-framework-components
