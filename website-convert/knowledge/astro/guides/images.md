---
title: Images
description: Learn how to use images in Astro.
i18nReady: true
---




Astro provides several ways for you to use images on your site, whether they are stored locally inside your project, linked to from an external URL, or managed in a CMS or CDN.

Astro provides built-in  and  Astro components,  (`!`) processing, , and  to optimize and/or transform your images. Additionally, you can configure  by default, or set responsive properties on individual image and picture components.

You can always choose to use images and SVG files using native HTML elements in `.astro` or Markdown files, or the standard way for your file type (e.g. `<img />` in MDX and JSX). However, Astro does not perform any processing or optimization of these images.

There is also no native video support in Astro, and we recommend choosing a  to handle the demands of optimizing and streaming video content.

<ReadMore>See the full API reference for the  and  components.</ReadMore>

## Where to store images

### `src/` vs `public/`

We recommend that local images are kept in `src/` when possible so that Astro can transform, optimize, and bundle them. Files in the `public/` directory are always served or copied into the build folder as-is, with no processing.

Your local images stored in `src/` can be used by all files in your project: `.astro`, `.md`, `.mdx`, `.mdoc`, and other UI frameworks as file imports. Images can be stored in any folder, including alongside your content.

Store your images in the `public/` folder if you want to avoid any processing. These images are available to your project files as URL paths on your domain and allow you to have a direct public link to them. For example, your site favicon will commonly be placed in the root of this folder where browsers can identify it.

### Remote images

You can also choose to store your images remotely, in a  or  platform. Astro can fetch your data remotely using APIs or display images from their full URL path.

For extra protection when dealing with external sources, Astro's image components and helper function will only process (e.g. optimize, transform) images from . Remote images from other sources will be displayed with no processing.

## Images in `.astro` files

<p>

**Options:** `<Image />`, `<Picture />`, `<img>`, `<svg>`, SVG components
</p>

Astro's templating language allows you to render optimized images with the Astro  component and generate multiple sizes and formats with the Astro  component. Both components also accept  for resizing based on container size and responding to device screen size and resolution.

Additionally, you can import and use  in `.astro` components.

All native HTML tags, including `<img>` and `<svg>`, are also available in `.astro` components.  will not be processed (e.g. optimized, transformed) and will be copied into your build folder as-is.

For all images in `.astro` files, **the value of the image `src` attribute is determined by the location of your image file**:

- A local image from your project `src/` folder uses an import from the file's relative path.

  The image and picture components use the named import directly (e.g. `src={rocket}`), while the `<img>` tag uses the `src` object property of the import (e.g. `src={rocket.src}`).

- Remote and `public/` images use a URL path.

  Provide a full URL for remote images (e.g. `src="https://www.example.com/images/my-remote-image.jpg"`), or a relative URL path on your site that corresponds to your file's location in your `public/` folder (e.g. `src="/images/my-public-image.jpg"` for an image located in `public/images/my-public-image.jpg`).

```astro title="src/pages/blog/my-images.astro"
---


---
<Image src={localBirdImage} alt="A bird sitting on a nest of eggs." />
<Image src="/images/bird-in-public-folder.jpg" alt="A bird." width="50" height="50" />
<Image src="https://example.com/remote-bird.jpg" alt="A bird." width="50" height="50" />

<img src={localBirdImage.src} alt="A bird sitting on a nest of eggs.">
<img src="/images/bird-in-public-folder.jpg" alt="A bird.">
<img src="https://example.com/remote-bird.jpg" alt="A bird.">
```

<ReadMore>See the full API reference for the  and  components including required and optional properties.</ReadMore>

<RecipeLinks slugs={["en/recipes/dynamically-importing-images" ]}/>


## Images in Markdown files

<p>

**Options:** `!`, `<img>` (with public or remote images)
</p>

Use standard Markdown `!` syntax in your `.md` files. Your local images stored in `src/` and remote images will be processed and optimized. When you , these images will also be .

Images stored in the `public/` folder are never optimized.

```md
<!-- src/pages/post-1.md -->

# My Markdown Page

<!-- Local image stored in src/assets/ -->
<!-- Use a relative file path or import alias -->
!

<!-- Image stored in public/images/ -->
<!-- Use the file path relative to public/ -->
!

<!-- Remote image on another server -->
<!-- Use the full URL of the image -->
!
```

