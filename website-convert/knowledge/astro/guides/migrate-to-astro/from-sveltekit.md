---
title: Migrating from SvelteKit
description: Tips for migrating an existing SvelteKit project to Astro
sidebar:
  label: SvelteKit
type: migration
stub: true
framework: SvelteKit
i18nReady: true
---



 is a framework for building web applications on top of Svelte.

## Key Similarities between SvelteKit and Astro

SvelteKit and Astro share some similarities that will help you migrate your project:

- Both SvelteKit and Astro are modern JavaScript static-site generators and server-side rendering frameworks. 

- Both SvelteKit and Astro use a  and a . Creating and managing pages for your site should feel familiar.

- Astro has  and supports , including several for Svelte. You will be able to write Svelte UI components, and may be able to keep some or all of your existing components and dependencies.

- Astro and SvelteKit both allow you to use a . You can continue to use your preferred content authoring system, and will be able to keep your existing content.

## Key Differences between SvelteKit and Astro

When you rebuild your SvelteKit site in Astro, you will notice some important differences:

- Astro sites are multi-page apps, whereas SvelteKit defaults to SPAs (single-page applications) with server-side rendering, but can also create MPAs, traditional SPAs, or you can mix and match these techniques within an app.

- : SvelteKit uses . Astro pages are built using , but can also support  and raw HTML templating.

- : Astro was designed to showcase your content and to allow you to opt-in to interactivity only as needed. An existing SvelteKit app might be built for high client-side interactivity. Astro has built-in capabilities for working with your content, such as page generation, but may require advanced Astro techniques to include items that are more challenging to replicate using `.astro` components, such as dashboards.

- : Astro includes built-in Markdown support, and includes a  used per-file for page templating. If you are converting a SvelteKit Markdown-based blog, you will not have to install a separate Markdown integration and you will not set a layout via a configuration file. You can bring your existing Markdown files, but you may need to reorganize as Astro's file-based routing does not require a folder for each page route.


## Switch from SvelteKit to Astro

To convert a SvelteKit blog to Astro, start with our blog theme starter template, or explore more community blog themes in our .

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

While file-based routing and layout components are similar in Astro, you may wish to read about  to learn where files should be located.

To convert other types of sites, such as a portfolio or documentation site, see more official starter templates on . You'll find a link to each project's GitHub repository, as well as one-click links to open a working project in StackBlitz and CodeSandbox online development environments.

## Community Resources

<CardGrid>

  <LinkCard title="Rewriting my blog from SvelteKit to Astro" href="https://kharann.com/blog/rewriting-my-blog/"/>

</CardGrid>

:::note[Have a resource to share?]
If you found (or made!) a helpful video or blog post about converting a SvelteKit site to Astro, !
:::
