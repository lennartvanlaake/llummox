---
title: Deploy your Astro Site to Seenode
description: How to deploy your Astro site to the web on Seenode.
sidebar:
  label: Seenode
type: deploy
logo: seenode
supports: ['ssr']
i18nReady: true
---



 is a deployment platform for building and deploying web applications with databases, built-in observability, and auto-scaling. Astro sites can be deployed to Seenode using server-side rendering (SSR).

This guide includes instructions for deploying to Seenode through the web interface.

## Project Configuration

### Adapter for SSR

To enable on-demand rendering in your Astro project and deploy to Seenode, add  with the following `astro add` command. This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

<PackageManagerTabs>
  <Fragment slot="npm">
  ```shell
  npx astro add node
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```shell
  pnpm astro add node
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```shell
  yarn astro add node
  ```
  </Fragment>
</PackageManagerTabs>

After installing the adapter, update your `astro.config.mjs` to configure the server for Seenode's requirements:

```js title="astro.config.mjs" ins={6-11}


export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: {
    port: process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 80) : 4321,
    host: true
  }
});
```

Update your `package.json` to include a start script that runs the built server:

```json title="package.json" ins={6}
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "start": "NODE_ENV=production node ./dist/server/entry.mjs"
  }
}
```

<ReadMore>See  for more configuration options and troubleshooting.</ReadMore>

## How to Deploy

You can deploy to Seenode through the web interface by connecting your Git repository.

### Web Interface Deployment

<Steps>
1. Create a  and sign in.

2. Push your code to your Git repository (GitHub or GitLab).

3. From the , create a new **Web Service** and connect your repository.

4. Seenode will automatically detect your Astro project. Configure the deployment settings:

   - **Build Command:** `npm ci && npm run build` (or use `pnpm` / `yarn` equivalents)
   - **Start Command:** `npm start`
   - **Port:** `80` (required for web services)

5. Select your preferred instance size and click **Create Web Service**.

6. Your application will be built and deployed. Once complete, you'll receive a URL to access your live Astro site after which you can link your domain.
</Steps>

## Official Resources

-  — Seenode dashboard
-  — complete platform documentation
-  — detailed deployment guide and troubleshooting
-  — pre-configured starter template
