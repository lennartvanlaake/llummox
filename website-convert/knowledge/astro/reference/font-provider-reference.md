---
title: Astro Font Provider API
sidebar:
  label: Font Provider API
i18nReady: true
---



<p>
<Since v="6.0.0" />
</p>

The  allows you to access fonts in a unified way. Each family requires the use of an Astro Font Provider, which either downloads font files from a remote service or loads local font files from disk.

## Built-in providers

Astro exports built-in font providers from `astro/config`:

```js

export default defineConfig({
  fonts: [{
    provider: fontProviders.local(),
    name: "Custom",
    cssVariable: "--font-custom",
    options: {
      variants: [
        {
          weight: 400,
          style: "normal",
          src: ["./src/assets/fonts/custom-400.woff2"]
        },
        {
          weight: 700,
          style: "normal",
          src: ["./src/assets/fonts/custom-700.woff2"]
        }
        // ...
      ]
    }
  }]
});
```

##### `weight`

<p>

**Type:** `number | string`<br />
**Default:** `undefined`
</p>

A :

```js
weight: 200
```

If the associated font is a , you can specify a range of weights:

```js
weight: "100 900"
```

When the value is not set, by default Astro will try to infer the value based on the first .

##### `style`

<p>

**Type:** `"normal" | "italic" | "oblique"`<br />
**Default:** `undefined`
</p>

A :

```js
style: "normal"
```

When the value is not set, by default Astro will try to infer the value based on the first .

##### `src`

<p>

**Type:** `(string | URL | { url: string | URL; tech?: string })[]`
</p>

Font . It can be a path relative to the root, a package import or a URL. URLs are particularly useful if you inject local fonts through an integration:

<Tabs>

<TabItem label="Relative path">

```js
src: ["./src/assets/fonts/MyFont.woff2", "./src/assets/fonts/MyFont.woff"]
```

</TabItem>

<TabItem label="URL">

```js
src: [new URL("./custom.ttf", import.meta.url)]
```

</TabItem>

<TabItem label="Package import">

```js
src: ["my-package/SomeFont.ttf"]
```

</TabItem>

</Tabs>

:::caution
We recommend not putting your font files in . Since Astro will copy these files into that folder at build time, this will result in duplicated files in your build output. Instead, store them somewhere else in your project, such as in .
:::

You can also specify a  by providing objects:

```js
src: [{ url:"./src/assets/fonts/MyFont.woff2", tech: "color-COLRv1" }]
```

##### Other properties

The following options from font families are also available for local font families within variants:

- 
- 
- 
- 
- 

```js title="astro.config.mjs" {14}

export default defineConfig({
  fonts: [{
    provider: fontProviders.local(),
    name: "Custom",
    cssVariable: "--font-custom",
    options: {
      variants: [
        {
          weight: 400,
          style: "normal",
          src: ["./src/assets/fonts/custom-400.woff2"],
          display: "block"
        }
      ]
    }
  }]
});
```

### NPM

Retrieves fonts from NPM packages, either from locally installed packages in `node_modules` or from a CDN:

```js
provider: fontProviders.npm()
```

The provider automatically detects fonts from your `package.json` dependencies and can resolve fonts from packages like `@fontsource/*`, `@fontsource-variable/*`, and other known font packages.

#### Provider options

The NPM provider accepts the following configuration options:

##### `cdn`

<p>

**Type:** `string`<br />
**Default:** `'https://cdn.jsdelivr.net/npm'`
</p>

CDN to use for fetching npm packages remotely:

```js
provider: fontProviders.npm({ cdn: 'https://esm.sh' })
```

##### `remote`

<p>

**Type:** `boolean`<br />
**Default:** `true`
</p>

Whether to fall back to fetching from the CDN when local resolution fails. Set to `false` to only resolve from locally installed packages:

```js
provider: fontProviders.npm({ remote: false })
```

#### Family options

The provider comes with the following family-specific options that can be added in the .

##### `package`

<p>

**Type:** `string`<br />
**Default:** Auto-detected or inferred from family name
</p>

The NPM package name. When not specified, the provider will try to find the font family in known font package patterns or infer based on Fontsource conventions:

```js
{
  // ...
  provider: fontProviders.npm(),
  options: {
    package: '@fontsource/roboto'
  }
}
```

##### `version`

<p>

**Type:** `string`<br />
**Default:** `'latest'`
</p>

The version of the package (used for CDN resolution only):

```js
{
  // ...
  provider: fontProviders.npm(),
  options: {
    version: '5.0.0'
  }
}
```

##### `file`

<p>

**Type:** `string`<br />
**Default:** `'index.css'`
</p>

The entry CSS file to parse from the package:

```js
{
  // ...
  provider: fontProviders.npm(),
  options: {
    file: 'latin.css'
  }
}
```

## Building a font provider

If you do not wish to use one of the  (e.g. you want to use a  or ), you can build your own.

The preferred method for implementing a custom font provider is to export a function that returns  and takes the  as a parameter.

### The font provider object

A `FontProvider` is an object containing required  and  properties. It also has optional ,  and  properties available.

The `FontProvider` type accepts a generic for family .

