---
title: Migrating from Docusaurus
description: Tips for migrating an existing Docusaurus project to Astro
sidebar:
  label: Docusaurus
type: migration
stub: true
framework: Docusaurus
i18nReady: true
---



 is a popular documentation website builder built on React.

## Key Similarities between Docusaurus and Astro

Docusaurus and Astro share some similarities that will help you migrate your project:

- Both Astro and Docusaurus are modern, JavaScript-based (Jamstack) site builders intended for , like documentation sites. 

- Both Astro and Docusaurus support . You should be able to use your existing `.mdx` files with Astro.

- Both Astro and Docusaurus use  to generate page routes automatically for any MDX file located in `src/pages`. Using Astro's file structure for your existing content and when adding new pages should feel familiar.

- Astro has an . Note that in Astro, React files **must** have a `.jsx` or `.tsx` extension.

- Astro supports , including several for React. You may be able to keep some or all of your existing React components and dependencies.

-  should feel familiar if you are used to writing React.


## Key Differences between Docusaurus and Astro

When you rebuild your Docusaurus site in Astro, you will notice some important differences:

- Docusaurus is a React-based single-page application (SPA). Astro sites are multi-page apps built using , but can also support  and raw HTML templating.

- Docusaurus was designed to build documentation websites and has some built-in, documentation-specific website features that you would have to build yourself in Astro. Instead, Astro offers some of these features through . This website was the inspiration for Starlight, and now runs on it! You can also find more  with built-in features in our Themes Showcase.

- Docusaurus sites use MDX pages for content. Astro's docs theme uses Markdown (`.md`) files by default and does not require you to use MDX. You can optionally  (included in our Starlight theme by default) and use `.mdx` files in addition to standard Markdown files.


## Switch from Docusaurus to Astro

To convert a Docusaurus documentation site to Astro, start with our official , or explore more community docs themes in our . 

You can pass a `--template` argument to the `create astro` command to start a new Astro project with one of our official starters. Or, you can .

  <PackageManagerTabs>
    <Fragment slot="npm">
    ```shell
    npm create astro@latest -- --template starlight
    ```
    </Fragment>
    <Fragment slot="pnpm">
    ```shell
    pnpm create astro@latest --template starlight
    ```
    </Fragment>
    <Fragment slot="yarn">
    ```shell
    yarn create astro --template starlight
    ```
    </Fragment>
  </PackageManagerTabs>

Astro's MDX integration is included by default, so you can  right away.

You can find Astro's docs starter, and other official templates, on . You'll find a link to each project's GitHub repository, as well as one-click links to open a working project in StackBlitz and CodeSandbox online development environments.

## Community Resources

<CardGrid>

  <LinkCard title="Speeding up documentation by 10 times (Russian)" href="https://habr.com/ru/articles/880220/"/>

</CardGrid>

:::note[Have a resource to share?]
If you found (or made!) a helpful video or blog post about converting a Docusaurus site to Astro, !
:::
