---
title: Template directives reference
i18nReady: true
---



---
<Fragment set:html={cmsContent}>
```

`set:html={Promise<string>}` injects an HTML string into an element that is wrapped in a Promise.

This can be used to inject HTML stored externally, such as in a database.

```astro
---

---
<article set:html={api.getArticle(Astro.props.id)}></article>
```

`set:html={Promise<Response>}` injects a  into an element.

This is most helpful when using `fetch()`. For example, fetching old posts from a previous static-site generator.

```astro
<article set:html={fetch('http://example/old-posts/making-soup.html')}></article>
```

`set:html` can be used on any tag and does not have to include HTML. For example, use with  on a `<script>` tag to add a  schema to your page.

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org/",
  "@type": "Person",
  name: "Houston",
  hasOccupation: {
    "@type": "Occupation",
    name: "Astronaut"
  }
})}/>
```

### `set:text`

`set:text={string}` injects a text string into an element, similar to setting `el.innerText`. Unlike `set:html`, the `string` value that is passed is automatically escaped by Astro.

This is equivalent to just passing a variable into a template expression directly (ex: `<div>{someText}</div>`) and therefore this directive is not commonly used.
## Client Directives

These directives control how  are hydrated on the page.

By default, a UI Framework component is not hydrated in the client. If no `client:*` directive is provided, its HTML is rendered onto the page without JavaScript.

A client directive can only be used on a UI framework component that is directly imported into a `.astro` component.  Hydration directives are not supported when using  and .

### `client:load`

- **Priority:** High
- **Useful for:** Immediately-visible UI elements that need to be interactive as soon as possible.

Load and hydrate the component JavaScript immediately on page load.

```astro
<BuyButton client:load />
```
### `client:idle`

- **Priority:** Medium
- **Useful for:** Lower-priority UI elements that don't need to be immediately interactive.

Load and hydrate the component JavaScript once the page is done with its initial load and the `requestIdleCallback` event has fired. If you are in a browser that doesn't support , then the document  event is used.

```astro
<ShowHideButton client:idle />
```

#### `timeout`

<p><Since v="4.15.0" /></p>

The maximum time to wait, in milliseconds, before hydrating the component, even if the page is not yet done with its initial load.

This allows you to pass a value for . This means you can delay hydration for lower-priority UI elements with more control to ensure your element is interactive within a specified time frame.

```astro
<ShowHideButton client:idle={{timeout: 500}} />
```

### `client:visible`

- **Priority:** Low
- **Useful for:** Low-priority UI elements that are either far down the page ("below the fold") or so resource-intensive to load that you would prefer not to load them at all if the user never saw the element.

Load and hydrate the component JavaScript once the component has entered the user's viewport. This uses an `IntersectionObserver` internally to keep track of visibility.

```astro
<HeavyImageCarousel client:visible />
```

#### `client:visible={{rootMargin}}`
<p><Since v="4.1.0" /></p>

Optionally, a value for `rootMargin` can be passed to the underlying `IntersectionObserver`. When `rootMargin` is specified, the component JavaScript will hydrate when a specified margin (in pixels) around the component enters the viewport, rather than the component itself.

```astro
<HeavyImageCarousel client:visible={{rootMargin: "200px"}} />
```

Specifying a `rootMargin` value can reduce layout shifts (CLS), allow more time for a component to hydrate on slower internet connections, and make components interactive sooner, enhancing the stability and responsiveness of the page.

### `client:media`

- **Priority:** Low
- **Useful for:** Sidebar toggles, or other elements that might only be visible on certain screen sizes.

`client:media={string}` loads and hydrates the component JavaScript once a certain CSS media query is met.

:::note
If the component is already hidden and shown by a media query in your CSS, then it can be easier to just use `client:visible` and not pass that same media query into the directive.
:::

```astro
<SidebarToggle client:media="(max-width: 50em)" />
```
### `client:only`

`client:only={string}` **skips** HTML server rendering, and renders only on the client. It acts similarly to `client:load` in that it loads, renders, and hydrates the component immediately on page load.

**You must pass the component's correct framework as a value!** Because Astro doesn't run the component during your build / on the server, Astro doesn't know what framework your component uses unless you tell it explicitly.

```astro
<SomeReactComponent client:only="react" />
<SomePreactComponent client:only="preact" />
<SomeSvelteComponent client:only="svelte" />
<SomeVueComponent client:only="vue" />
<SomeSolidComponent client:only="solid-js" />
```

