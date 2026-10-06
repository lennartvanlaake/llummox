---
title: Actions API Reference
sidebar:
  label: 'astro:actions'
i18nReady: true
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---


<p>
<Since v="4.15.0" />
</p>

Actions help you build a type-safe backend you can call from client code and HTML forms. All utilities to define and call actions are exposed by the `astro:actions` module. For examples and usage instructions, .

## Imports from `astro:actions`

```js

```

### `defineAction()`

<p>

**Type:** <code>(\{ accept, input, handler \}) => <a href="#actionclient">ActionClient</a></code>
</p>

A utility to define new actions in the `src/actions/index.ts` file. This accepts a  function containing the server logic to run, and an optional  property to validate input parameters at runtime.

```ts title="src/actions/index.ts"


export const server = {
  getGreeting: defineAction({
    input: z.object({
      name: z.string(),
    }),
    handler: async (input, context) => {
      return `Hello, ${input.name}!`
    }
  })
}
```

#### `handler()` property

<p>

**Type:** <code>(input: TInputSchema, context: <a href="#actionapicontext">ActionAPIContext</a>) => TOutput | Promise\<TOutput\></code>
</p>

A required function containing the server logic to run when the action is called. Data returned from the `handler()` is automatically serialized and sent to the caller.

The `handler()` is called with user input as its first argument. If an  validator is set, the user input will be validated before being passed to the handler. The second argument is .

Return values are parsed using the . This supports JSON values and instances of `Date()`, `Map()`, `Set()`, and `URL()`.

#### `input` validator

<p>

**Type:** `ZodType | undefined`
</p>

An optional property that accepts a  (e.g. Zod object, Zod discriminated union) to validate handler inputs at runtime. If the action fails to validate,  is returned and the `handler` is not called.

If `input` is omitted, the `handler` will receive an input of type `unknown` for JSON requests and type `FormData` for form requests.

#### `accept` property

<p>

**Type:** `"form" | "json"`<br />
**Default:** `json`
</p>

Defines the format expected by an action:
* Use `form` when your action accepts `FormData`.
* Use `json`, the default, for all other cases.

When your action accepts form inputs, the `z.object()` validator will automatically parse `FormData` to a typed object. All Zod validators are supported to validate your inputs.

<ReadMore>Learn about  in the Actions guide, including example usage and special input handling.</ReadMore>

### `actions`

<p>

**Type:** <code>Record\<string, <a href="#actionclient">ActionClient</a>\></code>
</p>

An object containing all your actions with the action name as key associated to a function to call this action.

```astro title="src/pages/index.astro" {5,8}
---
---

<script>

async () => {
  const { data, error } = await actions.myAction({ /* ... */ });
}
</script>
```

In order for Astro to recognize this property, you may need to restart the dev server or  (`s + enter`).

### `isInputError()`

<p>

**Type:** `(error?: unknown) => boolean`
</p>

A utility used to check whether  is an input validation error. When the `input` validator is a `z.object()`, input errors include a `fields` object with error messages grouped by name.

<ReadMore>See the  for more on using `isInputError()`.</ReadMore>

### `isActionError()`

<p>

**Type:** `(error?: unknown) => boolean`
</p>

A utility to check whether your action raised  within the . This is useful when narrowing the type of a generic error.

```astro title="src/pages/index.astro" {9-12} "isActionError"
---
---

<script>

async () => {
  const { data, error } = await actions.myAction({ /* ... */ });
  if (isActionError(error)) {
    // Handle action-specific errors
    console.log(error.code);
  }
}
</script>
```

### `ActionError`

The `ActionError()` constructor is used to create errors thrown by an action `handler`. This accepts a `code` property describing the error that occurred (example: `"UNAUTHORIZED"`), and an optional `message` property with further details.

The following example creates a new `ActionError` when the user is not logged in:

```ts title="src/actions/index.ts" {8-11} "ActionError"

export const server = {
  getUserOrThrow: defineAction({
    accept: 'form',
    handler: async (_, { locals }) => {
      if (locals.user?.name !== 'florian') {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Not logged in',
        });
      }
      return locals.user;
    },
  }),
}
```


You can also use `ActionError` to narrow the error type when handling the results of an action:

```astro title="src/pages/index.astro" {9-12} "ActionError"
---
---

<script>

async () => {
  const { data, error } = await actions.myAction({ /* ... */ });
  if (error instanceof ActionError) {
    // Handle action-specific errors
    console.log(error.code);
  }
}
</script>
```

#### `code`

<p>

