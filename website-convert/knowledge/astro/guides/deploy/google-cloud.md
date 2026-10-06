---
title: Deploy your Astro Site to Google Cloud
description: How to deploy your Astro site to the web using Google Cloud.
sidebar:
  label: Google Cloud
type: deploy
logo: google-cloud
supports: ['ssr', 'static']
i18nReady: true
---

 is a full-featured web app hosting platform that can be used to deploy an Astro site.

## How to deploy

### Cloud Storage (static only)

<Steps>
1. , or select one you already have.

2. Create a new bucket under .

3. Give it a name and the other required settings.

4. Upload your `dist` folder into it or upload using .

5. Enable public access by adding a new permission to `allUsers` called `Storage Object Viewer`.

6. Edit the website configuration and add `ìndex.html` as the entrypoint and `404.html` as the error page.
</Steps>

### Cloud Run (SSR and static)

Cloud Run is a serverless platform that allows you to run a container without having to manage any infrastructure. It can be used to deploy both static and SSR sites.

#### Prepare the Service

<Steps>
1. , or select one you already have.

2. Make sure the  is enabled.

3. Create a new service.
</Steps>

#### Create Dockerfile & Build the Container

Before you can deploy your Astro site to Cloud Run, you need to create a Dockerfile that will be used to build the container. Find more information about  in our recipe section.

Once the Dockerfile is created, build it into an image and push it to Google Cloud. There are a few ways to accomplish this:

**Build locally using Docker**:

Use the `docker build` command to build the image, `docker tag` to give it a tag, then `docker push` to push it to a registry. In the case of Google Cloud,  is the easiest option, but you can also use .

```bash
# build your container
docker build .

docker tag SOURCE_IMAGE HOSTNAME/PROJECT-ID/TARGET-IMAGE:TAG

# Push your image to a registry
docker push HOSTNAME/PROJECT-ID/IMAGE:TAG
```

Change the following values in the commands above to match your project:

- `SOURCE_IMAGE`: the local image name or image ID.
- `HOSTNAME`: the registry host (`gcr.io`, `eu.gcr.io`, `asia.gcr.io`, `us.gcr.io`, `docker.io`).
- `PROJECT`: your Google Cloud project ID.
- `TARGET-IMAGE`: the name for the image when it's stored in the registry.
- `TAG` is the version associated with the image.



**Using another tool**:

You can use a CI/CD tool that supports Docker, like .

**Build using **:

Instead of building the Dockerfile locally, you can instruct Google Cloud to build the image remotely. See the .

#### Deploying the container

Deployment can be handled manually in your terminal  or automatically using  or any other CI/CD system.

:::note[Need public access?]
Don't forget to add the permission `Cloud Run Invoker` to the `allUsers` group in the Cloud Run permissions settings!
:::
