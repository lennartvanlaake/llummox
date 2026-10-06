---
title: Config imports API Reference
sidebar:
  label: 'astro:config'
i18nReady: true
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 6
---



<p><Since v="5.7.0" /></p>

This virtual module `astro:config` exposes a non-exhaustive, serializable, type-safe version of the Astro configuration. There are two submodules for accessing different subsets of your configuration values:  and .

All available config values can be accessed from `astro:config/server`. However, for code executed on the client, only those values exposed by `astro:config/client` will be available.  This protects your information by only making some data available to the client.

## Imports from `astro:config/client`

The following helpers are imported from the `client` directory of the virtual config module.

```js

```

Use this submodule for client-side code:

```js title="src/utils.js" ins={1} ins="trailingSlash"

function addForwardSlash(path) {
  if (trailingSlash === "always") {
    return path.endsWith("/") ? path : path + "/"
  } else {
    return path
  }
}
```

See more about the configuration imports available from `astro:config/client`:

- 
- 
- 
- 
- 
- 



## Imports from `astro:config/server`

The following helpers are imported from the `server` directory of the virtual config module.

```js

```

These imports include everything available from `astro:config/client` as well as additional sensitive information about your file system configuration that is not safe to expose to the client.

Use this submodule for server side code:

```js title="astro.config.mjs"

export default defineConfig({
    integrations: [
      integration(),
    ]
});
```

```js title="integration.mjs" ins={1} ins="outDir"



export default function() {
  return {
    name: "internal-integration",
    hooks: {
      "astro:build:done": () => {
        let file = new URL("result.json", outDir);
        // generate data from some operation
        let data = JSON.stringify([]);
        writeFileSync(fileURLToPath(file), data, "utf-8");
      }
    }
  }
}
```

See more about the configuration imports available from `astro:config/server`:

- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

## Imports from `astro/config`

The following helpers are imported from the regular config module:

```js

```

### `defineConfig()`

<p>

**Type:** <code>(config: <a href="/en/reference/configuration-reference/">AstroUserConfig</a>) => AstroUserConfig</code>
</p>

Configures your project with type safety .

### `envField`

<p>

**Type:** `object`<br />
<Since v="5.0.0" />
</p>

Describes the supported data types when .

Each data type must define the  with `context` (`"client"` or `"server"`) and `access` (`"secret"` or `"public"`). In addition, you can define a `default` value, specify whether the variable is `optional` (default `false`), and some data types provide optional validation methods.

<ReadMore>Learn more about  in your Astro project.</ReadMore>

#### `envField.string()`

<p>

**Type:** `(options: StringFieldInput) => StringField`
</p>

Defines an environment variable of string type. You can perform  using the following properties: `max`, `min`, `length`, `url`, `includes`, `startsWith`, and `endsWith`.

The following example defines the expected shape for an environment variable storing an API URL:

```js title="astro.config.mjs" "envField"

export default defineConfig({
  env: {
    schema: {
      API_URL: envField.string({
        context: "client",
        access: "public",
        optional: false,
        default: "",
        min: 12,
        url: true,
        includes: "astro",
        startsWith: "https",
      }),
    }
  }
})
```

#### `envField.number()`

<p>

**Type:** `(options: NumberFieldInput) => NumberField`
</p>

Defines an environment variable of number type. You can perform  using the following properties: `gt`, `lt`, `min`, `max`, and `int`.

The following example defines the expected shape for an environment variable storing an API port:

```js title="astro.config.mjs" "envField"

export default defineConfig({
  env: {
    schema: {
      API_PORT: envField.number({
        context: "server",
        access: "public",
        optional: true,
        default: 4321,
        min: 2,
        int: true,
      }),
    }
  }
})
```

#### `envField.boolean()`

<p>

**Type:** `(options: BooleanFieldInput) => BooleanField`
</p>

Defines an environment variable of boolean type.

The following example defines the expected shape for an environment variable storing whether analytics are enabled:

```js title="astro.config.mjs" "envField"

export default defineConfig({
  env: {
    schema: {
      ANALYTICS_ENABLED: envField.boolean({
        context: "client",
        access: "public",
        optional: true,
        default: true,
      }),
    }
  }
})
```

#### `envField.enum()`

<p>

**Type:** `(options: EnumFieldInput<T>) => EnumField`
</p>

Defines an environment variable of enum type by providing the allowed `values` as an array.

The following example defines the expected shape for an environment variable storing the configured debug mode:

```js title="astro.config.mjs" "envField" {9}

export default defineConfig({
  env: {
    schema: {
      DEBUG_MODE: envField.enum({
        context: "server",
        access: "public",
        values: ['info', 'warnings', 'errors'], // required
        optional: true,
        default: 'errors',
      }),
    }
  }
})
```

### `fontProviders`

<p>

**Type:** `object`<br />
<Since v="6.0.0" />
</p>

Describes the  used .

### `getViteConfig()`

<p>

**Type:** <code>(userViteConfig: <a href="/en/reference/configuration-reference/#vite">ViteUserConfig</a>, inlineAstroConfig?: <a href="/en/reference/configuration-reference/">AstroInlineConfig</a>) => ViteUserConfigFn</code>
</p>

Retrieves the Vite configuration to use by merging a custom Vite configuration object and an optional Astro configuration object. This is useful .

### `memoryCache()`

<p>
**Type:** <code>(config?: <a href="/en/reference/cache-provider-reference/#memorycache-options">MemoryCacheProviderOptions</a>) => <a href="/en/reference/cache-provider-reference/#cacheproviderconfig">CacheProviderConfig\<MemoryCacheProviderOptions\></a></code>
</p>

See .

### `logHandlers`

<p>

**Type:** `object`<br />
<Since v="7.0.0" />
</p>

Describes the  that can be used to  in your Astro configuration.

### `mergeConfig()`

See .

### `passthroughImageService()`

<p>

**Type:** <code>() => <a href="/en/reference/modules/astro-assets/#imageserviceconfig">ImageServiceConfig</a></code>
</p>

Retrieves a no-op image service. This is useful when your adapter does not support Astro's built-in Sharp image optimization and you want to .

The following example defines `passthroughImageService()` as image service in the Astro configuration file to avoid Sharp image processing:

```js title="astro.config.mjs" "passthroughImageService"

export default defineConfig({
  image: {
    service: passthroughImageService()
  }
});
```

<ReadMore>Learn more about .</ReadMore>

### `sessionDrivers`

<p>

**Type:** `object`<br />
<Since v="5.7.0" />
</p>

Describes the  used .

The following example configures the Redis driver to enable sessions:

```js title="astro.config.mjs" "sessionDrivers"

export default defineConfig({
  session: {
    driver: sessionDrivers.redis({
      url: process.env.REDIS_URL
    }),
  }
})
```

<ReadMore>Learn more about  in your Astro project.</ReadMore>

### `sharpImageService()`

<p>

**Type:** <code>(config?: SharpImageServiceConfig) => <a href="/en/reference/modules/astro-assets/#imageserviceconfig">ImageServiceConfig</a></code><br />
<Since v="2.4.1" />
</p>

Retrieves the Sharp service used to process Astro’s image assets. This takes an optional object describing the .

### `validateConfig()`

See .