**Type:** <code><a href="#actionerrorcode">ActionErrorCode</a></code>
</p>

Defines a human-readable version of an .

#### `message`

<p>

**Type:** `string`
</p>

An optional property to describe the error (e.g. "User must be logged in.").

#### `stack`

<p>

**Type:** `string`
</p>

An optional property to pass the stack trace.

### `getActionContext()`

<p>

**Type:** <code>(context: <a href="/en/reference/api-reference/">APIContext</a>) => AstroActionContext</code><br />
<Since v="5.0.0" />
</p>

A function called from your middleware handler to retrieve information about inbound action requests. This returns an `action` object with information about the request, a `deserializeActionResult()` method, and the `setActionResult()` and `serializeActionResult()` functions to programmatically set the value returned by `Astro.getActionResult()`.

`getActionContext()` lets you programmatically get and set action results using middleware, allowing you to persist action results from HTML forms, gate action requests with added security checks, and more.

```ts title="src/middleware.ts" {5}


export const onRequest = defineMiddleware(async (context, next) => {
  const { action, setActionResult, serializeActionResult } = getActionContext(context);
  if (action?.calledFrom === 'form') {
    const result = await action.handler();
    setActionResult(action.name, serializeActionResult(result));
  }
  return next();
});
```

#### `action`

<p>

**Type:** <code>\{ calledFrom: "rpc" | "form"; name: string; handler: () => Promise\<<a href="#saferesult">SafeResult</a>\>; \} | undefined</code>
</p>

An object containing information about an inbound action request. It is available from , and provides the action `name`, `handler`, and whether the action was called from a client-side RPC function (e.g. `actions.newsletter()`) or an HTML form action.

```ts title="src/middleware.ts" {6}


export const onRequest = defineMiddleware(async (context, next) => {
  const { action, setActionResult, serializeActionResult } = getActionContext(context);
  if (action?.calledFrom === 'rpc' && action.name.startsWith('private')) {
    // Check for a valid session token
  }
  // ...
});
```

##### `action.calledFrom`

<p>

**Type:** `"rpc" | "form"`
</p>

Whether an action was called using an RPC function or an HTML form action.

##### `action.name`

<p>

**Type:** `string`
</p>

The name of the action. Useful to track the source of an action result during a redirect.

##### `action.handler()`

<p>

**Type:** <code>() => Promise\<<a href="#saferesult">SafeResult</a>\></code>
</p>

A method to programmatically call an action to get the result.

#### `setActionResult()`

<p>

**Type:** `(actionName: string, actionResult: SerializedActionResult) => void`
</p>

A function to programmatically set the value returned by `Astro.getActionResult()` in middleware. It is passed the action name and an action result serialized by . Calling this function from middleware will disable Astro's own action result handling.

This is useful when calling actions from an HTML form to persist and load results from a session.

```ts title="src/middleware.ts" {8}


export const onRequest = defineMiddleware(async (context, next) => {
  const { action, setActionResult, serializeActionResult } = getActionContext(context);
  if (action?.calledFrom === 'form') {
    const result = await action.handler();
    // ... handle the action result
    setActionResult(action.name, serializeActionResult(result));
  }
  return next();
});
```

<ReadMore>See the  for a sample implementation using Netlify Blob.</ReadMore>

#### `serializeActionResult()`

<p>

**Type:** <code>(res: <a href="#saferesult">SafeResult</a>) => SerializedActionResult</code>
</p>

Serializes an action result to JSON for persistence. This is required to properly handle non-JSON return values like `Map` or `Date` as well as the `ActionError` object.

Call this function when serializing an action result to be passed to `setActionResult()`:

```ts title="src/middleware.ts" {8}


export const onRequest = defineMiddleware(async (context, next) => {
  const { action, setActionResult, serializeActionResult } = getActionContext(context);
  if (action) {
    const result = await action.handler();
    setActionResult(action.name, serializeActionResult(result));
  }
  // ...
});
```

#### `deserializeActionResult()`

<p>

**Type:** <code>(res: SerializedActionResult) => <a href="#saferesult">SafeResult</a></code>
</p>

Reverses the effect of  and returns an action result to its original state. This is useful to access the `data` and `error` objects on a serialized action result.

### `getActionPath()`

<p>

**Type:** <code>(action: <a href="#actionclient">ActionClient</a>) => string</code>
<Since v="5.1.0" />
</p>

A utility that accepts an action and returns a URL path so you can execute an action call as a `fetch()` operation directly. This allows you to provide details such as custom headers when you call your action. Then, you can  as needed, just as if you had called an action directly.

