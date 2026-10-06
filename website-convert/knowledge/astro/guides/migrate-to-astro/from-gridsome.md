---
title: Migrating from Gridsome
description: Tips for migrating an existing Gridsome project to Astro
sidebar:
  label: Gridsome
type: migration
stub: true
framework: Gridsome
i18nReady: true
---



 is an open-source static site generator built on Vue and GraphQL.

## Key Similarities between Gridsome and Astro

Gridsome and Astro share some similarities that will help you migrate your project:

- Both Gridsome and Astro are modern JavaScript static-site generators with similar . 

- Both Gridsome and Astro use a `src/` folder for your project files and a . Creating and managing pages for your site should feel familiar.

- Astro has  and supports , including several for Vue. You will be able to write Vue UI components, and may be able to keep some or all of your existing Gridsome Vue components and dependencies.

- Astro and Gridsome both allow you to use a . You can continue to use your preferred content authoring system, and will be able to keep your existing content.

## Key Differences between Gridsome and Astro

When you rebuild your Gridsome site in Astro, you will notice some important differences:

- Gridsome is a Vue-based single-page application (SPA). Astro sites are multi-page apps built using , but can also support  and raw HTML templating.

- As an SPA, Gridsome uses `vue-router` for SPA routing, and `vue-meta` for managing `<head>`. In Astro, you will create separate HTML pages and control your page `<head>` directly, or in a .

- : Gridsome uses GraphQL to retrieve data from your project files. Astro uses ESM imports and  to import data from local project files. Remote resources can be loaded using the standard `fetch()` API. GraphQL may be optionally added to your project, but is not included by default.

## Switch from Gridsome to Astro

To convert a Gridsome blog to Astro, start with our blog theme starter template, or explore more community blog themes in our .

You can pass a `--template` argument to the `create astro` command to start a new Astro project with one of our official starters. Or, you can .

  <PackageManagerTabs>
    <Fragment slot="npm">
    ```shell
    npm create astro@latest -- --template blog
    ```
    </Fragment>
    <Fragment slot="pnpm">
    ```shell
    pnpm create astro@latest --template blog
    ```
    </Fragment>
    <Fragment slot="yarn">
    ```shell
    yarn create astro --template blog
    ```
    </Fragment>
  </PackageManagerTabs>

Bring your existing Markdown (or MDX, with our optional integration) files as content to .

Since Gridsome's project structure is similar to Astro's, you may be able to copy several existing files from your project into the same location in your new Astro project. However, the two project structures are not identical. You may want to examine  to see what the differences are.

Since Astro queries and imports your local files differently than Gridsome, you may want to read about how to load files using  to understand how to work with your local files.

To convert other types of sites, such as a portfolio or documentation site, see more official starter templates on . You'll find a link to each project's GitHub repository, as well as one-click links to open a working project in StackBlitz and CodeSandbox online development environments.

## Community Resources

<CardGrid>

  <LinkCard title="Migration from Gridsome to Astro" href="https://fyodor.io/migration-from-gridsome-to-astro/"/>

  <LinkCard title="Hello Astro!" href="https://thamas.hu/astro-hello"/>

</CardGrid>

:::note[Have a resource to share?]
If you found (or made!) a helpful video or blog post about converting a Gridsome site to Astro, !
:::
