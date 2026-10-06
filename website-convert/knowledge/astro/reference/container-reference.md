---
title: Astro Container API (experimental)
sidebar:
  label: Container API (experimental)
i18nReady: true
---

const container = await experimental_AstroContainer.create();
```

It accepts an object with the following options:


```ts
export type AstroContainerOptions = {
  streaming?: boolean;
  renderers?: AddServerRenderer[];
};

export type AddServerRenderer =
	| {
			renderer: NamedSSRLoadedRendererValue;
			name: never;
	  }
	| {
			renderer: SSRLoadedRendererValue;
			name: string;
	  };
```

### `streaming` option

<p>

**Type:** `boolean`<br />
**Default:** `false`
</p>

Enables rendering components using .

### `renderers` option

<p>

**Type:** `AddServerRenderer[]`<br />
**Default:** `[]`
</p>

A list of loaded client renderers required by the component. Use this if your `.astro` component renders any  or MDX using an official Astro integration (e.g. React, Vue, etc.).

Renderers can be added through the Container API automatically for static applications, or cases where the container isn't called at runtime (e.g. testing with `vitest`).

For , or cases where the container is called at runtime or inside other "shells" (e.g. PHP, Ruby, Java, etc.), renderers must be manually imported.

#### Adding a renderer through the Container API

For each official Astro integration, import and use the `getContainerRenderer()` helper function from its dedicated `container-renderer` entrypoint to expose its client and server rendering scripts. These entrypoints are available for `@astrojs/react`, `@astrojs/preact`, `@astrojs/solid-js`, `@astrojs/svelte`, `@astrojs/vue`, and `@astrojs/mdx`.

For renderer packages outside the `@astrojs` npm org, look in their documentation for `getContainerRenderer()` or a similar function provided.

When using `vite` (`vitest`, Astro integrations, etc.), the renderers are loaded with the function `loadRenderers()` from the virtual module `astro:container`.
 
:::caution
Outside `vite` or for on-demand usage, you'll have to .
:::

The following example provides the necessary object to render an Astro component that renders a React component and a Svelte component: 

```js





const renderers = await loadRenderers([
  reactContainerRenderer(),
  svelteContainerRenderer(),
]);
const container = await experimental_AstroContainer.create({
  renderers,
});
const result = await container.renderToString(ReactWrapper);
```

#### Adding a renderer manually

When the container is called at runtime, or inside other "shells", the `astro:container` virtual module's helper functions are not available.  You must import the necessary server and client renderers manually and store them inside the container using `addServerRenderer` and `addClientRenderer`.

Server renderers are required to build your project, and must be stored in the container for every framework used. Client renderers are additionally needed to any hydrate client-side components using .

Only one import statement is needed per framework. Importing a renderer makes both the server and client renderers available to your container. However, **server renderers must be added to your container before client renderers**. This allows your entire container to render first, and then hydrate any interactive components.

The following example manually imports the necessary server renderers to be able to display static Vue components and `.mdx` pages. It additionally adds both server and client renderers for interactive React components.

```js




const container = await experimental_AstroContainer.create();
container.addServerRenderer({ renderer: vueRenderer });
container.addServerRenderer({ renderer: mdxRenderer });

container.addServerRenderer({ renderer: reactRenderer });
container.addClientRenderer({
  name: "@astrojs/react",
  entrypoint: "@astrojs/react/client.js",
});
```

## `renderToString()`

<p>

**Type:** <code>(component: AstroComponentFactory; options?: <a href="#rendering-options">ContainerRenderOptions</a>) => Promise&lt;string&gt;</code>
</p>

This function renders a specified component inside a container. It takes an Astro component as an argument and it returns a string that represents the HTML/content rendered by the Astro component.

```js title="tests/Card.test.js"


const container = await experimental_AstroContainer.create();
const result = await container.renderToString(Card);
```

Under the hood, this function calls  and `Response.text()`. 

It also accepts an object as a second argument that can contain a .

## `renderToResponse()`

<p>

**Type:** <code>(component: AstroComponentFactory; options?: <a href="#rendering-options">ContainerRenderOptions</a>) => Promise&lt;Response&gt;</code>
</p>

It renders a component, and it returns a `Response` object.

```js title="tests/Card.test.js"


const container = await experimental_AstroContainer.create();
const result = await container.renderToResponse(Card);
```

It also accepts an object as a second argument that can contain a .

## `renderComponent()`

<p>

  **Type:** <code>(component: AstroComponentFactory; options?: Omit\<<a href="#rendering-options">ContainerRenderOptions</a>, 'routeType'\>) => Promise&lt;string&gt;</code><br />
  <Since v="7.3.5" />
</p>

A function that returns the HTML for a component, including its scripts and styles. It takes an Astro component imported with the `?container` query string as an argument.

The container renders only scripts and styles that are inlined. Assets imported by any resolution (e.g. `@import`, `import ... from`) aren't rendered.

```js title="tests/Card.test.js" ins="?container"


const container = await experimental_AstroContainer.create();
const result = await container.renderComponent(Card); 

