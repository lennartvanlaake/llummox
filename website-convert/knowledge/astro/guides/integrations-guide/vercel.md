---
type: integration
title: '@astrojs/vercel'
description: Learn how to use the @astrojs/vercel adapter to deploy your Astro project.
sidebar:
  label: Vercel
githubIntegrationURL: 'https://github.com/withastro/astro/tree/main/packages/integrations/vercel/'
category: adapter
i18nReady: true
---



This adapter allows Astro to deploy your  to , including , , and .

If you're using Astro as a static site builder, you only need this adapter if you are using additional Vercel services (e.g. , ). Otherwise, you do not need an adapter to deploy your static site.

Learn how to deploy your Astro site in our .

## Why Astro Vercel?

 is a deployment platform that allows you to host your site by connecting directly to your GitHub repository. This adapter enhances the Astro build process to prepare your project for deployment through Vercel.

## Installation

Astro includes an `astro add` command to automate the setup of official integrations. If you prefer, you can  instead.

Add the Vercel adapter to enable on-demand rendering in your Astro project with the following `astro add` command. This will install `@astrojs/vercel` and make the appropriate changes to your `astro.config.mjs` file in one step.

<PackageManagerTabs>
  <Fragment slot="npm">
  ```sh
  npx astro add vercel
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```sh
  pnpm astro add vercel
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```sh
  yarn astro add vercel
  ```
  </Fragment>
</PackageManagerTabs>


Now, you can enable , or set your build output configuration to `output: 'server'` to .

### Manual Install

First, add the `@astrojs/vercel` adapter to your project’s dependencies using your preferred package manager:

<PackageManagerTabs>
  <Fragment slot="npm">
  ```sh
  npm install @astrojs/vercel
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```sh
  pnpm add @astrojs/vercel
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```sh
  yarn add @astrojs/vercel
  ```
  </Fragment>
</PackageManagerTabs>

Then, add the adapter to your `astro.config.*` file:

```js title="astro.config.mjs" ins={2, 6}


export default defineConfig({
  // ...
  adapter: vercel(),
});
```

## Usage

<ReadMore>Find out more about .</ReadMore>

You can deploy by CLI (`vercel deploy`) or by connecting your new repo in the . Alternatively, you can create a production build locally:

```sh
astro build
vercel deploy --prebuilt
```

## Configuration

To configure this adapter, pass an object to the `vercel()` function call in `astro.config.mjs`:

### `webAnalytics`

<p>

**Type:** `VercelWebAnalyticsConfig`<br/>
**Available for:** Serverless, Static<br/>
<Since v="3.8.0" pkg="@astrojs/vercel" />
</p>

With `@vercel/analytics@1.3.x` or earlier, you can set `webAnalytics: { enabled: true }` in your Astro config to inject Vercel’s tracking scripts into all of your pages.

For `@vercel/analytics@1.4.0` and later, use Vercel's Analytics component to enable  instead.

```js title="astro.config.mjs" ins={7-9}


export default defineConfig({
  // ...
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
```

### `imagesConfig`

<p>

**Type:** `VercelImageConfig`<br/>
**Available for:** Serverless, Static<br />
<Since v="3.3.0" pkg="@astrojs/vercel" />
</p>

Configuration options for . See  for a complete list of supported parameters.

The `domains` and `remotePatterns` properties will automatically be filled using .

```js title="astro.config.mjs" ins={8-10}


export default defineConfig({
  // ...
  output: 'static',
  adapter: vercel({
    imagesConfig: {
      sizes: [320, 640, 1280],
    },
  }),
});
```

### `imageService`

<p>

**Type:** `boolean`<br/>
**Available for:** Serverless, Static<br />
<Since v="3.3.0" pkg="@astrojs/vercel" />
</p>

When enabled, an  powered by the Vercel Image Optimization API will be automatically configured and used in production. In development, the image service specified by  will be used instead.

```js title="astro.config.mjs" ins={8}


export default defineConfig({
  // ...
  output: 'static',
  adapter: vercel({
    imageService: true,
  }),
});
```

```astro title="src/pages/index.astro"
---


---

<!-- This component -->
<Image src={astroLogo} alt="My super logo!" />

<!-- will become the following HTML -->
<img
  src="/_vercel/image?url=_astro/logo.hash.png&w=...&q=..."
  alt="My super logo!"
  loading="lazy"
  decoding="async"
  width="..."
  height="..."
/>
```

