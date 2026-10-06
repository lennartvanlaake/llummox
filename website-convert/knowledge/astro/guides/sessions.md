---
title: Sessions
description: Share data between requests for on-demand rendered pages.
i18nReady: true
---





<p>
<Since v="5.7.0" />
</p>

Sessions are used to share data between requests for . 

Unlike , sessions are stored on the server, so you can store larger amounts of data without worrying about size limits or security issues. They are useful for storing things like user data, shopping carts, and form state, and they work without any client-side JavaScript:

```astro title="src/components/CartButton.astro" {3}
---
export const prerender = false; // Not needed with 'server' output
const cart = await Astro.session?.get('cart');
---

<a href="/checkout">🛒 {cart?.length ?? 0} items</a>
```

## Configuring sessions

Sessions require a storage driver to store the session data. The , , and  adapters automatically configure a default driver for you, but other adapters currently require you to . 

```js title="astro.config.mjs" ins={7-9} ins=" sessionDrivers "

    import redisDriver from "unstorage/drivers/redis";
    import { REDIS_HOST, REDIS_PORT } from "astro:env/server";

    export default function (): SessionDriver {
      const driver = redisDriver({
        host: REDIS_HOST,
        port: REDIS_PORT,
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

3. Use this file as the driver's entrypoint in your Astro configuration:
    ```js title="astro.config.mjs" {21-23}
    import { defineConfig, envField, sessionDrivers } from "astro/config";
    import vercel from "@astrojs/vercel";

    export default defineConfig({
      adapter: vercel(),
      env: {
        schema: {
          REDIS_HOST: envField.string({
            context: "server",
            access: "public",
            default: "localhost",
          }),
          REDIS_PORT: envField.number({
            context: "server",
            access: "public",
            default: 6379,
          }),
        },
      },
      session: {
        driver: {
          entrypoint: new URL("./src/session-driver.ts", import.meta.url),
        },
      },
    });
    ```
</Steps>

### Disabling sessions

<p>
<Since v="7.2.0" />
</p>

The session runtime is automatically excluded from your server bundle whenever no session driver is configured. Setting `session: false` additionally tells your adapter not to provide its default driver, opting your project out of session support entirely:

```js title="astro.config.mjs" ins={4}

export default defineConfig({
  session: false,
});
```

Adapters that normally provide a default session driver (e.g. , , and ) will not configure one. This can be useful for serverless and edge runtimes, where a smaller bundle reduces cold start time.

## Interacting with session data

The  allows you to interact with the stored user state (e.g. adding items to a shopping cart) and the session ID (e.g. deleting the session ID cookie when logging out). The object is accessible as `Astro.session` in your Astro components and pages and as `context.session` object in API endpoints, middleware, and actions.

The session is generated automatically when it is first used and can be regenerated at any time with  or destroyed with .

For many use cases, you will only need to use  and . 

<ReadMore>
See  for more details.
</ReadMore>

### Astro components and pages

In `.astro` components and pages, you can access the session object via the global `Astro` object. For example, to display the number of items in a shopping cart:

```astro title="src/components/CartButton.astro" "Astro.session"
---
export const prerender = false; // Not needed with 'server' output
const cart = await Astro.session?.get('cart');
---

<a href="/checkout">🛒 {cart?.length ?? 0} items</a>
```

### API endpoints

In API endpoints, the session object is available on the `context` object. For example, to add an item to a shopping cart:

```ts title="src/pages/api/addToCart.ts" "context.session"

export async function POST(context: APIContext) {
  const cart = await context.session?.get('cart') || [];
  const data = await context.request.json();
  if(!data?.item) {
    return new Response('Item is required', { status: 400 });
  }
  cart.push(data.item);
  await context.session?.set('cart', cart);
  return Response.json(cart);
}
```

### Actions

In actions, the session object is available on the `context` object. For example, to add an item to a shopping cart:

```ts title="src/actions/addToCart.ts" "context.session"


export const server = {
  addToCart: defineAction({
    input: z.object({ productId: z.string() }),
    handler: async (input, context) => {
      const cart = await context.session?.get('cart');
      cart.push(input.productId);
      await context.session?.set('cart', cart);
      return cart;
    },
  }),
};
```

### Middleware

:::note
Sessions are not supported in edge middleware.
:::

In middleware, the session object is available on the `context` object. For example, to set the last visit time in the session:

```ts title="src/middleware.ts" "context.session"

export const onRequest = defineMiddleware(async (context, next) => {
  context.session?.set('lastVisit', new Date());
  return next();
});
```

## Session data types

By default session data is untyped, and you can store arbitrary data in any key. Values are serialized and deserialized using , which is the same library used in content collections and actions. This means that supported types are the same, and include strings, numbers, `Date`, `Map`, `Set`, `URL`, arrays, and plain objects.

You can optionally  for your session data by creating a `src/env.d.ts` file and adding a declaration for the `App.SessionData` type:

```ts title="src/env.d.ts"
declare namespace App {
  interface SessionData {
    user: {
      id: string;
      name: string;
    };
    cart: string[];
  }
}
```

This will allow you to access the session data with type-checking and auto-completion in your editor:

```ts title="src/components/CartButton.astro"
---
const cart = await Astro.session?.get('cart');
// const cart: string[] | undefined

const something = await Astro.session?.get('something');
// const something: any

Astro.session?.set('user', { id: 1, name: 'Houston' });
// Error: Argument of type '{ id: number; name: string }' is not assignable to parameter of type '{ id: string; name: string; }'.
---
```

:::caution
This is only used for type-checking and does not affect the runtime behavior of the session. Take extra care if you change the type when users have stored data in the session, as this could cause runtime errors.
:::