#### Display loading content

For components that render only on the client, it is also possible to display fallback content while they are loading. Use `slot="fallback"` on any child element to create content that will be displayed only until your client component is available:

```astro {2}
<ClientComponent client:only="vue">
  <div slot="fallback">Loading</div>
</ClientComponent>
```

### Custom Client Directives

Since Astro 2.6.0, integrations can also add custom `client:*` directives to change how and when components should be hydrated.

Visit the  page to learn more about creating a custom client directive.

## Server Directives

These directives control how server island components are rendered.

### `server:defer`

The `server:defer` directive transforms the component into a server island, causing it to be rendered on demand, outside the scope of the rest of the page rendering.

<ReadMore>See more about using .</ReadMore>

```astro
<Avatar server:defer />
```

## Script & Style Directives

These directives can only be used on HTML `<script>` and `<style>` tags, to control how your client-side JavaScript and CSS are handled on the page.
### `is:global`

By default, Astro automatically scopes `<style>` CSS rules to the component. You can opt-out of this behavior with the `is:global` directive.

`is:global` makes the contents of a `<style>` tag apply globally on the page when the component is included. This disables Astro's CSS scoping system. This is equivalent to wrapping all of the selectors within a `<style>` tag with `:global()`.

You can combine `<style>` and `<style is:global>` together in the same component, to create some global style rules while still scoping most of your component CSS.

<ReadMore>See the  page for more details about how global styles work.</ReadMore>

```astro
<style is:global>
  body a { color: red; }
</style>
```

### `is:inline`

By default, Astro will process, optimize, and bundle any `<script>` and `<style>` tags that it sees on the page. You can opt-out of this behavior with the `is:inline` directive.

`is:inline` tells Astro to leave the `<script>` or `<style>` tag as-is in the final output HTML. The contents will not be processed, optimized, or bundled. This limits some Astro features, like importing an npm package or using a compile-to-CSS language like Sass.

The `is:inline` directive means that `<style>` and `<script>` tags:

- Will not be bundled into an external file. This means that  which control the loading of an external file will have no effect.
- Will not be deduplicated—the element will appear as many times as it is rendered.
- Will not have its `import`/`@import`/`url()` references resolved relative to the `.astro` file.
- Will be rendered in the final output HTML exactly where it is authored.
- Styles will be global and not scoped to the component.

:::caution
The `is:inline` directive is implied whenever any attribute other than `src` is used on a `<script>` or `<style>` tag.
The one exception is using the  on the `<style>` tag, which does not automatically imply `is:inline`.
:::

```astro
<style is:inline>
  /* inline: relative & npm package imports are not supported. */
  @import '/assets/some-public-styles.css';
  span { color: green; }
</style>

<script is:inline>
  /* inline: relative & npm package imports are not supported. */
  console.log('I am inlined right here in the final output HTML.');
</script>
```

<ReadMore>See how  work in Astro components.</ReadMore>

### `define:vars`

`define:vars={...}` can pass server-side variables from your component frontmatter into the client `<script>` or `<style>` tags. Any JSON-serializable frontmatter variable is supported, including `props` passed to your component through `Astro.props`. Values are serialized with .

```astro
---
const foregroundColor = "rgb(221 243 228)";
const backgroundColor = "rgb(24 121 78)";
const message = "Astro is awesome!";
---
<style define:vars={{ textColor: foregroundColor, backgroundColor }}>
  h1 {
    background-color: var(--backgroundColor);
    color: var(--textColor);
  }
</style>

<script define:vars={{ message }}>
  alert(message);
</script>
```

:::caution
Using `define:vars` on a `<script>` tag implies the , which means your scripts won't be bundled and will be inlined directly into the HTML.

This is because when Astro bundles a script, it includes and runs the script once even if you include the component containing the script multiple times on one page. `define:vars` requires a script to rerun with each set of values, so Astro creates an inline script instead.

For scripts, try  instead.
:::

## Advanced Directives
### `is:raw`

`is:raw` instructs the Astro compiler to treat any children of that element as text. This means that all special Astro templating syntax will be ignored inside of this component.

For example, if you had a custom Katex component that converted some text to HTML, you could have users do this:

```astro
---

---
<Katex is:raw>Some conflicting {syntax} here</Katex>
```
