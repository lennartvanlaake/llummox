---
title: EmDash & Astro
description: Add content to your Astro project using EmDash as a CMS
sidebar:
  label: EmDash
type: cms
logo: emdash
i18nReady: true
---


 is an open-source, full-stack CMS built specifically for Astro, adding database-backed content, an admin UI, a media library, menus, and taxonomies to your site.

:::tip
To start a **new Astro + EmDash project from scratch**, use the EmDash CLI to generate a pre-wired project:

<PackageManagerTabs>
  <Fragment slot="npm">
  ```shell
  npm create emdash@latest
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```shell
  pnpm create emdash@latest
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```shell
  yarn create emdash@latest
  ```
  </Fragment>
</PackageManagerTabs>
:::

## Integrating with Astro

EmDash runs within your Astro project and relies on a database. You can access the admin interface at `/_emdash/admin` to edit content. Your pages will display it by querying the database using .

This guide uses the  and a local SQLite database. See the .

## Prerequisites

- An existing Astro project (Astro 6 or later) configured  and .
- Node.js v22.16.0 or higher.

## Installing dependencies

React powers the EmDash admin interface and is a required dependency. If your project does not use React, install it using the `astro add` command for your package manager:

<PackageManagerTabs>
  <Fragment slot="npm">
  ```shell
  npx astro add react
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```shell
  pnpm astro add react
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```shell
  yarn astro add react
  ```
  </Fragment>
</PackageManagerTabs>

You also need to install the EmDash package:

<PackageManagerTabs>
  <Fragment slot="npm">
  ```shell
  npm install emdash
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```shell
  pnpm add emdash
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```shell
  yarn add emdash
  ```
  </Fragment>
</PackageManagerTabs>

## Adding the integration

Add the `emdash()` integration to your Astro config file, and configure a database and a media storage backend:

```js title="astro.config.mjs" ins={4-5, 12-18}





export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: "file:./data.db" }),
      storage: local({
        directory: "./uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
    }),
  ],
});
```

## Adding the live collections loader

Create a `src/live.config.ts` file so that Astro's content layer can resolve EmDash content:

```ts title="src/live.config.ts"


export const collections = {
  _emdash: defineLiveCollection({ loader: emdashLoader() }),
};
```

The `_emdash` collection internally routes to your content types (e.g. posts and pages). Any existing file-based collections in `src/content.config.ts` keep working alongside it.

## Running EmDash locally

EmDash requires you to complete the setup wizard before testing your own pages. Until the setup is complete, there is no published content and queries return empty results.

<Steps>
1. Start Astro's dev server to initialize the database and launch the admin UI:

    <PackageManagerTabs>
      <Fragment slot="npm">
      ```shell
      npm run dev
      ```
      </Fragment>
      <Fragment slot="pnpm">
      ```shell
      pnpm run dev
      ```
      </Fragment>
      <Fragment slot="yarn">
      ```shell
      yarn run dev
      ```
      </Fragment>
    </PackageManagerTabs>

    On first run, EmDash creates `data.db` with its schema and two default collections, `pages` and `posts`.

2. Visit `http://localhost:4321/_emdash/admin` in the browser. EmDash redirects you to the setup wizard.

3. In the **Site** step, enter a site title and an optional tagline.

4. In the **Account** step, enter your email address and name. This creates the administrator account.

5. In the **Sign In** step, secure your account. Choose **Create Passkey** to register a passkey with your device's biometric authentication, security key, or PIN.

6. Sign in with your new passkey to reach the dashboard.
</Steps>

## Creating your first post

<Steps>
1. In the dashboard, click the **+ Post** button.

2. Add a title and some content. EmDash stores rich text as , edited in a block editor. A URL slug is generated from the title and can be edited in the sidebar.

3. Click **Save**, then **Publish**. Only published posts are visible to site visitors.
</Steps>

## Rendering EmDash content

Query your content with `getEmDashCollection()` and `getEmDashEntry()`. Both follow the live collections pattern and return results at request time, so published changes appear without a rebuild.

### Displaying a list of posts

The following example displays a list of all published post titles, each linking to an individual post page:

```astro title="src/pages/blog.astro"
---

const { entries: posts } = await getEmDashCollection("posts", {
  status: "published",
});
---
<ul>
  {posts.map((post) => (
    <li>
      <a href={`/posts/${post.data.slug}`}>{post.data.title}</a>
    </li>
  ))}
</ul>
```

### Displaying a single post

To display content from an individual post, fetch it by its slug and render the Portable Text content with the `<PortableText />` component:

```astro title="src/pages/posts/[...slug].astro"
---


const { slug } = Astro.params;
const { entry: post } = await getEmDashEntry("posts", slug);

if (!post) {
  return Astro.redirect("/404");
}
---
<article>
  <h1>{post.data.title}</h1>
  <PortableText value={post.data.content} />
</article>
```

See the  for more information on filtering, pagination, previewing drafts, and visual editing.

## Deploying EmDash + Astro

EmDash deploys together with your site as a single Astro project. Choose a host that supports your adapter, and provision a production database and media storage.

See the  and the  for specific instructions. You can also visit Astro's  and follow the instructions to deploy with your preferred hosting provider.

## Official Resources

- 
- 
