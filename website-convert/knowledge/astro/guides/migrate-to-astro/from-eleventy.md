---
title: Migrating from Eleventy
description: Tips for migrating an existing Eleventy project to Astro
sidebar:
  label: Eleventy
type: migration
stub: true
framework: Eleventy
i18nReady: true
---



 is an open-source static site generator that works with multiple template languages.

## Key Similarities between Eleventy (11ty) and Astro

Eleventy (11ty) and Astro share some similarities that will help you migrate your project:

- Both Astro and Eleventy are modern, JavaScript-based (Jamstack) site builders.

- Astro and Eleventy both allow you to use a . You can continue to use your preferred content authoring system, and will be able to keep your existing content.

## Key Differences between Eleventy (11ty) and Astro

When you rebuild your Eleventy (11ty) site in Astro, you will notice some important differences:

- Eleventy supports a variety of templating languages. Astro supports , but uses  for most page templating.

- Astro uses a  for all files, including site metadata, that are available for querying and processing during site build. Within this is a .

- Astro uses a  that do not need to be processed nor transformed during the build.

- In Eleventy, bundling CSS, JavaScript, and other assets needs to be configured manually. .

## Switch from Eleventy to Astro

To convert an Eleventy blog to Astro, start with our blog theme starter template, or explore more community blog themes in our .

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

Your Eleventy project allowed you to use a variety of templating languages to build your site. In an Astro project, your page templating will mostly be achieved with Astro components, which can be used as UI elements, layouts and even full pages. You may want to explore  to see how to template in Astro using components.

To convert other types of sites, such as a portfolio or documentation site, see more official starter templates on . You'll find a link to each project's GitHub repository, as well as one-click links to open a working project in StackBlitz and CodeSandbox online development environments.

## Community Resources

<CardGrid>

  <LinkCard title="This Site Is Now Built with Astro" href="https://aqandrew.com/blog/now-built-with-astro/" description="Why I switched from Eleventy."/>

  <LinkCard title="Website Rewrite: 2025" href="https://www.welchcanavan.com/posts/site-rewrite-2025/" />

</CardGrid>

:::note[Have a resource to share?]
If you found (or made!) a helpful video or blog post about converting an Eleventy site to Astro, !
:::
