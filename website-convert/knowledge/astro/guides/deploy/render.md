---
title: Deploy your Astro Site to Render
description: How to deploy your Astro site to the web using Render.
sidebar:
  label: Render
type: deploy
logo: render
supports: ['static']
i18nReady: true
---

You can deploy your Astro project to , a service to build websites with free TLS certificates, a global CDN, DDoS protection, private networks, and auto deploys from Git.

## How to deploy

<Steps>
1. Create a  and sign in

2. Click the **New +** button from your dashboard and select **Static Site**

3. Connect your  or  repository or alternatively enter the public URL of a public repository

4. Give your website a name, select the branch and specify the build command and publish directory

   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`, for static sites; `dist/client` if you have any pages rendered on demand.

5. Click the **Create Static Site** button
</Steps>
