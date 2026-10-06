---
title: Image and Assets API Reference
sidebar:
  label: 'astro:assets'
i18nReady: true
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---


<p><Since v="3.0.0" /></p>

Astro provides built-in components and helper functions for optimizing and displaying your images. For features and usage examples, .

## Imports from `astro:assets`

The following helpers are imported from the virtual assets module:

```js

```

### `<Image />`

The `<Image />` component optimizes and transforms images.


```astro title="src/components/MyComponent.astro"
---
// import the Image component and the image


  import myImportedImage from '../assets/my-local-image.png';
  ---
  <Image src={myImportedImage} alt="descriptive text" />
  ```

- **Images in the `public/` folder** -  use the image's **file path relative to the public folder**:

  ```astro title="src/pages/index.astro" '"/images/my-public-image.png"'
  ---
  import { Image } from 'astro:assets';
  ---
  <Image
    src="/images/my-public-image.png"
    alt="descriptive text"
    width="200"
    height="150"
  />
  ```

- **Remote images** - use the image's **full URL** as the property value:

  ```astro title="src/pages/index.astro" '"https://example.com/remote-image.jpg"'
  ---
  import { Image } from 'astro:assets';
  ---
  <Image
    src="https://example.com/remote-image.jpg"
    alt="descriptive text"
    width="200"
    height="150"
  />
  ```

#### `alt` (required)

<p>

**Type:** `string`
</p>

Use the required `alt` attribute to provide a string of  for images.