### `devImageService`

<p>

**Type:** `'sharp' | string`<br/>
**Default:** `sharp`<br />
**Available for:** Serverless, Static<br />
<Since v="3.8.0" pkg="@astrojs/vercel" />
</p>

Allows you to configure which image service to use in development when  is enabled. This can be useful if you cannot install Sharp's dependencies on your development machine, but using another image service like Squoosh would allow you to preview images in your dev environment. Build is unaffected and will always use Vercel's Image Optimization.

It can also be set to any arbitrary value in order to use a custom image service instead of Astro's built-in ones.

```js title="astro.config.mjs" ins={7-8}


export default defineConfig({
  // ...
  adapter: vercel({
    imageService: true,
    devImageService: 'sharp',
  }),
});
```

### `isr`

<p>

**Type:** `boolean | VercelISRConfig`<br/>
**Default:** `false`<br />
**Available for:** Serverless<br />
<Since v="7.2.0" pkg="@astrojs/vercel" />
</p>

Allows your project to be deployed as an  function, which caches your on-demand rendered pages in the same way as prerendered pages after first request. 

To enable this feature, set `isr` to true in your Vercel adapter configuration in `astro.config.mjs`:

```js title="astro.config.mjs" ins={7}


export default defineConfig({
  // ...
  adapter: vercel({
    isr: true,
  }),
});
```

Note that ISR function requests do not include search params, similar to  in static mode.

By default, Astro bundles your  into the ISR function. This means it only runs when that function runs: on a cache miss or a regeneration, not on a cache hit. If your middleware must run on every request, set  to deploy it in front of the cache. You can also add the relevant routes to  so the cache never applies to them.

#### ISR cache invalidation

By default, an ISR function caches for the duration of your deployment. You can further control caching by setting an expiration time, or by excluding particular routes from caching entirely.

##### Time-based invalidation

By default, when ISR is enabled, routes use  and any Cache-Control headers are ignored. Configuring an `expiration` value (in seconds) allows you to control how long routes are cached. This means Cache-Control directives set by your application are also respected.

The following example defines `expiration` to cache all pages on first request and save them for 1 day:

```js title="astro.config.mjs" {7-9}


export default defineConfig({
  // ...
  adapter: vercel({
    isr: {
      expiration: 60 * 60 * 24,
    },
  }),
});
```

##### On-demand invalidation

To programmatically invalidate cached pages, create a bypass token and provide it to the `isr` config:
```js title="astro.config.mjs" {6-9}


export default defineConfig({
    adapter: vercel({
        isr: {
            // A secret random string that you create.
            bypassToken: "005556d774a8",
        }
    })
})
```

You can then invalidate a cached page by sending a HEAD or GET request to the page URL with the `x-prerender-revalidate` header set to your bypass token. See  for details.


##### Draft mode

To bypass the ISR cache and render fresh content (e.g., for previewing unpublished CMS content), use . This requires  in your configuration and reusing its value in your pages to  named `__prerender_bypass`.

##### Excluding paths from caching

Use the `exclude` option to prevent specific routes from being cached by ISR. These paths will always be rendered fresh on each request:
```js title="astro.config.mjs" {6-13}


export default defineConfig({
    adapter: vercel({
        isr: {
            // Paths that will always be served fresh.
            exclude: [
                '/preview',
                '/auth/[page]',
                /^\/api\/.+/ // Regular expressions supported since @astrojs/vercel@v8.1.0
            ]
        }
    })
})
```

### `includeFiles`

<p>

**Type:** `string[]`<br/>
**Available for:** Serverless
</p>

Use this property to force files to be bundled with your function. This is helpful when you notice missing files.

```js title="astro.config.mjs" ins={7}


export default defineConfig({
  // ...
  adapter: vercel({
    includeFiles: ['./my-data.json'],
  }),
});
```

### `excludeFiles`

<p>

**Type:** `string[]`<br/>
**Available for:** Serverless
</p>

Use this property to exclude any files from the bundling process that would otherwise be included.

```js title="astro.config.mjs" ins={7}


export default defineConfig({
  // ...
  adapter: vercel({
    excludeFiles: ['./src/some_big_file.jpg'],
  }),
});
```

### `maxDuration`

<p>

**Type:** `number`<br/>
**Available for:** Serverless
</p>

Use this property to extend or limit the maximum duration (in seconds) that Serverless Functions can run before timing out. See the  for the default and maximum limit for your account plan.