```

Omitting the `?container` query string will result in the same output as .

## Rendering options

Both  and  accept an object as their second argument:

```ts
export type ContainerRenderOptions = {
	slots?: Record<string, any>;
	props?: Record<string, unknown>;
	request?: Request;
	params?: Record<string, string | undefined>;
	locals?: App.Locals;
	routeType?: RouteType;
	partial?: boolean;
};
```

These optional values can be passed to the rendering function in order to provide additional information necessary for an Astro component to properly render.

### `slots`

<p>

**Type**: `Record<string, any>`
</p>

An option to pass content to be rendered with .

If your Astro component renders one default slot, pass an object with `default` as the key:

```js title="tests/Card.test.js"


const container = await experimental_AstroContainer.create();
const result = await container.renderToString(Card, {
  slots: { default: "Some value" },
});
```

If your component renders named slots, use the slot names as the object keys:

```astro title="src/components/Card.astro"
---
---
<div>
  <slot name="header" />
  <slot name="footer" />
</div>
```

```js title="tests/Card.test.js"


const container = await experimental_AstroContainer.create();
const result = await container.renderToString(Card, {
  slots: {
    header: "Header content",
    footer: "Footer",
  },
});
```

You can also render components in cascade:

```astro title="src/components/Card.astro"
---
---
<div>
  <slot name="header" />
  <slot name="footer" />
</div>
```

```js title="tests/Card.test.js"




const container = await experimental_AstroContainer.create();
const result = await container.renderToString(Card, {
  slots: {
    header: await container.renderToString(CardHeader),
    footer: await container.renderToString(CardFooter),
  },
});
```

### `props` option

<p>

**Type**: `Record<string, unknown>`
</p>

An option to pass  for Astro components.

```js title="tests/Card.test.js"


const container = await experimental_AstroContainer.create();
const result = await container.renderToString(Card, {
  props: { name: "Hello, world!" },
});
```

```astro title="src/components/Card.astro"
---
// For TypeScript support
interface Props {
  name: string;
};

const { name } = Astro.props;
---
<div>
  {name}
</div>
```

### `request` option

<p>

**Type**: `Request`
</p>

An option to pass a `Request` with information about the path/URL the component will render.

Use this option when your component needs to read information like `Astro.url` or `Astro.request`.

You can also inject possible headers or cookies.

```js title="tests/Card.test.js"


const container = await experimental_AstroContainer.create();
const result = await container.renderToString(Card, {
  request: new Request("https://example.com/blog", {
    headers: {
      "x-some-secret-header": "test-value",
    },
  }),
});
```

### `params` option

<p>

**Type**: `Record<string, string | undefined>`
</p>

An object to pass information about the path parameter to an Astro component responsible for .

Use this option when your component needs a value for `Astro.params` in order to generate a single route dynamically.

```astro title="src/pages/[locale]/[slug].astro"
---
const { locale, slug } = Astro.params;
---
<div></div>
```

```js title="tests/LocaleSlug.test.js"


const container = await experimental_AstroContainer.create();
const result = await container.renderToString(LocaleSlug, {
  params: {
    locale: "en",
    slug: "getting-started",
  },
});
```

### `locals` options

<p>

**Type**: `App.Locals`
</p>

An option to pass information from  for rendering your component.

Use this option to when your component needs information stored during the lifecycle of a request in order to render, such as logged in status.

```astro title="src/components/Card.astro"
---
const { checkAuth } = Astro.locals;
const isAuthenticated = checkAuth();
---

{isAuthenticated ? <span>You're in</span> : <span>You're out</span>}
```

```js title="tests/Card.test.js"



const container = await experimental_AstroContainer.create();

test("User is in", async () => {
  const result = await container.renderToString(Card, {
    locals: {
      checkAuth() {
        return true;
      },
    },
  });

  // assert result contains "You're in"
});

test("User is out", async () => {
  const result = await container.renderToString(Card, {
    locals: {
      checkAuth() {
        return false;
      },
    },
  });

  // assert result contains "You're out"
});
```

### `routeType` option

<p>

**Type**: `RouteType`
</p>

An option available when using `renderToResponse()` to specify that you are rendering an :

```js
container.renderToString(Endpoint, { routeType: "endpoint" });
```

```js title="tests/endpoint.test.js"


const container = await experimental_AstroContainer.create();
const response = await container.renderToResponse(Endpoint, {
  routeType: "endpoint",
});
const json = await response.json();
```

To test your endpoint on methods such as `POST`, `PATCH`, etc., use the `request` option to call the correct function:

```js title="src/pages/api/endpoint.js"
export function GET() {}

// need to test this
export function POST() {}
```

```js title="tests/endpoint.test.js" ins={7-9}


const container = await experimental_AstroContainer.create();
const response = await container.renderToResponse(Endpoint, {
  routeType: "endpoint",
  request: new Request("https://example.com", {
    method: "POST", // Specify POST method for testing
  }),
});
const json = await response.json();
```

### `partial` option

<p>

**Type:** `boolean`<br />
**Default:** `true`<br/>
<Since v="4.16.6" />
</p>

Whether or not the Container API renders components as if they were . The default `true` setting renders the component in isolation without a full page shell.

To render a component as a full Astro page, including `<!DOCTYPE html>`, you can opt-out of this behavior by setting `partial` to `false`:

```js title="tests/Blog.test.js" ins={6}


const container = await experimental_AstroContainer.create();
const result = await container.renderToString(Blog, {
  partial: false,
});
console.log(result); // includes `<!DOCTYPE html>` at the beginning of the HTML
```
