---
type: integration
title: '@astrojs/netlify'
description: Learn how to use the @astrojs/netlify adapter to deploy your Astro project.
sidebar:
  label: Netlify
githubIntegrationURL: 'https://github.com/withastro/astro/tree/main/packages/integrations/netlify/'
category: adapter
i18nReady: true
---

This adapter allows Astro to deploy your  to , including , , and .

If you're using Astro as a static site builder, you only need this adapter if you are using additional Netlify services that require a server (e.g. ). Otherwise, you do not need an adapter to deploy your static site.

Learn how to deploy your Astro site in our .

## Why Astro Netlify

 is a deployment platform that allows you to host your site by connecting directly to your GitHub repository. This adapter enhances the Astro build process to prepare your project for deployment through Netlify.

## Installation

Astro includes an `astro add` command to automate the setup of official integrations. If you prefer, you can  instead.

Add the Netlify adapter to enable on-demand rendering in your Astro project with the `astro add` command. 
This will install `@astrojs/netlify` and make the appropriate changes to your `astro.config.mjs` file in one step.

<PackageManagerTabs>
  <Fragment slot="npm">
  ```sh
  npx astro add netlify
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```sh
  pnpm astro add netlify
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```sh
  yarn astro add netlify
  ```
  </Fragment>
</PackageManagerTabs>

Now, you can enable , or set your build output configuration to `output: 'server'` to .

### Manual Install

First, install the Netlify adapter to your project’s dependencies using your preferred package manager:

<PackageManagerTabs>
  <Fragment slot="npm">
  ```sh
  npm install @astrojs/netlify
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```sh
  pnpm add @astrojs/netlify
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```sh
  yarn add @astrojs/netlify
  ```
  </Fragment>
</PackageManagerTabs>

Then, add the adapter to your `astro.config.*` file:

   ```js title="astro.config.mjs" ins={2, 6}
    import { defineConfig } from 'astro/config';
    import netlify from '@astrojs/netlify';

    export default defineConfig({
       // ...
       adapter: netlify(),
    });
   ```

## Usage



Follow the instructions to . After building, you will have a `.netlify/` folder containing both  in the `.netlify/functions-internal/` folder and  in the`.netlify/edge-functions/` folder.

To deploy your site, install the  and run:

```sh
netlify deploy
```

The  and the  provide more information on how to use this integration to deploy to Netlify.

### Running Astro middleware on Netlify Edge Functions

By default, Astro middleware is applied to pre-rendered pages at build-time and to on-demand-rendered pages at runtime.

To implement redirects, access control, or custom response headers for pre-rendered pages, run your middleware on Netlify Edge Functions by setting the  to `edge`:

```js title="astro.config.mjs" ins={7}


export default defineConfig({
  // ...
  adapter: netlify({
    middlewareMode: 'edge',
  }),
});
```

When `middlewareMode` is set to `'edge'`, an edge function will execute your middleware code for all requests, including static assets, prerendered pages, and on-demand rendered pages.

For on-demand rendered pages, the `context.locals` object is serialized using JSON and sent in a header for the serverless function, which performs the rendering. As a security measure, the serverless function will refuse to serve requests with a `403 Forbidden` response unless they come from the generated edge function.

### Accessing edge context from your site

Netlify Edge Functions provide a  that includes metadata about the request such as a user’s IP, geolocation data, and cookies.

This can be accessed through the `Astro.locals.netlify.context` object:

```astro
---
const {
  geo: { city },
} = Astro.locals.netlify.context;
---

<h1>Hello there, friendly visitor from {city}!</h1>
```

If you're using TypeScript, you can  by updating `src/env.d.ts` to use `NetlifyLocals`:

```ts title="src/env.d.ts"
type NetlifyLocals = import('@astrojs/netlify').NetlifyLocals

declare namespace App {
  interface Locals extends NetlifyLocals {
    // ...
  }
}
```

This is not available on prerendered pages.

### Netlify Image CDN support

This adapter by default uses the  to transform images on-the-fly without impacting build times.
It's implemented using an  under the hood.

To opt out of Netlify's Image CDN remote image optimization, use the `imageCDN` option:

```js title="astro.config.mjs" ins={7}


export default defineConfig({
  // ...
  adapter: netlify({
    imageCDN: false,
  }),
});
```

