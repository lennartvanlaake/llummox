---
title: Migrating from Pelican
description: Tips for migrating an existing Pelican project to Astro
sidebar:
  label: Pelican
type: migration
stub: true
framework: Pelican
i18nReady: true
---

import PackageManagerTabs from '~/components/tabs/PackageManagerTabs.astro'

 is an open-source static site generator built on Python.

## Key Similarities between Pelican and Astro

Pelican and Astro share some similarities that will help you migrate your project:

- Pelican and Astro are both static-site generators, ideally suited to  like blogs.

- Pelican and Astro both have built-in support for , including frontmatter YAML properties for page metadata. However, Astro has very few reserved frontmatter properties compared to Pelican. Even though many of your existing Pelican frontmatter properties will not be "special" in Astro, you can continue to use your existing Markdown files and frontmatter values.

## Key Differences between Pelican and Astro

When you rebuild your Pelican site in Astro, you will notice some important differences:

- Pelican supports writing content in Markdown and reStructured Text (`.rst`). Astro supports  files, but does not support reStructured Text.

- Pelican uses HTML files and Jinja syntax for templating.  is a JSX-like superset of HTML. All valid HTML is valid `.astro` syntax.

- Pelican was designed to build content-rich websites like blogs and has some built-in, blog features that you would have to build yourself in Astro. Instead, Astro offers some of these features included in an .

## Switch from Pelican to Astro

To convert a Pelican documentation site to Astro, start with our official , or explore more community themes in our . 

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

Bring your existing Markdown content files to . You can still take advantage of  by copying these documents from Pelican's `content/` folder into `src/pages/` in Astro. You may wish to read about  to learn where files should be located.

Pelican may have handled much of your site layout and metadata for you. You may wish to read about  to see how to manage templating yourself in Astro, including your page `<head>`.

Like Pelican, Astro has many plugins that extend its functionality. Explore the  for adding features such as MDX support, and find hundreds more of community-maintained integrations in the . You can even use the  to build your own custom integration to extend your project's features.

To convert other types of sites, such as a portfolio or a blog, see more official starter templates on . You'll find a link to each project's GitHub repository, as well as one-click links to open a working project in StackBlitz and CodeSandbox online development environments.

## Community Resources

:::note[Have a resource to share?]
If you found (or made!) a helpful video or blog post about converting a Pelican site to Astro, !
:::
