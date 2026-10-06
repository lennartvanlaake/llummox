---
title: Deploy your Astro Site to Surge
description: How to deploy your Astro site to the web using Surge
sidebar:
  label: Surge
type: deploy
logo: surge
supports: ['static']
i18nReady: true
---

You can deploy your Astro project to , a single-command web publishing platform designed for front-end developers.

## How to deploy

<Steps>
1. Install  globally from the terminal, if you haven't already.

    ```shell
    npm install -g surge
    ```

2. Build your Astro site from your project’s root directory.

    ```shell
    npm run build
    ```

3. Deploy to Surge using the CLI.

    ```shell
    surge dist
    ```

    You can  when deploying by running `surge dist yourdomain.com`.
</Steps>
