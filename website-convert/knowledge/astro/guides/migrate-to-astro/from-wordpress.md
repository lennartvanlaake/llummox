---
title: Migrating from WordPress
description: Tips for migrating an existing WordPress project to Astro
sidebar:
  label: WordPress
type: migration
stub: true
framework: WordPress
i18nReady: true
---


 is an open-source, personal publishing system built on PHP and MySQL.


:::tip
You can . Follow our guide to use your existing WordPress content in a new Astro project.
:::

## Key Similarities between WordPress and Astro

WordPress and Astro share some similarities that will help you migrate your project:

- Both WordPress and Astro are ideal for  like blogs and support writing your content in Markdown (requires a plugin in WordPress). Although the process for adding new content is different,  for your Astro blog should feel familiar if you have used Markdown syntax in your WordPress editor.

- Both WordPress and Astro encourage you to  (components). In Astro you will probably  rather than rely on pre-built plugins. But thinking about the individual pieces of your site and how they are presented on the page should feel familiar.

## Key Differences between WordPress and Astro

When you rebuild your WordPress site in Astro, you will notice some important differences:

- A WordPress site is edited using an online dashboard. In Astro, you will use a  and development environment to maintain your site. You can develop locally on your machine, or choose a cloud editor/development environment like StackBlitz or CodeSandbox.

- WordPress has an extensive plugin and theme market. In Astro, you will find some themes and  available, but you may now have to build many of your existing features yourself instead of looking for third-party solutions. Or, you can choose to start with an  with built-in features!

- WordPress stores your content in a database. In Astro, you will have individual files (typically Markdown or MDX) in your  for each page's content. Or, you can choose to use a , even your existing WordPress site, and use Astro to fetch and present the data.

## Switch from WordPress to Astro

To convert a WordPress blog to Astro, start with our blog theme starter template, or explore more community blog themes in our . 

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

You can continue to , which means you will keep using your WordPress dashboard for writing your posts. Your content will be managed at WordPress, but all other aspects of your Astro site will be built in your code editing environment, and you will  separately from your WordPress site. (Be sure to update your domain at your host to keep the same website URL!)

You may wish to take  if you are new to working in a code editor and using GitHub to store and deploy your site. It will walk you through all the accounts and setup you need! You will also learn how to , and it will show you how to  if you choose not to use WordPress to write your content.

If you want to move all of your existing post content to Astro, you may find this . You may need to make some adjustments to the result if you have to .

To convert other types of sites, such as a portfolio or documentation site, see more official starter templates on . You'll find a link to each project's GitHub repository, as well as one-click links to open a working project in StackBlitz and CodeSandbox online development environments.

## Community Resources

<CardGrid>
  <LinkCard title="Goodbye WordPress, hello Astro!" href="https://trib.tv/posts/2025/wordpress-to-astro/" />
  <LinkCard title="How I Migrated from WordPress to Astro" href="https://itsthatlady.dev/blog/migrate-from-wordpress-to-astro/" />
  <LinkCard title="How and Why I Moved My Blog from WordPress to Astro and Markdown" href="https://levelup.gitconnected.com/how-and-why-i-moved-my-blog-from-wordpress-to-astro-and-markdown-3549672d5a86" />
  <LinkCard title="How I Migrated From WordPress to Astro: Boosted Pagespeed Scores to 100% and Cut 100% Hosting cost" href="https://devaradise.com/wordpress-to-static-website-astro/" />
  <LinkCard title="WordPress to Astro site conversion" href="https://share.transistor.fm/s/d86496cd" />
  <LinkCard title="How to Convert a WordPress blog to an Astro Static Site" href="https://blog.okturtles.org/2024/10/convert-wordpress-to-static-site/" />
  <LinkCard title="Why I switched from WordPress to Astro" href="https://dev.to/fratzinger/why-i-switched-from-wordpress-to-astro-5ge" />
  <LinkCard title="Why I ditched WordPress for Astro" href="https://vbartalis.xyz/en/blog/why-i-ditched-wordpress-for-astro-js/" />
  <LinkCard title="DeWP: utility to use your WordPress data in Astro projects" href="https://delucis.github.io/dewp/" />
  <LinkCard title="Astro vs. WordPress: Rendering Patterns of the Modern Web" href="https://andrewkepson.com/blog/headless-wordpress/astro-vs-wordpress-rendering-patterns/" />
  <LinkCard title="Moving an 8-year-old WordPress site without losing a single URL" href="https://synapsereality.io/wordpress-site-migration-without-losing-a-url/" />
</CardGrid>

:::note[Have a resource to share?]
If you found (or made!) a helpful video or blog post about converting a WordPress site to Astro, !
:::