The HTML `<img>` tag can also be used to display images stored in `public/` or remote images without any image optimization or processing. However, `<img>` is not supported for your local images in `src`.

The `<Image />` and `<Picture />` components are unavailable in `.md` files. If you require more control over your image attributes, we recommend using  to add support for `.mdx` file format. MDX allows additional , including combining components with Markdown syntax.

## Images in MDX files

<p>

**Options:** `<Image />`, `<Picture />`, `<img />`, `!`, SVG components
</p>

You can use Astro's `<Image />` and `<Picture />` components in your `.mdx` files by importing both the component and your image. Use them just as they are . The JSX `<img />` tag is also supported for unprocessed images and .

Additionally, there is support for ` syntax](#images-in-markdown-files) with no import required.

```mdx title="src/pages/post-1.mdx"
---
title: My Page title
---


# My MDX Page

// Local image stored in the same folder
!

// Local image stored in src/assets/
<Image src={rocket} alt="A rocketship in space." />
<img src={rocket.src} alt="A rocketship in space." />
!

// Image stored in public/images/
<Image src="/images/stars.png" alt="A starry night sky." />
<img src="/images/stars.png" alt="A starry night sky." />
!

// Remote image on another server
<Image src="https://example.com/images/remote-image.png" />
<img src="https://example.com/images/remote-image.png" />
!

```

<ReadMore>See the full API reference for the  and  components.</ReadMore>

## Images in UI framework components

<p>

**Image options:** the framework's own image syntax (e.g. `<img />` in JSX, `<img>` in Svelte)
</p>

 to access their image properties such as `src`. Then, they can be rendered as you normally would in that framework's own image syntax:

```jsx title="src/components/ReactImage.jsx"

export default function ReactImage() {
  return (
    <img src={stars.src} alt="A starry night sky." />
  )
}
```

```svelte title="src/components/SvelteImage.svelte"
<script>
  import stars from '../assets/stars.png';
</script>

<img src={stars.src} alt="A starry night sky." />

```

Astro components (e.g. `<Image />`, `<Picture />`, SVG components) are unavailable inside UI framework components because .

But, you can pass the static content generated by these components to a framework component inside a `.astro` file  or using a :


```astro title="src/components/ImageWrapper.astro"
---



---

<ReactComponent>
  <Image src={stars} alt="A starry night sky." />
</ReactComponent>
```

## Astro components for images

Astro provides two built-in Astro components for images (`<Image />` and `<Picture />`) and also allows you to import SVG files and use them as Astro components. These components may be used in any files that can import and render `.astro` components.

### `<Image />`

Use the built-in `<Image />` Astro component to display optimized versions of:

- your local images located within the `src/` folder
-  from authorized sources

`<Image />` can transform a local or authorized remote image's dimensions, file type, and quality for control over your displayed image. This transformation happens at build time for prerendered pages. When your page is rendered on demand, this transformation will occur on the fly when the page is viewed. The resulting `<img>` tag includes `alt`, `loading`, and `decoding` attributes and infers image dimensions to avoid Cumulative Layout Shift (CLS).

:::note[What is Cumulative Layout Shift?]
 is a Core Web Vital metric for measuring how much content shifted on your page during loading. The `<Image />` component optimizes for CLS by automatically setting the correct `width` and `height` for your images.
:::

```astro title="src/components/MyComponent.astro"
---
// import the Image component and the image



---

<!-- `alt` is mandatory on the Image component -->
<Image src={myImage} alt="" class="my-class" />
```

```html 'class="my-class"'
<!-- Prerendered output -->
<img
  src="/_astro/my_image.hash.webp"
  width="1600"
  height="900"
  decoding="async"
  loading="lazy"
  class="my-class"
  alt=""
/>

