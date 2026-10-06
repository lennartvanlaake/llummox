---
title: Migrating from Jekyll
description: Tips for migrating an existing Jekyll project to Astro
sidebar:
  label: Jekyll
type: migration
stub: true
framework: Jekyll
i18nReady: true
---



 is a static site generator built on Ruby.

## Key Similarities between Jekyll and Astro

Jekyll and Astro share some similarities that will help you migrate your project:

- Both Jekyll and Astro are static-site generators, commonly used to create blogs.

- Both Jekyll and Astro allow you to write your content in Markdown and HTML. Jekyll and Astro both provide some special frontmatter YAML properties for page layout and unpublished draft posts. You can continue to use your existing Markdown files in Astro.

- Both Jekyll and Astro use  for creating pages from your blog posts. Astro provides a . Jekyll uses a similar special folder called `_posts/` for your Markdown blog posts, however your site pages can exist elsewhere. Creating new blog posts should feel familiar.


## Key Differences between Jekyll and Astro

When you rebuild your Jekyll site in Astro, you will notice some important differences:

- As Jekyll is primarily a blogging platform, several blog features are built-in that you may have to build yourself in Astro. Or, choose a  that includes these features. For example, Jekyll has built-in support for tags and categories which you will find in several Astro blog themes, but is not included in a minimal Astro project.

- Jekyll uses Liquid templates for reusable layout elements and templating. Astro uses JSX-like . Any `.astro` file can be a component, a layout or an entire page, and can import and render any other Astro components. You can also build using  as well as content or metadata from , such as Markdown or MDX.


## Switch from Jekyll to Astro

To convert a Jekyll blog to Astro, start with our blog theme starter template, or explore more community blog themes in our .

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

Bring your existing Markdown files as content to , using an  instead of a Liquid template. 

Much of your existing HTML page content can be converted into , and you will additionally be able to .

Astro does not have a `permalink` property that accepts placeholders. You may need to read more about  if you want to keep your existing URL structure. Or, consider .

To convert other types of sites, such as a portfolio or documentation site, see more official starter templates on . You'll find a link to each project's GitHub repository, as well as one-click links to open a working project in StackBlitz and CodeSandbox online development environments.

## Community Resources

<CardGrid>

  <LinkCard title="From Jekyll to Astro" href="https://jackcarey.co.uk/posts/astro-rewrite/"/>
  <LinkCard title="Goodbye Jekyll, Hello Astro" href="https://kiranrao.in/blog/bye-jekyll-hello-astro/" />
  <LinkCard title="Back to the Future: Our Tech Blog's Transition from Jekyll to Astro" href="https://alasco.tech/2023/09/06/migrating-to-astro"/>

</CardGrid>

:::note[Have a resource to share?]
If you found (or made!) a helpful video or blog post about converting a Jekyll site to Astro, !
:::
