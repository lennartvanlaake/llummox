---
title: Deploy your Astro Site to Fly.io
description: How to deploy your Astro site to the web using Fly.io.
sidebar:
  label: Fly.io
type: deploy
logo: flyio
supports: ['ssr', 'static']
i18nReady: true
stub: true
---

You can deploy your Astro project to , a platform for running full stack apps and databases close to your users.

## Project Configuration

Your Astro project can be deployed to Fly.io as a static site, or as a server-side rendered site (SSR).

### Static Site

Your Astro project is a static site by default. You don’t need any extra configuration to deploy a static Astro site to Fly.io.

### Adapter for SSR

To enable on-demand rendering in your Astro project and deploy on Fly.io, add .

## How to deploy

<Steps>
1.  if you haven't already.

2. , your Fly.io app command center.

3. Run the following command in your terminal.

    ```bash
    fly launch
    ```

	`flyctl` will automatically detect Astro, configure the correct settings, build your image, and deploy it to the Fly.io platform. 
</Steps>

## Generating your Astro Dockerfile

If you don't already have a Dockerfile, `fly launch` will generate one for you, as well as prepare a `fly.toml` file. For pages rendered on demand, this Dockerfile will include the appropriate start command and environment variables.

You can instead create your own Dockerfile using  and then run using the command `npx dockerfile` for Node applications or `bunx dockerfile` for Bun applications.

## Official Resources

- Check out 