```js title="astro.config.mjs" ins={7}


export default defineConfig({
// ...
  adapter: vercel({
    maxDuration: 60
  }),
});
```

### `skewProtection`

<p>

**Type:** `boolean`<br/>
**Available for:** Serverless<br />
<Since pkg="@astrojs/vercel" v="7.6.0" />
</p>

Use this property to enable  (available with Vercel Pro and Enterprise accounts).

```js title="astro.config.mjs" ins={7}


export default defineConfig({
// ...
  adapter: vercel({
    skewProtection: true
  }),
});
```

### `staticHeaders`

<p>
**Type:** `boolean`<br/>
**Default:** `false`<br />
**Available for:** Serverless <br/>
<Since pkg="@astrojs/vercel" v="10.0.0" />
</p>

Enables specifying custom headers for prerendered pages in Vercel's configuration.

If enabled, the adapter will save  when provided by Astro features, such as Content Security Policy.

For example, when  is enabled, `staticHeaders` can be used to add the CSP `headers` to your Vercel configuration, instead of creating a `<meta>` element:

```js title="astro.config.mjs" {9}


export default defineConfig({
  security: {
    csp: true
  },
  adapter: vercel({
    staticHeaders: true 
  })
});
```

### Running Astro middleware on Vercel Edge Functions

The `@astrojs/vercel` adapter can create an  from an Astro middleware in your code base. When `middlewareMode` is set to `'edge'`, an edge function will execute your middleware code for every request to an , including routes cached by . Static assets and prerendered pages are served from Vercel's filesystem and do not invoke your middleware.

By default, middleware bundled into the ISR function only runs on a cache miss or a regeneration. With `middlewareMode: 'edge'`, middleware runs in front of the ISR cache instead, so it also runs on cache hits. This means every request to a cached route triggers an edge function invocation.

For on-demand rendered pages, the `context.locals` object is serialized using JSON and sent in a header for the serverless function, which performs the rendering. As a security measure, the serverless function will refuse to serve requests with a `403 Forbidden` response unless they come from the generated edge function.

This is an opt-in feature. To enable it, set `middlewareMode` to `'edge'`:

```js title="astro.config.mjs" "middlewareMode: 'edge'"


export default defineConfig({
  // ...
  adapter: vercel({
    middlewareMode: 'edge',
  }),
});
```

The edge middleware has access to Vercel's  as `ctx.locals.vercel.edge`. If you’re using TypeScript, you can  by updating `src/env.d.ts` to use `EdgeLocals`:

```ts
type EdgeLocals = import('@astrojs/vercel').EdgeLocals

declare namespace App {
  interface Locals extends EdgeLocals {
    // ...
  }
}
```

### Sessions

The Astro  allows you to easily store user data between requests. This can be used for things like user data and preferences, shopping carts, and authentication credentials. Unlike cookie storage, there are no size limits on the data, and it can be restored on different devices. 

When using sessions on Vercel, you need to  for session storage. You can install a storage provider from .

For example, if you have installed  and linked a database to your site:

<Steps>

1. Install the `ioredis` package:
   <PackageManagerTabs>
     <Fragment slot="npm">
     ```sh
     npm install ioredis
     ```
     </Fragment>
     <Fragment slot="pnpm">
     ```sh
     pnpm install ioredis
     ```
     </Fragment>
     <Fragment slot="yarn">
     ```sh
     yarn add ioredis
     ```
     </Fragment>
   </PackageManagerTabs>

2. Use  to load your environment variables:
   ```sh
   vercel env pull .env.local
   ```
   This will create a `.env.local` file in your project root with the environment variables needed to connect to your Redis database when developing locally.

3. Configure the session driver:

    ```js title="astro.config.mjs" ins={6-11}
    import { defineConfig } from 'astro/config';
    import vercel from '@astrojs/vercel';

    export default defineConfig({
      adapter: vercel(),
      session: {
        driver: 'redis',
        options: {
          url: process.env.REDIS_URL,
        },
      },
    });
    ```

</Steps>

## Node.js Version Support

The `@astrojs/vercel` adapter supports specific Node.js versions for deploying your Astro project on Vercel. To view the supported Node.js versions on Vercel, click on the settings tab for a project and scroll down to "Node.js Version" section.

Check out the  to learn more.


[astro-integration]: /en/guides/integrations/