#### `name`

<p>

**Type:** `string`
</p>

A unique name for the provider, used in logs and for identification.

#### `resolveFont()`

<p>

**Type:** `(options: ResolveFontOptions) => Awaitable<{ fonts: FontFaceData[] } | undefined>`<br />
</p>

Used to retrieve and return font face data based on the given options.

#### `config`

<p>

**Type:** `Record<string, any>`<br />
**Default:** `undefined`
</p>

A serializable object, used for identification.

#### `init()`

<p>

**Type:** `(context: FontProviderInitContext) => Awaitable<void>`<br />
**Default:** `undefined`
</p>

Optional callback, used to perform any initialization logic.

##### `context.storage`

<p>

**Type:** `Storage`
</p>

Useful for caching.

##### `context.root`

<p>

**Type:** `URL`
</p>

The project root, useful for resolving local files paths.

#### `listFonts()`

<p>

**Type:** `() => Awaitable<string[] | undefined>`<br />
**Default:** `undefined`
</p>

Optional callback, used to return the list of available font names.

### Supporting a private registry

The following example defines a font provider for a private registry:

<Tabs syncKey="font-provider">

<TabItem label="Simple">

```ts title="font-provider.ts"


    },
    listFonts: () => {
      return Object.keys(data);
    },
    resolveFont: ({ familyName, ...rest }) => {
      const fonts = data[familyName];
      if (fonts) {
        return { fonts };
      }
      return undefined;
    },
  };
}
```

</TabItem>

<TabItem label="Provider options">

```ts title="font-provider.ts" {4-6,8,13}


}

export function registryFontProvider(config: Config): FontProvider {
  let data: Fonts = {}

  return {
    name: "registry",
    config,
    init: async () => {
      data = await retrieveFonts(token);
    },
    listFonts: () => {
      return Object.keys(data);
    },
    resolveFont: ({ familyName, ...rest }) => {
      const fonts = data[familyName];
      if (fonts) {
        return { fonts };
      }
      return undefined;
    },
  };
}
```

</TabItem>

<TabItem label="Family options">

```ts title="font-provider.ts" {4-6,8,20}


}

export function registryFontProvider(): FontProvider<FamilyOptions | undefined> {
  let data: Fonts = {}

  return {
    name: "registry",
    init: async () => {
      data = await retrieveFonts(token);
    },
    listFonts: () => {
      return Object.keys(data);
    },
    // options is typed as FamilyOptions | undefined
    resolveFont: ({ familyName, options, ...rest }) => {
      const fonts = data[familyName];
      if (fonts) {
        return { fonts };
      }
      return undefined;
    },
  };
}
```

</TabItem>

</Tabs>

You can then register this font provider in the Astro config:

<Tabs syncKey="font-provider">

<TabItem label="Simple">

```ts title="astro.config.ts"


export default defineConfig({
  fonts: [{
    provider: registryFontProvider(),
    name: "Custom",
    cssVariable: "--font-custom"
  }]
});
```

</TabItem>

<TabItem label="Provider options">

```ts title="astro.config.ts" {7}


export default defineConfig({
  fonts: [{
    provider: registryFontProvider({
      token: "..."
    }),
    name: "Custom",
    cssVariable: "--font-custom"
  }]
});
```

</TabItem>

<TabItem label="Family options">

```ts title="astro.config.ts" {7-9}


export default defineConfig({
  fonts: [{
    provider: registryFontProvider(),
    options: {
      minimal: true
    },
    name: "Custom",
    cssVariable: "--font-custom"
  }]
});
```

</TabItem>

</Tabs>

### Supporting a 3rd-party unifont provider

You can define an Astro font provider using a unifont provider under the hood:

<Tabs syncKey="font-provider">

<TabItem label="Simple">

```ts title="font-provider.ts" {3,5,6}



	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}
```

</TabItem>

<TabItem label="Provider options">

```ts title="font-provider.ts" {3,5,6}



	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		config,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}
```

</TabItem>

<TabItem label="Family options">

```ts title="font-provider.ts" {3,5,6-7}



	let initializedProvider: InitializedProvider<AcmeFamilyOptions> | undefined;
	return {
		name: provider._name,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}
```

</TabItem>

</Tabs>

You can then register this font provider in the Astro config:

<Tabs syncKey="font-provider">

<TabItem label="Simple">

```ts title="astro.config.ts"


export default defineConfig({
  fonts: [{
    provider: acmeFontProvider(),
    name: "Custom",
    cssVariable: "--font-custom"
  }]
});
```

</TabItem>

<TabItem label="Provider options">

```ts title="astro.config.ts" {7}


export default defineConfig({
  fonts: [{
    provider: acmeFontProvider({
      token: "..."
    }),
    name: "Custom",
    cssVariable: "--font-custom"
  }]
});
```

</TabItem>

<TabItem label="Family options">

```ts title="astro.config.ts" {7-9}


export default defineConfig({
  fonts: [{
    provider: acmeFontProvider(),
    options: {
      minimal: true
    },
    name: "Custom",
    cssVariable: "--font-custom"
  }]
});
```

</TabItem>

</Tabs>