```

:::tip
You can also use the `<Image />` component for images in the `public/` folder, or remote images not specifically configured in your project, even though these images will not be optimized or processed. The resulting image will be the same as using the HTML `<img>`.

However, using the image component for all images provides a consistent authoring experience and prevents Cumulative Layout Shift (CLS) even for your unoptimized images.
:::

### `<Picture />`

<p><Since v="3.3.0" /></p>

Use the built-in `<Picture />` Astro component to generate a `<picture>` tag with multiple formats and/or sizes of your image. This allows you to specify preferred file formats to display and at the same time, provide a fallback format. Like the , images will be processed at build time for prerendered pages. When your page is rendered on demand, processing will occur on the fly when the page is viewed.

The following example uses the `<Picture />` component to transform a local `.png` file into a web-friendly `avif` and `webp` format as well as the `.png` `<img>` that can be displayed as a fallback when needed:

```astro title="src/pages/index.astro"
---



---
<Image src={myImage} alt="A description of my image." layout='constrained' width={800} height={600} />
```

This `<Image />` component will generate the following HTML output on a prerendered page:

```html
<img
  src="/_astro/my_image.hash3.webp"
  srcset="/_astro/my_image.hash1.webp 640w,
      /_astro/my_image.hash2.webp 750w,
      /_astro/my_image.hash3.webp 800w,
      /_astro/my_image.hash4.webp 828w,
      /_astro/my_image.hash5.webp 1080w,
      /_astro/my_image.hash6.webp 1280w,
      /_astro/my_image.hash7.webp 1600w"
  alt="A description of my image"
  sizes="(min-width: 800px) 800px, 100vw"
  loading="lazy"
  decoding="async"
  fetchpriority="auto"
  width="800"
  height="600"
  style="--fit: cover; --pos: center;"
  data-astro-image="constrained"
>
```

#### Responsive image styles

Setting  applies a small number of global styles to ensure that your images resize correctly. In most cases, you will want to enable these as a default; your images will not be responsive without additional styles.

However, if you prefer to handle responsive image styling yourself, or need to , leave the default `false` value configured.

The global styles applied by Astro will depend on the layout type, and are designed to produce the best result for the generated `srcset` and `sizes` attributes. These are the default styles:

```css title="Responsive Image Styles"
:where([data-astro-image]) {
	object-fit: var(--fit);
	object-position: var(--pos);
}
:where([data-astro-image='full-width']) {
	width: 100%;
}
:where([data-astro-image='constrained']) {
	max-width: 100%;
}
```

The styles use the , which has a  of 0, meaning that it is easy to override with your own styles. Any CSS selector will have a higher specificity than `:where()`, so you can easily override the styles by adding your own styles to target the image.

You can override the `object-fit` and `object-position` styles on a per-image basis by setting the `fit` and `position` props on the `<Image />` or `<Picture />` component.

#### Responsive images with Tailwind 4

Tailwind 4 is compatible with Astro's default responsive styles. However, Tailwind uses , meaning that its rules are always lower specificity than rules that don't use layers, including Astro's responsive styles. Therefore, Astro's styling will take precedence over Tailwind styling. To use Tailwind rules instead of Astro's default styling, do not enable .


### SVG components
<p><Since v="5.7.0" /></p>

Astro allows you to import SVG files and use them as Astro components. Astro will inline the SVG content into your HTML output.

Reference the default import of any local `.svg` file. Since this import is treated as an Astro component, you must use the same conventions (e.g. capitalization) as when .

```astro title="src/components/MyAstroComponent.astro"
---

---

<Logo />
```

Your SVG component, like `<Image />` or any other Astro component, is unavailable inside UI framework components, but can  inside a `.astro` component.

#### SVG component attributes

You can pass props such as `width`, `height`, `fill`, `stroke`, and any other attribute accepted by the . These attributes will automatically be applied to the underlying `<svg>` element. If a property is present in the original `.svg` file and is passed to the component, the value passed to the component will override the original value.


```astro title="src/components/MyAstroComponent.astro"
---

---

<Logo width={64} height={64} fill="currentColor" />
```

#### `SvgComponent` Type

<Since v="5.14.0" />

You can also enforce type safety for your `.svg` assets using the `SvgComponent` type:

```astro title="src/components/Logo.astro"
---


interface Link {
  url: string;
  text: string;
  icon: SvgComponent;
}

