---
title: Deploy your Astro Site to Heroku
description: How to deploy your Astro site to the web using Heroku.
sidebar:
  label: Heroku
type: deploy
logo: heroku
supports: ['static']
i18nReady: true
---

 is a platform-as-a-service for building, running, and managing modern apps in the cloud. You can deploy an Astro site to Heroku using this guide.

:::caution
The following instructions use . Please see  instead.
:::

## How to deploy

<Steps>
1. Install the .

2. Create a Heroku account by .

3. Run `heroku login` and fill in your Heroku credentials:

   ```bash
   $ heroku login
   ```

4. Create a file called `static.json` in the root of your project with the below content:

   ```json title="static.json"
   {
     "root": "./dist"
   }
   ```

   This is the configuration of your site; read more at .

5. Set up your Heroku git remote:

   ```bash
   # version change
   $ git init
   $ git add .
   $ git commit -m "My site ready for deployment."

   # creates a new app with a specified name
   $ heroku apps:create example

   # set buildpack for static sites
   $ heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static.git
   ```

6. Deploy your site:

   ```bash
   # publish site
   $ git push heroku master

   # opens a browser to view the Dashboard version of Heroku CI
   $ heroku open
   ```
</Steps>