If an image is merely decorative (i.e. doesn't contribute to the understanding of the page), set `alt=""` so that screen readers and other assistive technologies know to ignore the image.

#### `width` and `height` (required for images in `public/`)

<p>

**Type:** ``number | `${number}` | undefined``
</p>

These properties define the dimensions to use for the image.

When a `layout` type is set, these are automatically generated based on the image's dimensions and in most cases should not be set manually.

When using images in their original aspect ratio, `width` and `height` are optional. These dimensions can be automatically inferred from image files located in `src/`. For remote images, add  on the `<Image />` or `<Picture />` component or use .

However, both of these properties are required for images stored in your `public/` folder as Astro is unable to analyze these files.

#### `densities`

<p>

**Type:** ``(number | `${number}x`)[] | undefined``<br />
<Since v="3.3.0" />
</p>

A list of pixel densities to generate for the image.

The `densities` attribute is not compatible with having the `layout` prop or `image.layout` config set, and will be ignored if set.

If provided, this value will be used to generate a `srcset` attribute on the `<img>` tag. Do not provide a value for `widths` when using this value.

Densities that are equal to widths larger than the original image will be ignored to avoid upscaling the image.

```astro title="src/components/MyComponent.astro"
---


---
<Image
  src={myImage}
  width={myImage.width / 2}
  densities={[1.5, 2]}
  alt="A description of my image."
/>
```

```html
<!-- Output -->
<img
  src="/_astro/my_image.hash.webp"
  srcset="
    /_astro/my_image.hash.webp 1.5x
    /_astro/my_image.hash.webp 2x
  "
  alt="A description of my image."
  width="800"
  height="450"
  loading="lazy"
  decoding="async"
/>
```

#### `widths`

<p>

**Type:** `number[] | undefined`<br />
<Since v="3.3.0" />
</p>

A list of widths to generate for the image.

If provided, this value will be used to generate a `srcset` attribute on the `<img>` tag. A  must also be provided.

The `widths` and `sizes` attributes will be automatically generated for images using a `layout` property. Providing these values is generally not needed, but can be used to override any automatically generated values.

Do not provide a value for `densities` when using this value. Only one of these two values can be used to generate a `srcset`.

Widths that are larger than the original image will be ignored to avoid upscaling the image.

```astro title="src/components/MyComponent.astro"
---


---
<Image src="https://example.com/cat.png" inferSize alt="A cat sleeping in the sun." />
```

As of Astro 5.17.3, `inferSize` only fetches dimensions for . Remote images outside the allowlist are not fetched.

#### `priority`

<p>

**Type:** `boolean`<br />
**Default:** `false`<br />
<Since v="5.10.0" />
</p>

Allows you to automatically set the `loading`, `decoding`, and `fetchpriority` attributes to their optimal values for above-the-fold images.

```astro title="src/components/MyComponent.astro" "priority"
---


---
<Image src={myImage} priority alt="A description of my image" />
```

When `priority="true"` (or the shorthand syntax `priority`) is added to the `<Image />` or `<Picture />` component, it will add the following attributes to instruct the browser to load the image immediately:

```html
loading="eager"
decoding="sync"
fetchpriority="high"
```

These individual attributes can still be set manually if you need to customize them further.

#### `layout`

<p>

**Type:** `'constrained' | 'full-width' | 'fixed' | 'none'` <br />
**Default:** `image.layout | 'none'` <br />
<Since v="5.10.0" />
</p>

Determines how the image should resize when its container changes size. Can be used to override the default configured value for .

```astro title=MyComponent.astro
---


---
<Image src={myImage} alt="A description of my image." layout='constrained' width={800} height={600} />
```

When a layout is set, `srcset` and `sizes` attributes are automatically generated based on the image's dimensions and the layout type. The previous `<Image />` component will generate the following HTML output:

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

`layout` supports the following values:

- `constrained` - The image will scale down to fit the container, maintaining its aspect ratio, but will not scale up beyond the specified `width` and `height`, or the image's original dimensions.

  Use this if you want the image to display at the requested size where possible, but shrink to fit smaller screens. This matches the default behavior for images when using Tailwind. If you're not sure, this is probably the layout you should choose.

- `full-width` - The image will scale to fit the width of the container, maintaining its aspect ratio.

  Use this for hero images or other images that should take up the full width of the page.

- `fixed` - The image will maintain the requested dimensions and not resize. It will generate a `srcset` to support high density displays, but not for different screen sizes.

  Use this if the image will not resize, for example icons or logos smaller than any screen width, or other images in a fixed-width container.

- `none` - The image will not be responsive. No `srcset` or `sizes` will be automatically generated, and no styles will be applied.

  This is useful if you have enabled a default layout, but want to disable it for a specific image.

For example, with `constrained` set as the default layout, you can override any individual image's `layout` property:

```astro title="src/components/MyComponent.astro"
---


---
<Image src={myImage} alt="This will use constrained layout" width={800} height={600} />
<Image src={myImage} alt="This will use full-width layout" layout="full-width" />
<Image src={myImage} alt="This will disable responsive images" layout="none" />
```

The value for `layout` also defines the default styles applied to the `<img>` tag to determine how the image should resize according to its container:

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

#### `fit`

<p>

**Type:** `'contain' | 'cover' | 'fill' | 'none' | 'scale-down'` <br />
**Default:** `image.objectFit | 'cover'` <br />
<Since v="5.10.0" />
</p>

Defines how an image should be cropped if its aspect ratio is changed.

Values match those of CSS `object-fit`. Defaults to `cover`, or the value of  if set. Can be used to override the default `object-fit` styles.

#### `position`

<p>

**Type:** `string` <br />
**Default:** `image.objectPosition | 'center'` <br />
<Since v="5.10.0" />
</p>

Defines the position of the image crop for an image if the aspect ratio is changed.

Values match those of CSS `object-position`. Defaults to `center`, or the value of  if set. Can be used to override the default `object-position` styles.

#### `background`

<p>

**Type:** `string | undefined`<br />
<Since v="5.17.0" />
</p>

The background color to use when flattening an image to transform it into the requested output `format`.

By default, Sharp uses a black background when flattening an image. Specifying a different background color is especially useful when transforming images with transparent backgrounds to a format that does not support transparency (e.g. `.jpeg`):

```astro title="src/components/MyComponent.astro" "background"
---


---

<Image
  src={myImage}
  alt="A description of my image"
  format="jpeg"
  background="#ffffff"
/>
```

Values are passed directly to the image service. Sharp accepts .

### `<Picture />`

<p><Since v="3.3.0" /></p>

The `<Picture />` component generates an optimized image with multiple formats and/or sizes.


```astro title="src/pages/index.astro"
---



---

<Font cssVariable="--font-roboto" />
```

The `<Font />` component accepts the following properties:

#### `cssVariable` (required)

<p>

**Type:** `CssVariable`<br />
**Example type:** `"--font-roboto" | "--font-comic-sans" | ...`
</p>

The  registered in your Astro configuration:

```astro title="src/components/Head.astro" "cssVariable"
---

---

<Font cssVariable="--font-roboto" />
```

#### `preload`

<p>

**Type:** `boolean | { weight?: string | number; style?: string; subset?: string }[]`<br />
**Default:** `false`
</p>

Whether to output  or not. With the `preload` directive, the browser will immediately begin downloading all possible font links during page load:

```astro title="src/components/Head.astro" "preload"
---

---

<Font cssVariable="--font-roboto" preload />
```

Be very intentional about which fonts you preload. Preloading too many fonts can impact performance, as this can block loading other important resources or may download fonts that are not needed for the current page.

To selectively control which font files are preloaded, you can provide an array of objects describing any combination of font `weight`, `style`, or `subset` to preload:

```astro title="src/components/Head.astro" {7-10}
---

---

<Font
  cssVariable="--font-roboto"
  preload={[
    { subset: "latin", style: "normal" },
    { weight: "400" },
  ]}
/>
```

Variable weight font files will be preloaded if any weight within its range is requested. For example, a font file for font weight `100 900` will be included when `400` is specified in a `preload` object.

### `getImage()`

<p>

**Type:** <code>(options: <a href="#unresolvedimagetransform">UnresolvedImageTransform</a>) => Promise\<<a href="#getimageresult">GetImageResult</a>\></code>
</p>

:::caution
`getImage()` relies on server-only APIs and will throw an error on the client. 

If you need the resulting image URL client-side, you can .
:::

The `getImage()` function is intended for generating images destined to be used somewhere else than directly in HTML, for example in an . It also allows you to create your own custom `<Image />` component.

This takes an options object with the  (except `alt` and `sizes`) and returns a .

The following example generates an AVIF `background-image` for a `<div />`:

```astro title="src/components/Background.astro"
---


const { width, height } = await inferRemoteSize("https://example.com/cat.png");
```

### `getConfiguredImageService()`

<p>

**Type:** <code>() => Promise\<<a href="#imageservice">ImageService</a>\></code><br />
<Since v="2.1.3" />
</p>

Retrieves the resolved .

### `imageConfig`

<p>

**Type:** [`AstroConfig["image"]`](/en/reference/configuration-reference/#image-options)<br />
<Since v="3.0.9" />
</p>

The  set by the user and merged with all defaults.

### `fontData`

<p>

**Type:** <code>Record\<CssVariable, Array\<<a href="#fontdata-1">FontData</a>\>\></code><br />
<Since v="6.0.0" />
</p>

An object where each key is a  and the value is an array describing the associated fonts. Each font is an object containing an array of `src` available for that font and the following optional properties: `weight` and `style`:

```ts

const fontPath = fontData["--font-roboto"][0]?.src[0]?.url;

if (fontPath === undefined) {
  throw new Error("Cannot find the font path.");
}

const url = experimental_getFontFileURL(fontPath);
const buffer = await fetch(url).then((res) => res.arrayBuffer());
```

When called on a route , the request URL needs to be provided:

```ts "context.url"


export const prerender = false; // Not needed in 'server' mode

export const GET: APIRoute = async (context) => {
  // ...
  const fontPath = fontData["--font-roboto"][0]?.src[0]?.url;
  const url = experimental_getFontFileURL(fontPath, context.url);
  // ...
};
```

## `astro:assets` types

The following types are imported from the virtual assets module:

```ts

```

### `LocalImageProps`

<p>

**Type:** <code>ImageSharedProps\<T\> & \{ src: <a href="#imagemetadata-1">ImageMetadata</a> | Promise\<\{ default: ImageMetadata; \}\> }</code>
</p>

Describes the . This ensures that  matches the shape of an imported image.

<ReadMore>Learn more about  with an example usage.</ReadMore>

### `RemoteImageProps`

<p>

**Types:**
* `ImageSharedProps<T> & { src: string; inferSize: true; }`
* `ImageSharedProps<T> & { src: string; inferSize?: false | undefined; }`
</p>

Describes the . This ensures that when  is not provided or is set to `false`, both  are required.

### `FontData`

<p>

**Type:** `{ src: Array<{ url: string; format?: string; tech?: string }>; weight?: string; style?: string; subset?: string; }`<br />
<Since v="6.0.0" />
</p>

Describes the font data associated with a given font family.

#### `FontData.src`

<p>

**Type:** `Array<{ url: string; format?: string; tech?: string }>`
</p>

An array of objects describing the available font files for a given font family. Each object contains a `url` and, optionally, the associated  and .

#### `FontData.weight`

<p>

**Type:** `string`
</p>

Specifies the font weight (e.g. `400`, `600`).

#### `FontData.style`

<p>

**Type:** `string`
</p>

Specifies the font style (e.g. `normal`, `italic`).

#### `FontData.subset`

<p>

**Type:** `string`
<Since v="7.0.0" />
</p>

Specifies the font subset (e.g. `latin`, `cyrillic`).

## Imports from `astro/assets`

The following helpers are imported from the regular assets module:

```ts

```

### `baseService`

<p>

**Type:** <code>Omit\<<a href="#localimageservice">LocalImageService</a>, 'transform'\></code>
</p>

The built-in local image service which can be extended to .

The following example reuses the `baseService` to create a new image service:

```ts title="src/image-service.ts"

const newImageService = {
  getURL: baseService.getURL,
  parseURL: baseService.parseURL,
  getHTMLAttributes: baseService.getHTMLAttributes,
  async transform(inputBuffer, transformOptions) {
    /* ... */
  },
};
```

### `getConfiguredImageService()`

See  from `astro:assets`.

### `getImage()`

<p>

**Type:** <code>(options: <a href="#unresolvedimagetransform">UnresolvedImageTransform</a>, imageConfig: <a href="/en/reference/configuration-reference/#image-options">AstroConfig['image']</a>) => Promise\<<a href="#getimageresult">GetImageResult</a>\></code>
</p>

A function similar to  from `astro:assets` with two required arguments: an `options` object with  and a second object for the .

### `isLocalService()`

<p>

**Type:** <code>(service: <a href="#imageservice">ImageService</a> | undefined) => boolean</code>
</p>

Checks the type of an image service and returns `true` when this is a .

## `astro/assets` types

The following types are imported from the regular assets module:

```ts

```

### `LocalImageProps`

See  from `astro:assets`.

### `RemoteImageProps`

See  from `astro:assets`.

## Imports from `astro/assets/utils`

The following helpers are imported from the `utils` directory in the regular assets module and can be used to :

```ts

```

### `isRemoteAllowed()`

<p>

**Type:** <code>(src: string, \{ domains, remotePatterns \}: \{ domains: string[], remotePatterns: <a href="#remotepattern">RemotePattern</a>[] \}) => boolean</code><br />
<Since v="4.0.0" />
</p>

Determines whether a given remote resource, identified by its source URL, is allowed based on specified domains and remote patterns.


```ts

const url = new URL('https://example.com/images/test.jpg');
const domains = ['example.com', 'anotherdomain.com'];
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'images.example.com',
    pathname: '/**', // Allow any path under this hostname
  }
];

isRemoteAllowed(url.href, { domains, remotePatterns }); // Output: `true`
```

### `matchHostname()`

<p>

**Type:** `(url: URL, hostname?: string, allowWildcard = false) => boolean`<br />
<Since v="4.0.0" />
</p>

Matches a given URL's hostname against a specified hostname, with optional support for wildcard patterns.

```ts

const url = new URL('https://sub.example.com/path/to/resource');

matchHostname(url, 'example.com'); // Output: `false`
matchHostname(url, 'example.com', true); // Output: `true`
```

### `matchPathname()`

<p>

**Type:** `(url: URL, pathname?: string, allowWildcard = false) => boolean`<br />
<Since v="4.0.0" />
</p>

Matches a given URL's pathname against a specified pattern, with optional support for wildcards.

```ts

const testURL = new URL('https://example.com/images/photo.jpg');

matchPathname(testURL, '/images/photo.jpg'); // Output: `true`
matchPathname(testURL, '/images/'); // Output: `false`
matchPathname(testURL, '/images/*', true); // Output: `true`
```

### `matchPattern()`

<p>

**Type:** <code>(url: URL, remotePattern: <a href="#remotepattern">RemotePattern</a>) => boolean</code><br />
<Since v="4.0.0" />
</p>

Evaluates whether a given URL matches the specified remote pattern based on protocol, hostname, port, and pathname.

```ts

const url = new URL('https://images.example.com/photos/test.jpg');
const remotePattern = {
  protocol: 'https',
  hostname: 'images.example.com',
  pathname: '/photos/**', // Allow all files under /photos/
};

matchPattern(url, remotePattern); // Output: `true`
```

### `matchPort()`

<p>

**Type:** `(url: URL, port?: string) => boolean`<br />
**Default:** `true`<br />
<Since v="4.0.0" />
</p>

Checks if the given URL's port matches the specified port. If no port is provided, it returns `true`.

```ts

const urlWithPort = new URL('https://example.com:8080/resource');
const urlWithoutPort = new URL('https://example.com/resource');

matchPort(urlWithPort, '8080'); // Output: `true`
matchPort(urlWithoutPort, '8080'); // Output: `false`
```

### `matchProtocol()`

<p>

**Type:** `(url: URL, protocol?: string) => boolean`<br />
**Default:** `true`<br />
<Since v="4.0.0" />
</p>

Compares the protocol of the provided URL with a specified protocol. This returns `true` if the protocol matches or if no protocol is provided.

```ts

const secureUrl = new URL('https://example.com/resource');
const regularUrl = new URL('http://example.com/resource');

matchProtocol(secureUrl, 'https'); // Output: `true`
matchProtocol(regularUrl, 'https'); // Output: `false`
```

### `isESMImportedImage()`

<p>

**Type:** <code>(src: <a href="#imagemetadata-1">ImageMetadata</a> | string) => boolean</code><br />
<Since v="4.0.0" />
</p>

Determines if the given source is an ECMAScript Module (ESM) imported image.

```ts

const imageMetadata = {
  src: '/images/photo.jpg',
  width: 800,
  height: 600,
  format: 'jpg',
};
const filePath = '/images/photo.jpg';

isESMImportedImage(imageMetadata); // Output: `true`
isESMImportedImage(filePath); // Output: `false`
```

### `isRemoteImage()`

<p>

**Type:** <code>(src: <a href="#imagemetadata-1">ImageMetadata</a> | string) => boolean</code><br />
<Since v="4.0.0" />
</p>

Determines if the provided source is a remote image URL in the form of a string.

```ts

const imageUrl = 'https://example.com/images/photo.jpg';
const localImage = {
  src: '/images/photo.jpg',
  width: 800,
  height: 600,
  format: 'jpg',
};

isRemoteImage(imageUrl); // Output: `true`
isRemoteImage(localImage); // Output: `false`
```

### `resolveSrc()`

<p>

**Type:** <code>(src: <a href="#unresolvedimagetransformsrc">UnresolvedImageTransform['src']</a>) => Promise\<string | <a href="#imagemetadata-1">ImageMetadata</a>\></code><br />
<Since v="4.0.0" />
</p>

Returns the image source. This function ensures that if `src` is a Promise (e.g., a dynamic `import()`), it is awaited and the correct `src` is extracted. If `src` is already a resolved value, it is returned as-is.

```ts


const resolvedLocal = await resolveSrc(localImage);
// Example value: `{ src: '/@fs/home/username/dev/astro-project/src/images/photo.jpg', width: 800, height: 600, format: 'jpg' }`

const resolvedRemote = await resolveSrc("https://example.com/remote-img.jpg");
// Value: `"https://example.com/remote-img.jpg"`

const resolvedDynamic = await resolveSrc(import("./images/dynamic-image.jpg"))
// Example value: `{ src: '/@fs/home/username/dev/astro-project/src/images/dynamic-image.jpg', width: 800, height: 600, format: 'jpg' }`
```

### `imageMetadata()`

<p>

**Type:** <code>(data: Uint8Array, src?: string) => Promise\<Omit\<<a href="#imagemetadata-1">ImageMetadata</a>, 'src' | 'fsPath'\>\></code><br />
<Since v="4.0.0" />
</p>

Extracts image metadata such as dimensions, format, and orientation from the provided image data.

```ts

const binaryImage = new Uint8Array([/* ...binary image data... */]);
const sourcePath = '/images/photo.jpg';

const metadata = await imageMetadata(binaryImage, sourcePath);
// Example value:
// {
//    width: 800,
//    height: 600,
//    format: 'jpg',
//    orientation: undefined
// }
```

### `emitImageMetadata()`

<p>

**Type:** <code>(id: string | undefined, fileEmitter?: Rollup.EmitFile) => Promise\<(<a href="#imagemetadata-1">ImageMetadata</a> & \{ contents?: Buffer \}) | undefined\></code><br />
<Since v="5.7.0" />
</p>

Processes an image file and emits its metadata and optionally its contents. In build mode, the function uses `fileEmitter` to generate an asset reference. In development mode, it resolves to a local file URL with query parameters for metadata.

```ts

const imageId = '/images/photo.jpg';
const metadata = await emitImageMetadata(imageId);
// Example value:
// {
//    src: '/@fs/home/username/dev/astro-project/src/images/photo.jpg?origWidth=800&origHeight=600&origFormat=jpg',
//    width: 800,
//    height: 600,
//    format: 'jpg',
//    contents: Uint8Array([...])
// }
```


### `emitClientAsset()`

<p>

**Type:** <code>(pluginContext: <a href="https://rollupjs.org/plugin-development/#plugin-context">Rollup.PluginContext</a>, options: Rollup.EmitFile) => string</code><br />

<Since v="6.0.0" />
</p>

Emits a client asset that will be moved to the client directory for assets (e.g. `dist/client/_astro/`) during SSR builds. This function is intended for integration authors who need to emit assets (such as images) from server-rendered content that should be available on the client.

Use this instead of  directly when working in a Vite plugin context and you need the emitted asset to be moved to the client output directory.

```ts

function myVitePlugin() {
  return {
    name: 'my-plugin',
    transform(code, id) {
      const handle = emitClientAsset(this, {
        type: 'asset',
        name: 'my-image.png',
        source: imageBuffer,
      });
      // Returns the asset handle similar to `emitFile()`
    }
  }
}
```

### `getOrigQueryParams()`

<p>

**Type:** <code>(params: URLSearchParams) => Pick\<<a href="#imagemetadata-1">ImageMetadata</a>, 'width' | 'height' | 'format'\> | undefined</code><br />
<Since v="4.0.0" />
</p>

Retrieves the `width`, `height`, and `format` of an image from a . If any of these parameters are missing or invalid, the function returns `undefined`.

```ts

const url = new URL('https://example.com/image.jpg?width=800&height=600&format=jpg');
const origParams = getOrigQueryParams(url.searchParams);
// Example value:
// {
//    width: 800,
//    height: 600,
//    format: 'jpg'
// }
```

### `inferRemoteSize()`

<p>

**Type:** <code>(url: string) => Promise\<Omit\<<a href="#imagemetadata-1">ImageMetadata</a>, 'src' | 'fsPath'\>\></code><br />
<Since v="4.0.0" />
</p>

Infers the dimensions of a remote image by streaming its data and analyzing it progressively until sufficient metadata is available.

```ts

const remoteImageUrl = 'https://example.com/image.jpg';
const imageSize = await inferRemoteSize(remoteImageUrl);
// Example value:
// {
//    width: 1920,
//    height: 1080,
//    format: 'jpg'
// }
```

### `propsToFilename()`

<p>

**Type:** <code>(filePath: string, transform: <a href="#imagetransform">ImageTransform</a>, hash: string) => string</code><br />
<Since v="4.0.0" />
</p>

Generates a formatted filename for an image based on its source path, transformation properties, and a unique hash.

The formatted filename follows this structure:

`<prefixDirname>/<baseFilename>_<hash><outputExtension>`

- `prefixDirname`: If the image is an ESM imported image, this is the directory name of the original file path; otherwise, it will be an empty string.
- `baseFilename`: The base name of the file or a hashed short name if the file is a `data:` URI.
- `hash`: A unique hash string generated to distinguish the transformed file.
- `outputExtension`: The desired output file extension derived from the `transform.format` or the original file extension.

```ts

const filePath = '/images/photo.jpg';
const transform = { format: 'png', src: filePath };
const hash = 'abcd1234';

const filename = propsToFilename(filePath, transform, hash);
// Example value: '/images/photo_abcd1234.png'
```

### `hashTransform()`

<p>

**Type:** <code>(transform: <a href="#imagetransform">ImageTransform</a>, imageService: string, propertiesToHash: string[]) => string</code><br />
<Since v="4.0.0" />
</p>

Transforms the provided `transform` object into a hash string based on selected properties and the specified `imageService`.

```ts

const transform = {
  src: '/images/photo.jpg',
  width: 800,
  height: 600,
  format: 'jpg',
};
const imageService = 'astro/assets/services/sharp';
const propertiesToHash = ['width', 'height', 'format'];

const hash = hashTransform(transform, imageService, propertiesToHash);
// Example value: 'd41d8cd98f00b204e9800998ecf8427e'
```

## `astro` types

```ts

```

### `GetImageResult`

<p>

**Type:** `object`<br />
<Since v="2.2.0" />
</p>

Describes the result of the transformation after the call to .

#### `GetImageResult.attributes`

<p>

**Type:** `Record<string, any>`
</p>

Defines the additional HTML attributes needed to render the image (e.g. width, height, style).

#### `GetImageResult.options`

<p>

**Type:** 
</p>

Describes the transformation settings after validation.

#### `GetImageResult.rawOptions`

<p>

**Type:** 
</p>

Describes the original transformation settings.

#### `GetImageResult.src`

<p>

**Type:** `string`
</p>

The path to the generated image.

#### `GetImageResult.srcSet`

<p>

**Type:** <code>\{ values: \{ transform: <a href="#imagetransform">ImageTransform</a>; descriptor?: string; attributes?: Record\<string, any\>; url: string; \}[]; attribute: string; \}</code><br />
<Since v="3.3.0" />
</p>

An object describing how to render the .

##### `GetImageResult.srcSet.values`

<p>

**Type:** <code>\{ transform: <a href="#imagetransform">ImageTransform</a>; descriptor?: string; attributes?: Record\<string, any\>; url: string; \}[]</code>
</p>

An array of generated values where each entry includes a URL and a size descriptor. This can be used to manually generate the value of the `srcset` attribute.

##### `GetImageResult.srcSet.attribute`

<p>

**Type:** `string`
</p>

A value ready to use in the `srcset` attribute.

### `ImageTransform`

<p>

**Type:** `object`
</p>

Defines the options accepted by the image transformation service. This contains a required `src` property, optional predefined properties, and any additional properties required by the image service.

The predefined properties match those accepted by the , except for `alt` and `sizes`. The following properties use different types.

#### `ImageTransform.src`

<p>

**Type:** <code><a href="#imagemetadata-1">ImageMetadata</a> | string</code>
</p>

Defines the path to a local image in the `public` directory, the URL of a remote image, or the data from an imported image.

#### `ImageTransform.width`

<p>

**Type:** `number | undefined`
</p>

The width of the image.

#### `ImageTransform.height`

<p>

**Type:** `number | undefined`
</p>

The height of the image.

### `UnresolvedImageTransform`

<p>

**Type:** <code>Omit\<<a href="#imagetransform">ImageTransform</a>, "src"\> & \{ src: <a href="#imagemetadata-1">ImageMetadata</a> | string | Promise\<\{ default: ImageMetadata \}\>; inferSize?: boolean; \}</code>
</p>

Represents an image with transformation options. This contains the same properties as the  with a different `src` type and an additional `inferSize` property.

#### `UnresolvedImageTransform.src`

<p>

**Type:** <code><a href="#imagemetadata-1">ImageMetadata</a> | string | Promise\<\{ default: ImageMetadata \}\></code>
</p>

The path to an image imported or located in the `public` directory, or the URL of a remote image.

#### `UnresolvedImageTransform.inferSize`

<p>

**Type:** `boolean`
</p>

Determines whether the width and height of the image should be inferred.

<ReadMore>See also the  available on `<Image />`.</ReadMore>

### `ImageMetadata`

<p>

**Type:** <code>\{ src: string; width: number; height: number; format: <a href="#imageinputformat">ImageInputFormat</a>; orientation?: number; \}</code><br />
<Since v="2.1.3" />
</p>

Describes the data collected during image import. This contains the following properties:

#### `ImageMetadata.src`

<p>

**Type:** `string`
</p>

The absolute path of the image on the filesystem.

#### `ImageMetadata.width`

<p>

**Type:** `number`
</p>

The width of the image.

#### `ImageMetadata.height`

<p>

**Type:** `number`
</p>

The height of the image.

#### `ImageMetadata.format`

<p>

**Type:** 
</p>

The format of the image.

#### `ImageMetadata.orientation`

<p>

**Type:** `number`<br />
<Since v="2.8.3" />
</p>

The image orientation when its metadata contains this information.

### `ImageInputFormat`

<p>

**Type:** `"jpeg" | "jpg" | "png" | "tiff" | "webp" | "gif" | "svg" | "avif"`<br />
<Since v="2.2.0" />
</p>

Describes a union of supported formats for imported images.

### `ImageOutputFormat`

<p>

**Type:** `string | "jpeg" | "jpg" | "png" | "webp" | "svg" | "avif"`<br />
<Since v="2.2.0" />
</p>

Specifies the format for output images. This can be a predefined literal or any string.

### `ImageQuality`

<p>

**Type:** <code><a href="#imagequalitypreset">ImageQualityPreset</a> | number</code><br />
<Since v="2.2.0" />
</p>

Represents the perceptual quality of the output image as a union of predefined literals, a string, or a number.

### `ImageQualityPreset`

<p>

**Type:** `string | "low" | "mid" | "high" | "max"`<br />
<Since v="2.2.0" />
</p>

Defines the available presets to control image quality, extensible with any string.

### `RemotePattern`

<p>

**Type:** `{ hostname?: string; pathname?: string; protocol?: string; port?: string; }`<br />
<Since v="5.14.2" />
</p>

Describes a remote host through four optional properties: `hostname`, `pathname`, `protocol`, and `port`.

### `ImageService`

<p>

**Type:** <code><a href="#externalimageservice">ExternalImageService</a> | <a href="#localimageservice">LocalImageService</a></code>
</p>

Defines the hooks that a local or external image service must provide.

### `ExternalImageService`

<p>

**Type:** `object`
</p>

Defines the hooks that an external image transformation service must provide. This requires a  and supports .

<ReadMore>Learn how to build  in the Image Service API reference with example usage.</ReadMore>

### `LocalImageService`

<p>

**Type:** `object`
</p>

Defines the hooks that a local image transformation service must provide. This requires , , and   hooks, and supports .

<ReadMore>Learn how to build  in the Image Service API reference with example usage.</ReadMore>

### `ImageServiceConfig`

<p>

**Type:** `{ entrypoint: 'astro/assets/services/sharp' | string; config?: T; }`<br />
<Since v="2.3.3" />
</p>

Describes the configuration object for an image service. This contains the following properties:

#### `ImageServiceConfig.entrypoint`

<p>

**Type:** `'astro/assets/services/sharp' | string`
</p>

A package or path to the image service module. This can be Astro's built-in Sharp service or a third-party service.

#### `ImageServiceConfig.config`

<p>

**Type:** `Record<string, any>`
</p>

A configuration object passed to the image service. The shape depends on the specific service being used.
