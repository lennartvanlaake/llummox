---
title: Authentication
description: An intro to authentication in Astro
i18nReady: true
---


export const prerender = false; // Not needed in 'server' mode

export const ALL: APIRoute = async (ctx) => {
	return auth.handler(ctx.request);
};
```

Follow the  to learn more.

### Usage

Better Auth offers a `createAuthClient()` helper for various frameworks, including Vanilla JS, React, Vue, Svelte, and Solid. 

For example, to create a client for React, import the helper from `'better-auth/react'`:

<UIFrameworkTabs>
  <Fragment slot="react">
   ```ts title="src/lib/auth-client.ts"
  import { createAuthClient } from 'better-auth/react';

  export const authClient = createAuthClient();

  export const { signIn, signOut } = authClient;
  ```
  </Fragment>
  <Fragment slot="solid">
  ```ts title="src/lib/auth-client.ts"
  import { createAuthClient } from 'better-auth/solid';

  export const authClient = createAuthClient();

  export const { signIn, signOut } = authClient;
  ```
  </Fragment>
  <Fragment slot="svelte">
   ```ts title="src/lib/auth-client.ts"
  import { createAuthClient } from 'better-auth/svelte';

  export const authClient = createAuthClient();

  export const { signIn, signOut } = authClient;
  ```
  </Fragment>
  <Fragment slot="vue">
  ```ts title="src/lib/auth-client.ts"
  import { createAuthClient } from 'better-auth/vue';

  export const authClient = createAuthClient();

  export const { signIn, signOut } = authClient;
  ```
  </Fragment>
</UIFrameworkTabs>

Once your client is set up, you can use it to authenticate users in your Astro components or any framework-specific files. The following example adds the ability to log in or log out with your configured `signIn()` and `signOut()` functions.


```astro title="src/pages/index.astro"
---

---

<Layout>
  <button id="login">Login</button>
  <button id="logout">Logout</button>

  <script>
    const { signIn, signOut } = await import("../lib/auth-client");
    const loginButton = document.querySelector<HTMLButtonElement>("#login");
    const logoutButton = document.querySelector<HTMLButtonElement>("#logout");

    if (!loginButton || !logoutButton) throw new Error("Buttons not found");

    loginButton.onclick = () =>
      signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });
    logoutButton.onclick = () => signOut();
  </script>
</Layout>
```

You can then use the `auth` object to get the user's session data in your server-side code. The following example personalizes page content by displaying an authenticated user's name:

```astro title="src/pages/index.astro"
---

---

<p>{session.user?.name}</p>
```

You can also use the `auth` object to protect your routes. The following example uses  with  to require an authenticated session for every route under `/dashboard`, redirecting to the home page otherwise:

```ts title="src/fetch.ts"



// Protect every route under /dashboard.
app.use("/dashboard", requireAuth);
app.use("/dashboard/*", requireAuth);

// Run Astro's built-in pipeline for all other requests.
app.use(astro());

export default app;

async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.redirect("/");
  }
  return next();
}
```

:::caution
The public pathname a middleware sees is not guaranteed to be the same as the route Astro matches internally: a configured `base`, URL encoding, and duplicate slashes can all cause them to differ. An attacker can exploit that gap to reach a protected route with a pathname your check does not recognize.

Do not authorize requests by matching `context.url.pathname` against a string (e.g. `context.url.pathname === "/dashboard"` or `context.url.pathname.startsWith("/dashboard")`). Instead, restrict access on a router that matches routes for you.
:::

### Next Steps

- 
- 
- 
- 

## Clerk

Clerk is a complete suite of embeddable UIs, flexible APIs, and admin dashboards to authenticate and manage your users. An  is available.

### Installation

Install `@clerk/astro` using the package manager of your choice.

<PackageManagerTabs>
  <Fragment slot="npm">
  ```shell
  npm install @clerk/astro
  ```
  </Fragment>
  <Fragment slot="pnpm">
  ```shell
  pnpm add @clerk/astro
  ```
  </Fragment>
  <Fragment slot="yarn">
  ```shell
  yarn add @clerk/astro
  ```
  </Fragment>
</PackageManagerTabs>

### Configuration

Follow  to set up Clerk integration and middleware in your Astro project.

### Usage

Clerk provides components that allow you to control the visibility of pages based on your user's authentication state. Show logged out users a sign in button instead of the content available to users who are logged in:

```astro title="src/pages/index.astro"
---


export const prerender = false; // Not needed in 'server' mode
---

<Layout>
  <Show when="signed-in">
    <UserButton />
  </Show>
  <Show when="signed-out">
    <SignInButton />
  </Show>
</Layout>
```

Clerk also allows you to protect routes on the server using middleware:

<Steps>

1. Set `clerkMiddleware()` as the `onRequest` handler in your middleware:

    ```ts title="src/middleware.ts"
    import { clerkMiddleware } from "@clerk/astro/server";

    export const onRequest = clerkMiddleware({
      /* options */
    });
    ```

2. Access the authentication state in your pages and API routes with `locals.auth()`. This allows you to check if a user is authenticated and take appropriate actions (e.g. redirecting to the sign-in page or returning a different response).

    <Tabs>
      <TabItem label="Pages">
      ```astro title="src/pages/dashboard.astro"
      ---
      const { isAuthenticated, redirectToSignIn } = Astro.locals.auth();

      if (!isAuthenticated) return redirectToSignIn();
      ---

      <h1>Dashboard</h1>
      ```
      </TabItem>
      <TabItem label="API routes">
      ```ts title="src/pages/api/data.ts"
      import type { APIRoute } from "astro";

      export const GET: APIRoute = ({ locals }) => {
        const { isAuthenticated, userId } = locals.auth();

        if (!isAuthenticated) {
          return new Response("Unauthorized", { status: 401 });
        }

        return Response.json({ userId });
      };
      ```
      </TabItem>
    </Tabs>
</Steps>

### Next Steps

- Read the 
- Start from a template with the 

## Lucia

 is a resource for implementing session-based authentication in a number of frameworks, including Astro.

### Guides

<Steps>

1. Create a  with your chosen database.
2. Add  using endpoints and middleware.
3. Implement  using the APIs you implemented.

</Steps>

### Examples

- 
- 
- 
- 

## Scalekit

 is an authentication platform for B2B and AI applications. It manages the full OAuth 2.0 and OIDC flow, supporting methods such as social login, enterprise SSO, and magic links. It then returns tokens and a user profile without requiring a custom login UI.

A single Scalekit environment can support multiple applications. This allows you to authenticate once and share the same session across all your properties (e.g. `app.yourcompany.com` and `docs.yourcompany.com`).

### Guide

Follow the  to add authentication to your Astro SSR project using social login, enterprise SSO, and more.

### Examples

- 
- 

## Community Resources

- 
