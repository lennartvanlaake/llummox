---
title: Astro Session Driver API
sidebar:
  label: Session Driver API
i18nReady: true
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 4
---

Astro  allow you to share data between requests for on-demand rendered pages. They require an Astro Session Driver to store session data.

## Built-in drivers

Astro exports built-in session drivers from `astro/config`:

```js

}

export function memoryDriver(config: Config = {}): SessionDriverConfig {
    return {
        entrypoint: new URL('./runtime.js', import.meta.url),
        config,
    }
}
```

It is then registered in the Astro config:

```ts title="astro.config.ts"

export function configuredRedisDriver(): SessionDriverConfig {
  return {
    entrypoint: "unstorage/drivers/redis",
    config: {
      tls: true,
    },
  };
}
```

You can also import an Unstorage driver and wrap it in your own implementation. This can be useful if you want to add extra logic to the driver or .

The following example implements a Redis driver with a default `ttl` of 7 days:

```ts title="driver/runtime.ts"


export default function (config: RedisOptions): SessionDriver {
  const driver = redisDriver({
    ...config,
    ttl: config.ttl ?? 60 * 60 * 24 * 7, // default to 7 days
  });

  return {
    async getItem(key) {
      return await driver.getItem(key);
    },
    async setItem(key, value) {
      await driver.setItem?.(key, value, {});
    },
    async removeItem(key) {
      await driver.removeItem?.(key, {});
    },
  };
}
```