const links: Link[] = [
  {
    url: "/",
    text: "Home",
    icon: HomeIcon,
  },
];
---
```

### Creating custom image components

You can create a custom, reusable image component by wrapping the `<Image />`  or `<Picture/>` component in another Astro component. This allows you to set default attributes and styles only once.

For example, you could create a component for your blog post images that receives attributes as props and applies consistent styles to each image:

```astro title="src/components/BlogPostImage.astro"
---

const { alt, src, ...attrs } = Astro.props;
---

<Image alt={alt} src={src} {...attrs} />

<style>
  img {
    margin-block: 2.5rem;
    border-radius: 0.75rem;
  }
</style>
```

## Display unprocessed images with the HTML `<img>` tag

The  also supports writing an `<img>` tag directly, with full control over its final output. These images will not be processed and optimized. It accepts all HTML `<img>` tag properties, and the only required property is `src`. However, it is strongly recommended to include .

### images in `src/`

Local images must be imported from the relative path from the existing `.astro` file, or you can configure and use an . Then, you can access the image's `src` and other properties to use in the `<img>` tag.

Imported image assets match the  and have the following signature:

```ts
interface ImageMetadata {
  src: string;
  width: number;
  height: number;
  format: string;
}
```

The following example uses the image's own `height` and `width` properties to avoid Cumulative Layout Shift (CLS) and improve Core Web Vitals:

```astro title="src/pages/posts/post-1.astro" "myDog.width" "myDog.height"
---
// import local images

---
// access the image properties
<img src={myDog.src} width={myDog.width} height={myDog.height} alt="A barking dog." />
```

### Images in `public/`
For images located within `public/` use the image's file path relative to the public folder as the `src` value:

```astro '"/images/public-cat.jpg"'
<img src="/images/public-cat.jpg" alt="A sleeping cat." >
```

### Remote images

For remote images, use the image's full URL as the `src` value:

```astro '"https://example.com/remote-cat.jpg"'
<img src="https://example.com/remote-cat.jpg" alt="A sleeping cat." >
```

### Choosing `<Image />` vs `<img>`

The `<Image />` component optimizes your image and infers width and height (for images it can process) based on the original aspect ratio to avoid CLS. It is the preferred way to use images in `.astro` files whenever possible.

Use the HTML `<img>` element when you cannot use the `<Image />` component, for example:
  - for unsupported image formats
  - when you do not want your image optimized by Astro
  - to access and change the `src` attribute dynamically client-side


## Using Images from a CMS or CDN

Image CDNs work with . Use an image's full URL as the `src` attribute in the `<Image />` component, an `<img>` tag, or in Markdown notation. For image optimization with remote images, also .

Alternatively, the CDN may provide its own SDKs to more easily integrate in an Astro project. For example:

- Cloudinary supports an  which allows you to easily drop in images with their `CldImage` component or a  that can generate URLs to use with an `<img>` tag in a Node.js environment.
- ImageKit provides an  that registers an image service. This means Astro's built-in `<Image />` and `<Picture />` components, along with Markdown `!` and MDX images, are all routed through ImageKit automatically. It adds CDN delivery, automatic AVIF/WebP conversion, responsive `srcset`, and on-the-fly transformations without changing your existing image syntax.

<ReadMore>See the full API reference for the  and  components.</ReadMore>

## Authorizing remote images

You can configure lists of authorized image source URL domains and patterns for image optimization using  and . This configuration is an extra layer of safety to protect your site when showing images from an external source.

Remote images from other sources will not be optimized, but using the `<Image />` component for these images will prevent Cumulative Layout Shift (CLS).

For example, the following configuration will only allow remote images from `astro.build` to be optimized:

```ts
// astro.config.mjs
export default defineConfig({
  image: {
    domains: ["astro.build"],
  }
});
```

The following configuration will only allow remote images from HTTPS hosts:

```ts
// astro.config.mjs
export default defineConfig({
  image: {
    remotePatterns: [{ protocol: "https" }],
  }
});
```

## Images in content collections

You can declare an associated image for a content collections entry, such as a blog post's cover image, in your frontmatter using its path relative to the current folder:

```md title="src/content/blog/my-post.md" {3}
---
title: "My first blog post"
cover: "./firstpostcover.jpeg" # will resolve to "src/content/blog/firstpostcover.jpeg"
coverAlt: "A photograph of a sunset behind a mountain range."
---

