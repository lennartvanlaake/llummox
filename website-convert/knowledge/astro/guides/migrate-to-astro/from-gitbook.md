---
title: Migrating from GitBook
description: Tips for migrating an existing GitBook project to Astro
sidebar:
  label: GitBook
type: migration
stub: true
framework: GitBook
i18nReady: true
---

import PackageManagerTabs from '~/components/tabs/PackageManagerTabs.astro'

 is a web-based platform for creating and publishing documentation and books in a collaborative manner, with version control integration and customizable features.


## Key Similarities between GitBook and Astro

GitBook and Astro share some similarities that will help you migrate your project:

- Both Astro and GitBook support . You can migrate all your existing documentation utilizing GitBook's Git Sync feature.

- Both Astro and GitBook use some form of . Using Astro's file structure for your existing content and when adding new pages should feel familiar.

## Key Differences between GitBook and Astro

When you migrate your GitBook docs to Astro, you will notice some important differences:

- A GitBook site is edited using an online dashboard. In Astro, you will use a  and development environment to maintain your site. You can develop locally on your machine, or choose a cloud editor/development environment like StackBlitz or CodeSandbox.

- GitBook stores your content in a database. In Astro, you will have individual files (typically Markdown or MDX) in your  for each page's content. Or, you can choose to use a  and use Astro to fetch and present the data.

- GitBook uses a custom syntax on top of Markdown for content. Astro supports Markdoc via the optional , which features a similar syntax to the one you would use in GitBook.


## Switch from GitBook to Astro

To convert a GitBook documentation site to Astro, start with our official , or explore more community docs themes in our .

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

Once you have a new Astro project, you can sync your existing GitBook content to your new Astro project. GitBook has a  that will automatically sync your GitBook content to a GitHub/GitLab repository. 

To sync directly to the docs template's content collection, specify `src/content/docs/en` or `src/content/docs` as the project directory.

:::caution
When enabling Git Sync be sure to specify "**GitBook to GitHub**" as the priority. This will ensure that your GitBook content is synced to your GitHub repository. Otherwise, you will overwrite your existing GitBook content.
:::

After syncing the content, you will now have a copy of your GitBook content in your Astro repository. Disable git sync to prevent future syncing with GitBook.

Note that although you now have your content migrated to your Astro project, it will not be immediately usable. To use this content in your Astro site, you will need to spend some time manually changing GitBook's syntax into a format compatible with Astro. In particular:

- Astro's  requires that the file extension be `.mdoc`. This is to avoid conflicts with other Markdown extensions like `.mdx` and `.md`.
- GitBook syntax differs from Markdoc where the `/` prefix denoting a closing tag is replaced with `end` for GitBook files. You will need to update this notation throughout your files.
- Some features of GitBook rely on custom components. These components will not exist in Astro and must be created and added to your project through  or removed from your files.

## Community Resources

:::note[Have a resource to share?]
If you found (or made!) a helpful video or blog post about converting a GitBook site to Astro, !
:::