This example shows how to call a defined `like` action passing the `Authorization` header and the  option:

```astro title="src/components/my-component.astro" {8,11}
<script>


export const GET: APIRoute = ({ redirect, request }) => {
  const link = new URL(request.url).searchParams;
  link.delete(ACTION_QUERY_PARAMS.actionName);
  link.delete(ACTION_QUERY_PARAMS.actionPayload);

  return redirect(link.toString(), 303);
};
```

## `astro:actions` types

```ts

```

### `ActionAPIContext`

A subset of the . The following properties are not available: `callAction`, `getActionResult`, `props`, and `redirect`.

### `ActionClient`

<p>

**Types:**
* <code>(input?: any) => Promise\<<a href="#saferesult">SafeResult</a>\></code>
* `{ queryString?: string; orThrow: (input?: any) => Promise<Awaited<TOutput>>; }`
</p>

Represents an action to be called on the client. You can use it as a function that accepts input data and returns a Promise with a  containing the action result or validation errors.

The following example shows how you can provide error handling with an `if` statement when incrementing the like count fails:

```astro title="src/pages/posts/post-1.astro" "data" "error"
---
---

<!-- your template -->

<script>

const post = document.querySelector('article');
const button = document.querySelector('button');
button?.addEventListener('click', async () => {
  const { data: updatedLikes, error } = await actions.likePost({ postId: post?.id });
  if (error) {
    /* handle errors */
  }
})
</script>
```

Alternatively, you can use it as an object giving you access to the `queryString` and an alternative `orThrow()` method.

#### `ActionClient.queryString`

<p>

**Type:** `string`
</p>

A string representation of the action that can be used to construct form action URLs. This can be useful when your form component is used in multiple places but you need to redirect to a different URL on submit.

The following example uses `queryString` to construct a URL that will be passed to the form `action` attribute through a custom prop:

```astro title="src/pages/postal-service.astro" "queryString"
---


const feedbackUrl = new URL('/feedback', Astro.url);
feedbackUrl.search = actions.myAction.queryString;
---
<FeedbackForm sendTo={feedbackUrl.pathname} />
```

#### `ActionClient.orThrow()`

<p>

**Type:** `(input?: any) => Promise<Awaited<TOutput>>`
</p>

A method that throws an error on failure instead of returning the errors. This is useful when you want exceptions rather than error handling.

The following example uses `orThrow()` to skip error handling when incrementing the like count fails:

```astro title="src/pages/posts/post-1.astro" "orThrow"
---
---

<!-- your template -->

<script>

const post = document.querySelector('article');
const button = document.querySelector('button');
button?.addEventListener('click', async () => {
  const updatedLikes = await actions.likePost.orThrow({ postId: post?.id });
})
</script>
```

### `ActionErrorCode`

<p>

**Type:** `string`
</p>

A union type of standard HTTP status codes  using the human-readable versions as uppercase strings separated by an underscore (e.g. `BAD_REQUEST` or `PAYLOAD_TOO_LARGE`).

### `ActionInputSchema`

<p>

**Type:** `ZodType`
<Since v="5.16.0" />
</p>

A utility type that automatically infers the TypeScript type of an action's input based on its Zod schema. This can be useful to reference an action's  as an object in your own type definitions.

Returns `never` when  is omitted.

The following example uses `ActionInputSchema` on an action named `contact` to:
* Retrieve the Zod schema type for the input of the action.
* Retrieve the expected input type of the action's validator.

```astro title="src/components/Form.astro" {5}
---


type ContactSchema = ActionInputSchema<typeof actions.contact>;
type ContactInput = z.input<ContactSchema>;
---
```

### `ActionReturnType`

<p>

**Type:** <code>Awaited\<ReturnType\<ActionHandler\>\></code>
</p>

A utility type that extracts the output type from . This unwraps both the `Promise` (if the handler is async) and the `ReturnType` to give you the . This can be useful if you need to reference an action's output type in your own type definitions.

The following example uses `ActionReturnType` to retrieve the expected output type for an action named `contact`:

```astro title="src/components/Form.astro" {4}
---

type ContactResult = ActionReturnType<typeof actions.contact>;
---
```

### `SafeResult`

<p>

**Type:** `{ data: TOutput, error: undefined } | { data: undefined, error: ActionError }`
</p>

Represents the result of an action call:
* on success, `data` contains the output of the action and `error` is `undefined`.
* on failure, `error` contains an  with validation errors or runtime errors, and `data` is `undefined`.