This is a blog post
```

The `image` helper for the content collections schema lets you validate and import the image.

```ts title="src/content.config.ts"


const blogCollection = defineCollection({
	schema: ({ image }) => z.object({
		title: z.string(),
		cover: image(),
		coverAlt: z.string(),
	}),
});

export const collections = {
	blog: blogCollection,
};
```

The image will be imported and transformed into metadata, allowing you to pass it as a `src` to `<Image/>`, `<img>`, or `getImage()` in an Astro component.

The example below shows a blog index page that renders the cover photo and title of each blog post from the previous schema:

```astro title="src/pages/blog.astro" {10}
---


const allBlogPosts = await getCollection("blog");
---

{
	allBlogPosts.map((post) => (
		<div>
			<Image src={post.data.cover} alt={post.data.coverAlt} />
			<h2>
				<a href={"/blog/" + post.id}>{post.data.title}</a>
			</h2>
		</div>
	))
}
```

## Generating images with `getImage()`

The `getImage()` function is intended for generating images destined to be used somewhere else than directly in HTML, for example in an . When you need options that the `<Picture>` and `<Image>` components do not currently support, you can use the `getImage()` function to create your own custom `<Image />` component.

`getImage()` can only be used on the server. If you need to use the resulting image URL on the client (e.g. in a client-side script or framework component), call `getImage()` inside the frontmatter and pass the resulting `src` to the client:

```astro title="src/components/ClientImage.astro"
---


const optimizedBackground = await getImage({ src: myBackground, format: "avif" });
---

<div id="background" data-src={optimizedBackground.src}></div>

<script>
  const src = document.getElementById("background")?.dataset.src;
  // use src client-side as needed
</script>
```

<ReadMore>See more in the .</ReadMore>

<RecipeLinks slugs={["en/recipes/build-custom-img-component" ]}/>

## Alt Text

Not all users can see images in the same way, so accessibility is an especially important concern when using images. Use the `alt` attribute to provide  for images.

This attribute is required for both the `<Image />` and `<Picture />` components. If no alt text is provided, a helpful error message will be provided reminding you to include the `alt` attribute.

If the image is merely decorative (i.e. doesn’t contribute to the understanding of the page), set `alt=""` so that screen readers know to ignore the image.

## Default image service

 is the default image service used for `astro:assets`. You can further configure the image service using the  option.

:::note
When using a  like `pnpm`, you may need to manually install Sharp into your project even though it is an Astro dependency:

```bash
pnpm add sharp
```
:::

### Configure no-op passthrough service

If your  does not support Astro's built-in Sharp image optimization (e.g. Cloudflare), you can configure a no-op image service to allow you to use the `<Image />` and `<Picture />` components. Note that Astro does not perform any image transformation and processing in these environments. However, you can still enjoy the other benefits of using `astro:assets`, including no Cumulative Layout Shift (CLS), the enforced `alt` attribute, and a consistent authoring experience.

Configure the `passthroughImageService()` to avoid Sharp image processing:

```js title="astro.config.mjs" ins={4-6} "passthroughImageService"

export default defineConfig({
  image: {
    service: passthroughImageService()
  }
});
```

## Asset Caching

Astro stores processed image assets in a cache directory during site builds for both local and . By preserving the cache directory between builds, processed assets are reused, improving build time and bandwidth usage.

The default cache directory is `./node_modules/.astro`, however this can be changed using the  configuration setting.

### Remote Images

Remote images in the asset cache are managed based on , and respect the  returned by the remote server.
Images are cached if the Cache-Control header allows, and will be used until they are no longer .

#### Revalidation

<p><Since v="5.1.0" /></p>

 reduces bandwidth usage and build time by checking with the remote server whether an expired cached image is still up-to-date. If the server indicates that the image is still fresh, the cached version is reused, otherwise the image is redownloaded.

Revalidation requires that the remote server send  and/or  headers with its responses. This feature is available for remote servers that support the  and  headers.

## Community Integrations

There are several third-party  for optimizing and working with images in your Astro project.
