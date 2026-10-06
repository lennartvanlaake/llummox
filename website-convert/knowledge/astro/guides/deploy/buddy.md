---
title: Deploy your Astro Site with Buddy
description: How to deploy your Astro site to the web using Buddy.
sidebar:
  label: Buddy
type: deploy
logo: buddy
supports: ['static']
i18nReady: true
---

You can deploy your Astro project using , a CI/CD solution that can build your site and push it to many different deploy targets including FTP servers and cloud hosting providers.

:::note
Buddy itself will not host your site. Instead, it helps you manage the build process and deliver the result to a deploy platform of your choice.
:::

## How to deploy

<Steps>
1. .

2. Create a new project and connect it with a git repository (GitHub, GitLab, BitBucket, any private Git Repository or you can use Buddy Git Hosting).

3. Add a new pipeline.

4. In the newly created pipeline add a **** action.

5. In this action add:

   ```bash
   npm install
   npm run build
   ```

6. Add a deployment action — there are many to choose from, you can browse them in . Although their settings can differ, remember to set the **Source path** to `dist`.

7. Press the **Run** button.
</Steps>