If you are using images hosted on another domain, you must authorize the domain or URL patterns using the  or  configuration options:

```js title="astro.config.mjs" ins={7-9}


export default defineConfig({
    // ...
    adapter: netlify(),
    image: {
      domains: ['example.com'],
    },
});
```
For more information, see . This is not required for images hosted on the same domain as your site.

### Static sites with the Netlify Adapter

For static sites (`output: 'static'`) hosted on Netlify, you usually don't need an adapter. However, some deployment features are only available through an adapter.

Static sites will need to install this adapter to use and configure Netlify's .

If you use `redirects` configuration in your Astro config, the Netlify adapter can be used to translate this to the proper `_redirects` format.

```js title="astro.config.mjs"


export default defineConfig({
  // ...
  adapter: netlify(),
  redirects: {
    '/blog/old-post': '/blog/new-post',
  },
});
```

Once you run `astro build` there will be a `dist/_redirects` file. Netlify will use that to properly route pages in production.

:::note
You can still include a `public/_redirects` file for manual redirects. Any redirects you specify in the redirects config are appended to the end of your own.
:::

### Sessions

The Astro  allows you to easily store user data between requests. This can be used for things like user data and preferences, shopping carts, and authentication credentials. Unlike cookie storage, there are no size limits on the data, and it can be restored on different devices. 

Astro automatically configures  for session storage when using the Netlify adapter. If you would prefer to use a different session storage driver, you can specify it in your Astro config. See  for more details.

If your project does not use sessions, you can set  in your Astro config. The adapter will not configure Netlify Blobs for session storage, and the session runtime will be excluded from your function bundle.

### Caching Pages

On-demand rendered pages without any dynamic content can be cached to improve performance and lower resource usage.
Enabling the `cacheOnDemandPages` option in the adapter will cache all server-rendered pages for up to one year:

```ts title="astro.config.mjs" ins={4}
export default defineConfig({
  // ...
  adapter: netlify({
    cacheOnDemandPages: true,
  }),
});
```

This can be changed on a per-page basis by adding caching headers to your response:

```astro title="pages/index.astro"
---

Astro.response.headers.set('CDN-Cache-Control', 'public, max-age=45, must-revalidate');
---

<Layout title="Astro on Netlify">
  {new Date()}
</Layout>
```

With , Netlify supports
standard caching headers like `CDN-Cache-Control` or `Vary`.
Refer to the docs to learn about implementing e.g. time to live (TTL) or stale while revalidate (SWR) caching: https://docs.netlify.com/platform/caching

### Skew Protection

<p><Since v="6.6.0" pkg="@astrojs/netlify" /></p>

Netlify's skew protection ensures that users accessing your site during a deployment continue to receive content from the same deploy version. The Netlify adapter automatically configures skew protection for Astro features like actions, server islands, view transitions, and prefetch requests by injecting the current deploy ID into internal requests. This prevents version mismatches between the client and server during active deployments.

While Astro automatically adds the skew protection header for its built-in features, if you are making your own fetch requests to your site, you can include the header manually using the `DEPLOY_ID` environment variable:

```js
const response = await fetch('/api/endpoint', {
  headers: {
    'X-Netlify-Deploy-ID': import.meta.env.DEPLOY_ID,
  },
});
```

### Including or excluding files from Netlify Functions

When deploying an Astro site with on-demand rendering to Netlify, the generated functions automatically trace and include server dependencies. However, you may need to customize which files are included in your Netlify Functions.

#### `includeFiles`

<p>
**Type:**  `string[]`<br />
**Default:** `[]`<br />
<Since v="5.3.0" />
</p>

The `includeFiles` property allows you to explicitly specify additional files that should be bundled with your function. This is useful for files that aren't automatically detected as dependencies, such as:
- Data files loaded using `fs` operations
- Configuration files
- Template files

Provide an array of additional files to include with file paths relative to your project's . Absolute paths may not work as expected.

```js title="astro.config.mjs" ins={7}


export default defineConfig({
  // ...
  adapter: netlify({
    includeFiles: ['./my-data.json'], // relative to `root`
  }),
});
```

#### `excludeFiles`

