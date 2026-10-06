---
title: Cloudinary & Astro
description: Add images and videos to your Astro project using Cloudinary
sidebar:
  label: Cloudinary
type: media
stub: true
logo: cloudinary
i18nReady: true
---

 is an image and video platform and headless Digital Asset Manager (DAM) that lets you host assets and deliver them from their content delivery network (CDN).

When delivering from Cloudinary, you additionally get access to their Transformation API, giving you the ability to edit your assets with tools like background removal, dynamic cropping and resizing, and generative AI.

## Using Cloudinary in Astro

Cloudinary supports a wide variety of SDKs that can be used depending on your Astro environment.

The  provides native Astro components, including image, video, and upload components, as well as a content loader that can be used with Astro content collections.

Alternatively, both the Cloudinary  and  can be used to generate URLs for your images. The Node.js SDK can additionally make requests to the Cloudinary API including uploading assets, requesting resources, and running content analysis.

## Prerequisites

- An existing Astro project
- A Cloudinary account

## Installing Astro Cloudinary

Install the Cloudinary Astro SDK by running the appropriate command for your package manager:

<PackageManagerTabs>
  <Fragment slot="npm">
  ```shell
  npm install astro-cloudinary
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```shell
  pnpm add astro-cloudinary
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```shell
  yarn add astro-cloudinary
  ```
  </Fragment>
</PackageManagerTabs>

## Configuring your account

Create a new `.env` file in the root of your project and add your Cloudinary credentials:

```shell title=".env"
PUBLIC_CLOUDINARY_CLOUD_NAME="<Your Cloud Name>"

// Only needed if using CldUploadWidget or cldAssetsLoader
PUBLIC_CLOUDINARY_API_KEY="<Your API Key>"
CLOUDINARY_API_SECRET="<Your API Secret>"
```

## Using Cloudinary images

Add images in `.astro` components by passing image data (e.g. `src`, `width`, `alt`) to the `<CldImage>` component. This will automatically optimize your image and give you access to the Transformations API.

```jsx title="Component.astro"
---

---
<CldImage
  src="<Public ID>"
  width="<Width>"
  height="<Height>"
  alt="<Description>"
/>
```

See  for more information.

## Using Cloudinary videos

To add video to your `.astro` components,  add the `<CldVideoPlayer>`  and pass the appropriate properties. This component will automatically optimize and embed your video using the .

```jsx title="Component.astro"
---

---
<CldVideoPlayer
  src="<Public ID>"
  width="<Width>"
  height="<Height>"
/>
```

See  for more information.

## Enabling Cloudinary uploads

To enable file uploading in your website or app's UI, add the `<CldUploadWidget>` which will embed the .

The following example creates a widget to allow unsigned uploads by passing an unsigned :

```jsx title="Component.astro"
---

---
<CldUploadWidget uploadPreset="<Upload Preset>">
  <button>Upload</button>
</CldUploadWidget>
```

For signed uploads, you can find  on the Astro Cloudinary docs.

See  for more information.

## Cloudinary content loader

The Cloudinary Astro SDK provides the `cldAssetsLoader` content loader to load Cloudinary assets for content collections.

To load a collection of images or videos, set `loader: cldAssetsLoader ({})` with a `folder`, if required:

```jsx title="content.config.ts"


export const collections = {
  assets: defineCollection({
    loader: cldAssetsLoader({
      folder: '<Folder>' // Optional, without loads root directory
    })
  }),
}
```

You can then use the  to select one or many images or videos from your collection.

See  for more information.

## Generating Cloudinary image URLs

The Astro Cloudinary SDK provides a `getCldOgImageUrl()` helper for generating and using URLs for your images. Use this when you need a URL instead of a component to display your image. 

One common use for a URL is for an Open Graph image in `<meta>` tags for social media cards. This helper, like the components, provides you access to Cloudinary transformations to create dynamic, unique social cards for any of your pages.

The following example shows the necessary `<meta>` tags for a social media card, using `getCldOgImageUrl()` to generate an Open Graph image:

```jsx title="Layout.astro"
---

const ogImageUrl = getCldOgImageUrl({ src: '<Public ID>' });
---
<meta property="og:image" content={ogImageUrl} />
<meta property="og:image:secure_url" content={ogImageUrl} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="twitter:title" content="<Twitter Title>" />
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:image" content={ogImageUrl} />
```


Find  on the Cloudinary docs.

See  for more information.

## Using Cloudinary in Node.js

For more complex asset management, uploading, or analysis, you can use the Cloudinary Node.js SDK when working in an Astro Node.js environment.

Install the Cloudinary Node.js SDK by running the appropriate command for your package manager:

<PackageManagerTabs>
  <Fragment slot="npm">
  ```shell
  npm install cloudinary
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```shell
  pnpm add cloudinary
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```shell
  yarn add cloudinary
  ```
  </Fragment>
</PackageManagerTabs>

Add the following environment variables in your `.env` file:

```shell title=".env"
PUBLIC_CLOUDINARY_CLOUD_NAME="<Your Cloud Name>"
PUBLIC_CLOUDINARY_API_KEY="<Your API Key>"
CLOUDINARY_API_SECRET="<Your API Secret>"
```

Configure your account with a new Cloudinary instance by adding the following code between the fences of your Astro component:

```js title="Component.astro"
---

cloudinary.config({
  cloud_name: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.PUBLIC_CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});
---
```

This will give you access to all of the Cloudinary APIs to allow you to interact with your images, videos, and other supported files.

```js title="Component.astro"
await cloudinary.uploader.upload('./path/to/file');
```

Learn how to .


## Official Resources

- 
- 
- 
- 
