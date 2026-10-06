---
title: TinaCMS & Astro
description: Add content to your Astro project using Tina as a CMS
sidebar:
  label: TinaCMS
type: cms
stub: false
logo: tina-cms
i18nReady: true
---


 is a Git-backed headless content management system.

## Integrating with Astro

To get started, you'll need an existing Astro project.

<Steps>
1. Run the following command to install Tina into your Astro project.

    <PackageManagerTabs>
      <Fragment slot="npm">
      ```shell
      npx @tinacms/cli@latest init
      ```
      </Fragment>
      <Fragment slot="pnpm">
      ```shell
      pnpm dlx @tinacms/cli@latest init
      ```
      </Fragment>
      <Fragment slot="yarn">
      ```shell
      yarn dlx @tinacms/cli@latest init
      ```
      </Fragment>
    </PackageManagerTabs>

    - When prompted for a Cloud ID, press <kbd>Enter</kbd> to skip. You'll generate one later if you want to use Tina Cloud.
    - When prompted "What framework are you using", choose **Other**.
    - When asked where public assets are stored, press <kbd>Enter</kbd>.

    After this has finished, you should now have a `.tina` folder in the root of your project and a generated `hello-world.md` file at `content/posts`.

2. Change  the `dev` script in `package.json`:

    <PackageManagerTabs>
      <Fragment slot="npm">
      ```json del={4} ins={5}
      // package.json
      {
          "scripts": {
              "dev": "astro dev",
              "dev": "tinacms dev -c \"astro dev\""
          }
      }
      ```
      </Fragment>
      <Fragment slot="pnpm">
      ```json del={4} ins={5}
      // package.json
      {
          "scripts": {
              "dev": "astro dev",
              "dev": "tinacms dev -c \"astro dev\""
          }
      }
      ```
      </Fragment>
      <Fragment slot="yarn">
      ```json del={4} ins={5}
      // package.json
      {
          "scripts": {
              "dev": "astro dev",
              "dev": "tinacms dev -c \"astro dev\""
          }
      }
      ```
      </Fragment>
    </PackageManagerTabs>

3. TinaCMS is now set up in local mode. Test this by running the `dev` script, then navigating to `/admin/index.html#/collections/post`.

    Editing the “Hello, World!” post will update the `content/posts/hello-world.md` file in your project directory.

4. Set up your Tina collections by editing the `schema.collections` property in `tina/config.ts`.

    For example, you can add a required "date posted" frontmatter property to our posts:

    ```js title="tina/config.ts" ins={35-40}
    import { defineConfig } from "tinacms";

    // Your hosting provider likely exposes this as an environment variable
    const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";

    export default defineConfig({
      branch,
      clientId: null, // Get this from tina.io
      token: null, // Get this from tina.io
      build: {
        outputFolder: "admin",
        publicFolder: "public",
      },
      media: {
        tina: {
          mediaRoot: "images",
          publicFolder: "public",
        },
      },
      schema: {
        collections: [
          {
            name: "posts",
            label: "Posts",
            path: "src/content/posts",
            format: 'mdx',
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title",
                isTitle: true,
                required: true,
              },
              {
                type: "datetime",
                name: "posted",
                label: "Date Posted",
                required: true,
              },
              {
                type: "rich-text",
                name: "body",
                label: "Body",
                isBody: true,
              },
            ],
          },
        ],
      },
    });
    ```

    Learn more about Tina collections .

5. In production, TinaCMS can commit changes directly to your GitHub repository. To set up TinaCMS for production, you can choose to use  or self-host the . You can  in the Tina Docs.
</Steps>

## Official Resources

- .

## Community Resources

-  by Jeff See + Dylan Awalt-Conley
-  by Tom Bennet
- 