<p>
**Type:**  `string[]`<br />
**Default:** `[]`<br />
<Since v="5.3.0" />
</p>

You can use the `excludeFiles` property to prevent specific files from being bundled that would otherwise be included. This is helpful for:
- Reducing bundle size
- Excluding large binaries
- Preventing unwanted files from being deployed

Provide an array of specific files to exclude with file paths relative to your project's . Absolute paths may not work as expected.

```js title="astro.config.mjs" ins={7}


export default defineConfig({
  // ...
  adapter: netlify({
    excludeFiles: ['./src/some_big_file.jpg'], // relative to `root`
  }),
});
```

#### Using glob patterns

Both `includeFiles` and `excludeFiles` support  for matching multiple files:

```js title="astro.config.mjs" ins={7, 10-11}


export default defineConfig({
  adapter: netlify({
    includeFiles: [
      './data/**/*.json'
    ],
    excludeFiles: [
      './node_modules/package/**/*',
      './src/**/*.test.js'
    ]
  }),
});
```

### Local development features

When running `astro dev`, the adapter enables several Netlify platform features to ensure the environment matches production as closely as possible. These include:

- A local  server. This is used for  by default.
- A local  server. This is used for  by default
-  and  from your Netlify config
- Access to  in on-demand pages
- Emulation of  defined in your project's `netlify/edge-functions` directory
-  from your Netlify site

These work best when your local site is  using `netlify link`.

You can enable or disable some of these features using the  option in your adapter configuration. By default, all features are enabled except for environment variables.

#### `devFeatures`

<p>
**Type:** `boolean | object`<br />
**Default:** `{ images: true, environmentVariables: false, edgeFunctions: true }`<br />
<Since v="6.5.1" pkg="@astrojs/netlify"/>
</p>

The `devFeatures` option can be either a boolean to enable or disable all features, or an object to enable specific features.

```js title="astro.config.mjs" ins={7-14}


export default defineConfig({
  // ...
  adapter: netlify({
    devFeatures: {
      // Enable Netlify Image CDN support in dev. Defaults to true.
      images: false, 
      // Inject Netlify environment variables in dev. Defaults to false.
      environmentVariables: true, 
      // Emulate Netlify Edge Functions in dev. Defaults to true.
      edgeFunctions: false,
    },
  }),
});
```

##### `devFeatures.images`

<p>
**Type:** `boolean`<br />
**Default:** `true`<br />
<Since v="6.5.1" pkg="@astrojs/netlify"/>
</p>

Enables support for the local  in development.

This uses a local version of the Netlify Image CDN, rather than the default Astro image service. 

##### `devFeatures.environmentVariables`

<p>
**Type:** `boolean`<br />
**Default:** `false`<br />
<Since v="6.5.1" pkg="@astrojs/netlify"/>
</p>

Injects environment variables from your Netlify site into the development environment.

This allows you to use the same values in development as you would in production. See  for more information, including how to use different variables for different environments.

##### `devFeatures.edgeFunctions`

<p>
**Type:** `boolean`<br />
**Default:** `true`<br />
<Since v="8.1.0" pkg="@astrojs/netlify"/>
</p>

Emulates  defined in your project's `netlify/edge-functions` directory during development.

Some npm packages that access the filesystem when they are initialized do not work inside the edge function sandbox and fail with an error such as `Reading or writing files with Edge Functions is not supported yet`. If you encounter these errors, set `edgeFunctions` to `false` to disable edge function emulation and use `netlify dev` instead. Edge functions will still work in production builds.

### `staticHeaders`

<p>
  **Type:** `boolean` <br />
  **Default:** `false`<br />
  <Since v="7.0.0"  pkg="@astrojs/netlify"/>
</p>

Enables specifying custom headers for prerendered pages in Netlify's configuration.

If enabled, the adapter will save  when provided by Astro features, such as Content Security Policy.

For example, when  is enabled, `staticHeaders` can be used to add the CSP `headers` to your Netlify configuration, instead of creating a `<meta>` element:

```js title="astro.config.mjs" {9}


export default defineConfig({
  security: {
    csp: true
  },
  adapter: netlify({
    staticHeaders: true 
  })
});
```

## Examples

* The  provides an example and a guide in the README.

*  for more examples!


[astro-integration]: /en/guides/integrations/
