---
title: Content collections
description: >-
  Manage your content with type safety.
i18nReady: true
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---


// 2. Import loader(s)

// 3. Import Zod

// 4. Define a `loader` and `schema` for each collection
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

// 5. Export a single `collections` object to register your collection(s)
export const collections = { blog };
```

You can then use the dedicated `getCollection()` and `getEntry()` functions to  and render your content.

You can choose to  from your build-time collection entries at build time for an entirely static, prerendered site. Or, you can render your build-time collections on demand, choosing to delay building your page until it is first requested. This is useful when you have a large number of pages (e.g. thousands or tens of thousands) and want to delay building a static page until it is needed.

## Build-time collection loaders

Astro provides two built-in loaders (`glob()` and `file()`) for fetching your local content at build time. Pass the location of your data in your project or on your filesystem, and these loaders will automatically handle your data and update the persistent data store content layer.

To fetch remote data at build time, you can  to retrieve your data and update the data store. Or, you can use any . Several already exist for popular content management systems as well as common data sources such as Obsidian vaults, GitHub repositories, or Bluesky posts.

### The `glob()` loader

The  fetches entries from directories of Markdown, MDX, Markdoc, JSON, YAML, or TOML files from anywhere on the filesystem. If you store your content entries locally as separate files, such as a directory of blog posts, then the `glob()` loader is all you need to access your content.

This loader requires a `pattern` of entry files to match using glob patterns supported by , and a `base` file path of where your files are located. A unique `id` for each entry will be automatically generated from its file name, but you can  if needed.

```ts  title="src/content.config.ts" {5}


const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
});

export const collections = { blog };
```

#### Defining custom IDs

When using the  with Markdown, MDX, Markdoc, JSON, or TOML files, every content entry  is automatically generated in a URL-friendly format based on the content filename. This unique `id` is used to query the entry directly from your collection. It is also useful when .

You can override a single entry’s generated `id` by adding your own `slug` property to the file frontmatter or data object for JSON files. This is similar to the “permalink” feature of other web frameworks.

```md title="src/blog/1.md" {3}
---
title: My Blog Post
slug: my-custom-id/supports/slashes
---
Your blog post content here.
```

```json title="src/categories/1.json" {3}
{
  "title": "My Category",
  "slug": "my-custom-id/supports/slashes",
  "description": "Your category description here."
}
```

You can also pass options to the `glob()` loader's  when you define your build-time collection to adjust how `id`s are generated. For example, you may wish to revert the default behavior of converting uppercase letters to lowercase for each collection entry:

```js title="src/content.config.ts"


const authors = defineCollection({
  /* Retrieve all JSON files in your authors directory while retaining
   * uppercase letters in the ID. */
  loader: glob({
    pattern: "**/*.json",
    base: "./src/data/authors",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
});
```

### The `file()` loader

The  fetches multiple entries from a single local file defined in your collection. The `file()` loader will automatically detect and parse (based on the file extension) a single array of objects from JSON and YAML files, and will treat each top-level table as an independent entry in TOML files.

```ts  title="src/content.config.ts" {5}


const dogs = defineCollection({
  loader: file("src/data/dogs.json"),
});

export const collections = { dogs };
```

Each entry object in the file must have a unique `id` key property so that the entry can be identified and queried. Unlike the `glob()` loader, the `file()` loader will not automatically generate IDs for each entry.

You can provide your entries as an array of objects with an `id` property, or in object form where the unique `id` is the key:

```json title="src/data/dogs.json"
// Specify an `id` property in each object of an array
[
  { "id": "poodle", "coat": "curly", "shedding": "low" },
  { "id": "afghan", "coat": "short", "shedding": "low" }
]
```

```json title="src/data/dogs.json"
// Each key will be used as the `id`
{
  "poodle": { "coat": "curly", "shedding": "low" },
  "afghan": { "coat": "silky", "shedding": "low" }
}
```

#### Parsing other data formats

Support for parsing single JSON, YAML, and TOML files into collection entries with the `file()` loader is built-in (unless you have a ). To load your collection from unsupported file types, such as `.csv`, you will need to create a . This function can be made async if required (e.g. to fetch files from the web, or if your parser is asynchronous).

The following example shows importing a third-party CSV parser then passing a custom `parser` function to the `file()` loader:

```typescript title="src/content.config.ts" {3} "parser: (text) => parseCsv(text, { columns: true, skipEmptyLines: true })"



const cats = defineCollection({
  loader: file("src/data/cats.csv", {
    parser: (text) => parseCsv(text, { columns: true, skipEmptyLines: true }),
  }),
});
```

##### Nested `.json` documents

The `parser()` argument can be used to load a single collection from a nested JSON document. For example, this JSON file contains multiple collections:

```json title="src/data/pets.json"
{"dogs": [{}], "cats": [{}]}
```

You can separate these collections by passing a custom `parser()` function to the `file()` loader for each collection, using Astro's built-in JSON parsing:

```typescript title="src/content.config.ts"


const dogs = defineCollection({
  loader: file("src/data/pets.json", { parser: (text) => JSON.parse(text).dogs })
});
const cats = defineCollection({
  loader: file("src/data/pets.json", { parser: (text) => JSON.parse(text).cats })
});
```

### Custom build-time loaders

You can  using the Content Loader API to fetch remote content from any data source, such as a CMS, a database, or an API endpoint.

Then you can import and define your custom loader in your collections config, passing any required values:

```ts title="src/content.config.ts"


const blog = defineCollection({
  loader: myLoader({
    url: "https://api.example.com/posts",
    apiKey: "my-secret",
  }),
});
```

:::tip
Find community-built and third-party loaders in the .
:::

Using a custom loader to fetch your data will automatically create a collection from your remote data. This gives you all the benefits of local collections, including collection-specific API helpers such as `getCollection()` and `render()` to , as well as schema validation.

Similar to creating an Astro integration or Vite plugin, you can  that others can use in their projects.

<ReadMore>See the full  for examples of how to build your own loader.</ReadMore>

## Defining the collection schema

Schemas enforce consistent frontmatter or entry data within a collection through Zod validation. A schema **guarantees** that this data exists in a predictable form when you need to reference or query it. If any file violates its collection schema, Astro will provide a helpful error to let you know.

Schemas also power Astro's automatic TypeScript typings for your content. When you define a schema for your collection, Astro will automatically generate and apply a TypeScript interface to it. The result is full TypeScript support when you query your collection, including property autocompletion and type-checking.

:::tip
In order for Astro to recognize a new or updated schema, you may need to restart the dev server or  (<code>s + enter</code>) to define the `astro:content` module.
:::

Providing a `schema` is optional, but highly recommended! If you choose to use a schema, then every frontmatter or data property of your collection entries must be defined using a :

```ts title="src/content.config.ts" {7-12,16-20}



const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});
const dogs = defineCollection({
  loader: file("src/data/dogs.json"),
  schema: z.object({
    id: z.string(),
    breed: z.string(),
    temperament: z.array(z.string()),
  }),
});

export const collections = { blog, dogs };
```

### Defining datatypes with Zod

Astro uses  to power its content schemas. With Zod, Astro is able to validate every file's data within a collection *and* provide automatic TypeScript types when you query content from inside your project.

To use Zod in Astro, import the `z` utility from `"astro/zod"`. This is a re-export of the Zod library, and it supports all of the features of Zod 4.

<ReadMore>See the  for a cheatsheet of common datatypes and to learn how Zod works and what features are available.</ReadMore>

#### Zod schema methods

All  (e.g. `.parse()`, `.transform()`) are available, with some limitations. Notably, performing custom validation checks on images using `image().refine()` is unsupported.

### Defining collection references

Collection entries can also "reference" other related entries. 

With the , you can define a property in a collection schema as an entry from another collection. For example, you can require that every `space-shuttle` entry includes a `pilot` property which uses the `pilot` collection's own schema for type checking, autocomplete, and validation.

A common example is a blog post that references reusable author profiles stored as JSON, or related post URLs stored in the same collection:

```ts title="src/content.config.ts"



const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    // Reference a single author from the `authors` collection by `id`
    author: reference("authors"),
    // Reference an array of related posts from the `blog` collection by `id`
    relatedPosts: z.array(reference("blog")),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/authors" }),
  schema: z.object({
    name: z.string(),
    portfolio: z.url(),
  }),
});

export const collections = { blog, authors };
```

This example blog post specifies the `id`s of related posts and the `id` of the post author:

```yaml title="src/content/blog/welcome.md"
---
title: "Welcome to my blog"
author: ben-holmes # references `src/data/authors/ben-holmes.json` 
relatedPosts:
- about-me # references `src/content/blog/about-me.md`
- my-year-in-review # references `src/content/blog/my-year-in-review.md`
---
```

These references will be transformed into objects containing a `collection` key and an `id` key, allowing you to easily .

## Querying build-time collections

Astro provides helper functions to query a build-time collection and return one or more content entries.

-  fetches an entire collection and returns an array of entries.
-  fetches a single entry from a collection.

These return entries with a unique `id`, a `data` object with all defined properties, and will also return a `body` containing the raw, uncompiled body of a Markdown, MDX, or Markdoc document.

```astro title="src/pages/index.astro"
---

// Get all entries from a collection.
// Requires the name of the collection as an argument.
const allBlogPosts = await getCollection('blog');

// Get a single entry from a collection.
// Requires the name of the collection and `id`
const poodleData = await getEntry('dogs', 'poodle');
---
```

The sort order of generated collections is non-deterministic and platform-dependent. This means that if you are calling `getCollection()` and need your entries returned in a specific order (e.g. blog posts sorted by date), you must sort the collection entries yourself:

```astro title="src/pages/blog.astro"
---

const posts = (await getCollection('blog')).sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);
---
```

<ReadMore>See the full list of properties returned by the .</ReadMore>

### Using content in Astro templates

After querying your collections, you can access each entry's content and metadata directly inside of your Astro component template.

For example, you can create a list of links to your blog posts, displaying information from your entry's frontmatter using the `data` property:


```astro title="src/pages/index.astro"
---

const posts = await getCollection('blog');
---
<h1>My posts</h1>
<ul>
  {posts.map(post => (
    <li><a href={`/blog/${post.id}`}>{post.data.title}</a></li>
  ))}
</ul>
```

### Rendering body content 

Once queried, you can render Markdown and MDX entries to HTML using the  function from `astro:content`. Calling this function gives you access to rendered HTML content, including both a `<Content />` component and a list of all rendered headings.

```astro title="src/pages/blog/post-1.astro" {2,6,10}
---

const entry = await getEntry("blog", "post-1");

if (!entry) {
  throw new Error("Entry not found");
}

const { Content } = await render(entry);
---

<h1>{entry.data.title}</h1>
<p>Published on: {entry.data.pubDate.toDateString()}</p>
<Content />
```

<ReadMore>When working with MDX entries, you can also  to replace HTML elements with custom alternatives.</ReadMore>

#### Passing content as props

A component can also pass an entire collection entry as a prop.

You can use the  utility to correctly type your component's props using TypeScript. This utility takes a string argument that matches the name of your collection schema and will inherit all of the properties of that collection's schema.

```astro title="src/components/BlogCard.astro" /CollectionEntry(?:<.+>)?/
---

interface Props {
  post: CollectionEntry<'blog'>;
}

// `post` will match your 'blog' collection schema type
const { post } = Astro.props;
---
```

### Filtering collection queries

`getCollection()` takes an optional "filter" callback that allows you to filter your query based on an entry's `id` or `data` properties.

You can use this to filter by any content criteria you like. For example, you can filter by properties like `draft` to prevent any draft blog posts from publishing to your blog:

```astro title="src/pages/blog.astro"
---
// Example: Filter out content entries with `draft: true`

const publishedBlogEntries = await getCollection('blog', ({ data }) => {
  return data.draft !== true;
});
---
```

You can also create draft pages that are available when running the dev server, but not built in production:

```astro title="src/pages/blog.astro"
---
// Example: Filter out content entries with `draft: true` only when building for production

const blogEntries = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? data.draft !== true : true;
});
---
```

The filter argument also supports filtering by nested directories within a collection. Since the `id` includes the full nested path, you can filter by the start of each `id` to only return items from a specific nested directory:

```astro title="src/pages/blog.astro"
---
// Example: Filter entries by sub-directory in the collection

const englishDocsEntries = await getCollection('docs', ({ id }) => {
  return id.startsWith('en/');
});
---
```

### Accessing referenced data

To access , first query your collection entry. Your references will be available on the returned `data` object. (e.g. `entry.data.author` and `entry.data.relatedPosts`)

Then, you can use the `getEntry()` function again (or `getEntries()` to retrieve multiple referenced entries) by passing those returned values. The `reference()` function in your schema transforms those values into one or more `collection` and `id` objects as a convenient way to query this related data.


```astro title="src/pages/blog/adventures-in-space.astro"
---

// First, query a blog post
const blogPost = await getEntry("blog", "Adventures in Space");

// If the blog post doesn't exist, throw an error
if (!blogPost) {
  throw new Error("Blog post not found");
}

// Retrieve a single reference item: the blog post's author
// Equivalent to querying `{collection: "authors", id: "ben-holmes"}`
const author = await getEntry(blogPost.data.author);

// Retrieve an array of referenced items: all the related posts
// Equivalent to querying `[{collection: "blog", id: "visiting-mars"}, {collection: "blog", id: "leaving-earth-for-the-first-time"}]`
const relatedPosts = await getEntries(blogPost.data.relatedPosts);
---

<h1>{blogPost.data.title}</h1>
<p>Author: {author.data.name}</p>

<!-- ... -->

<h2>You might also like:</h2>
{relatedPosts.map((post) => <a href={post.id}>{post.data.title}</a>)}
```

## Generating Routes from Content

Content collections are stored outside of the `src/pages/` directory. This means that no pages or routes are generated for your collection items by default by Astro's .

You will need to manually create a new  if you want to generate HTML pages for each of your collection entries, such as individual blog posts. Your dynamic route will map the incoming request param (e.g. `Astro.params.id` in `src/pages/blog/[...id].astro`) to fetch the correct entry for each page.

The exact method for generating routes will depend on whether your pages are prerendered (default) or rendered on demand by a server.

### Building for static output (default)

If you are building a static website (Astro's default behavior) with build-time collections, use the  function to create multiple pages from a single page component (e.g. `src/pages/[id].astro`) during your build.

Call `getCollection()` inside of `getStaticPaths()` to have your collection data available for building static routes. Then, create the individual URL paths using the `id` property of each content entry. Each page receives the entire collection entry as a prop for .

```astro title="src/pages/posts/[id].astro" "{ id: post.id }" "{ post }"
---

// 1. Generate a new path for every collection entry
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { id: post.id },
    props: { post },
  }));
}
// 2. For your template, you can get the entry directly from the prop
const { post } = Astro.props;
const { Content } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
```

This will generate a page route for every entry in the `blog` collection. For example, an entry at `src/blog/hello-world.md` will have an `id` of `hello-world`, and therefore its final URL will be `/posts/hello-world/`.

:::note
If your custom slugs contain the `/` character to produce URLs with multiple path segments, you must use a [rest parameter (e.g. `[...id]`)](/en/guides/routing/#rest-parameters) in the `.astro` filename for this dynamic routing page.
:::

### Building routes on demand at request time

With an adapter installed for , you can generate your dynamic page routes at request time. First, examine the request (using `Astro.request` or `Astro.params`) to find the slug on demand, and then fetch it using one of Astro's content collection helper functions:

-  for build-time collection pages that are generated once, upon first request.
-  for live collection pages where data is (re)fetched at each request time.


```astro title="src/pages/posts/[id].astro"
---
export const prerender = false; // Not needed in 'server' mode


// 1. Get the slug from the incoming server request
const { id } = Astro.params;
if (id === undefined) {
	return Astro.redirect("/404");
}

// 2. Query for the entry directly using the request slug
const post = await getEntry("blog", id);

// 3. Redirect if the entry does not exist
if (post === undefined) {
	return Astro.redirect("/404");
}

// 4. Render the entry to HTML in the template
const { Content } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
```

:::tip
Explore the `src/pages/` folder of the  to see full examples of creating dynamic pages from your collections for blog features like a list of blog posts, tags pages, and more!
:::

## Live content collections 

Live collections use a different API than build-time content collections, although the configuration and helper functions are designed to feel familiar.

Key differences include:

1. **Execution time**: Run at request time instead of build time
2. **Configuration file**: Use `src/live.config.ts` instead of `src/content.config.ts`
3. **Collection definition**: Use `defineLiveCollection()` instead of `defineCollection()`
4. **Loader API**: Implement `loadCollection` and `loadEntry` methods instead of the `load` method
5. **Data return**: Return data directly instead of storing in the data store
6. **User-facing functions**: Use `getLiveCollection()`/`getLiveEntry()` instead of `getCollection()`/`getEntry()`

Additionally, you must have an adapter configured for  of live collection data.

Define your live collections in the special file `src/live.config.ts` (separate from your `src/content.config.ts` for build-time collections, if you have one).

Each individual collection configures:
- a  for your data source, and optionally for type safety (required)
- a  for type safety (optional)

Unlike for build-time collections, there are no built-in live loaders available. You will need to  for your specific data source or find a third-party loader to pass to your live collection's `loader` property.

You can optionally . Therefore,  for live collections is optional. However, if you provide one, it will take precedence over the live loader's types.

```ts title="src/live.config.ts"
// Define live collections for accessing real-time data


const products = defineLiveCollection({
  loader: storeLoader({
    apiKey: process.env.STORE_API_KEY,
    endpoint: 'https://api.mystore.com/v1',
  }),
});

// Export a single `collections` object to register your collection(s)
export const collections = { products };
```

You can then use the dedicated `getLiveCollection()` and `getLiveEntry()` functions to  and render your content.

You can  from your live collection entries on demand, fetching your data fresh at runtime upon each request without needing a rebuild of your site like  do. This is useful when accessing live, up-to-the-moment data is more important than having your content available in a performant data storage layer that persists between site builds.

### Creating a live loader

You can build a custom  using the Live Loader API to fetch remote content fresh upon request from any data source, such as a CMS, a database or an API endpoint. You will have to tell your live loader how to fetch and return content entries from your desired data source, as well as provide error handling for unsuccessful data requests.

Using a live loader to fetch your data will automatically create a collection from your remote data. This gives you all the benefits of Astro's content collections, including collection-specific API helpers such as `getLiveCollection()` and `render()` to , as well as helpful error handling.

:::tip
Find community-built and third-party live loaders in the .
:::

<ReadMore>See the basics of  using the Live Loader API</ReadMore>

### Using Zod schemas with live collections

You can use Zod schemas with live collections to validate and transform data at runtime. This Zod validation works the same way as .

When you define a schema for a live collection, it takes precedence over  when you query the collection:

```ts title="src/live.config.ts"



const products = defineLiveCollection({
  loader: apiLoader({ endpoint: process.env.API_URL }),
  schema: z
    .object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      // Transform the API's category format
      category: z.string().transform((str) => str.toLowerCase().replace(/\s+/g, '-')),
      // Coerce the date to a Date object
      createdAt: z.coerce.date(),
    })
    .transform((data) => ({
      ...data,
      // Add a formatted price field
      displayPrice: `$${data.price.toFixed(2)}`,
    })),
});

export const collections = { products };
```

When using Zod schemas with live collections, validation errors are automatically caught and returned as `AstroError` objects:

```astro title="src/pages/store/index.astro"
---
export const prerender = false; // Not needed in 'server' mode



const { entry, error } = await getLiveEntry('products', '123');

// You can handle validation errors specifically
if (LiveCollectionValidationError.is(error)) {
  console.error(error.message);
  return Astro.rewrite('/500');
}

// TypeScript knows entry.data matches your Zod schema, not the loader's type
console.log(entry?.data.displayPrice); // e.g., "$29.99"
---
```

<ReadMore>See  for complete documentation on how Zod works and what features are available.</ReadMore>


### Accessing live data

Astro provides live collection helper functions to access live data on each request and return one (or more) content entries. These can be used similarly to their .

-  fetches an entire collection and returns an array of entries.
-  fetches a single entry from a collection.

These return entries with a unique `id`, and `data` object with all defined properties from the live loader. When using third-party or community loaders distributed as npm packages, check their own documentation for the expected shape of data returned.

You can use these functions to access your live data, passing the name of the collection and optionally filtering conditions.

```astro title="src/pages/store/[slug].astro"
---
export const prerender = false; // Not needed in 'server' mode


if (!Astro.params.slug) {
  return Astro.redirect('/404');
}

// Use loader-specific filters
const { entries: draftArticles } = await getLiveCollection("articles", {
  status: "draft",
  author: "john-doe",
});

// Get a specific product by ID
const { entry: product } = await getLiveEntry("products", Astro.params.slug);
---
```

#### Rendering content

If your live loader , you can use  to render your content directly in your pages, using the same method as build-time collections.

You also have access to any , for example, to rewrite to a 404 page when content cannot be displayed:

```astro title="src/pages/store/[id].astro" "render(entry)" "<Content />"
---
export const prerender = false; // Not needed in 'server' mode

if (!Astro.params.id) {
  return Astro.redirect("/404");
}


const { entry, error } = await getLiveEntry("articles", Astro.params.id);
if (!entry || error) {
  return Astro.rewrite("/404");
}

const { Content } = await render(entry);
---

<h1>{entry.data.title}</h1>
<Content />
```

#### Error handling

Live loaders can fail due to network issues, API errors, or validation problems. The API is designed to make error handling explicit.

When you call `getLiveCollection()` or `getLiveEntry()`, the error will be one of:

- The error type defined by the loader (if it returned an error)
- A `LiveEntryNotFoundError` if the entry was not found
- A `LiveCollectionValidationError` if the collection data does not match the expected schema
- A `LiveCollectionCacheHintError` if the cache hint is invalid
- A `LiveCollectionError` for other errors, such as uncaught errors thrown in the loader

You can use `instanceof` to check the type of an error at runtime:

```astro title="src/pages/store/[id].astro" "LiveEntryNotFoundError.is(error)"
---
export const prerender = false; // Not needed in 'server' mode



if (!Astro.params.id) {
  return Astro.redirect("/404");
}

const { entry, error } = await getLiveEntry("products", Astro.params.id);

if (error) {
  if (error instanceof LiveEntryNotFoundError) {
    console.error(`Product not found: ${error.message}`);
    Astro.response.status = 404;
  } else {
    console.error(`Error loading product: ${error.message}`);
    return Astro.redirect("/500");
  }
}
---
```

### Caching live data

<p><Since v="7.0.0" /></p>

When live loaders provide , `getLiveEntry()` and `getLiveCollection()` return a `cacheHint` object. This allows you to control the  of your routes without manually setting headers.

Cache hints include  for targeted invalidation and  to keep cached data fresh. You can also combine the cache hints with your own  to further customize caching behavior. 

<ReadMore>
See the  for more about implementing cache hints in your live loaders.
</ReadMore>

#### Entry-level cache hints

Pass the `cacheHint` returned by `getLiveEntry()` to  to apply the loader's recommended caching strategy.

The following example passes the loader's cache hint and adds a `maxAge` to control how long the response stays fresh:

```astro title="src/pages/products/[id].astro" {4,10-12}
---

const { entry, error, cacheHint } = await getLiveEntry('products', Astro.params.id);

if (error) {
  return Astro.redirect('/404');
}

if (cacheHint) {
  Astro.cache.set(cacheHint);
}

Astro.cache.set({ maxAge: 300 });
---

<h1>{entry.data.name}</h1>
```

You can also pass a  directly to let Astro extract its `cacheHint` automatically:

```astro title="src/pages/products/[id].astro" {4,10}
---

const { entry, error } = await getLiveEntry('products', Astro.params.id);

if (error) {
  return Astro.redirect('/404');
}

Astro.cache.set(entry);
Astro.cache.set({ maxAge: 300, swr: 60 });
---

<h1>{entry.data.name}</h1>
```

#### Collection-level cache hints

When fetching a full collection with `getLiveCollection()`, Astro merges cache hints from the collection response and all individual entries: tags are accumulated, and the most recent `lastModified` wins.

The following example passes the merged cache hint from a collection and sets a 10-minute freshness window:

```astro title="src/pages/products/index.astro" {4,10-12}
---

const { entries, error, cacheHint } = await getLiveCollection('products');

if (error) {
  return new Response('Error loading products', { status: 500 });
}

if (cacheHint) {
  Astro.cache.set(cacheHint);
}
Astro.cache.set({ maxAge: 600 });
---

<ul>
  {entries.map((p) => <li>{p.data.name}</li>)}
</ul>
```

#### Invalidating by entry

You can invalidate cached entries by passing a `LiveDataEntry` to . This allows you to target specific cached responses for invalidation based on the entry's cache tags, without needing to clear the entire cache.

The following example invalidates the cached response for a specific product entry:

```ts title="src/pages/api/revalidate.ts"

export async function POST(context) {
  const { entry } = await getLiveEntry('products', 'featured');
  if (entry) {
    await context.cache.invalidate(entry);
  }
  return Response.json({ ok: true });
}
```

## Using JSON Schema files in your editor

<p><Since v="4.13.0" /></p>

Astro auto-generates  files for collections, which you can use in your editor to get IntelliSense and type-checking for data files.

A JSON Schema file is generated for each collection in your project and output to the `.astro/collections/` directory.
For example, if you have two collections, one named `authors` and another named `posts`, Astro will generate `.astro/collections/authors.schema.json` and `.astro/collections/posts.schema.json`.

<h3>Use JSON Schemas in JSON files</h3>

You can manually point to an Astro-generated schema by setting the `$schema` field in your JSON file.
The value should be a relative file path from the data file to the schema.
In the following example, a data file in `src/data/authors/` uses the schema generated for the `authors` collection:

```json title="src/data/authors/armand.json" ins={2}
{
  "$schema": "../../../.astro/collections/authors.schema.json",
  "name": "Armand",
  "skills": ["Astro", "Starlight"]
}
```

<h4>Use a schema for a group of JSON files in VS Code</h4>

In VS Code, you can configure a schema to apply to all files in a collection using the .
In the following example, all files in the `src/data/authors/` directory will use the schema generated for the `authors` collection:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["/src/data/authors/**"],
      "url": "./.astro/collections/authors.schema.json"
    }
  ]
}
```

<h3>Use schemas in YAML files in VS Code</h3>

In VS Code, you can add support for using JSON schemas in YAML files using the  extension.
With this extension installed, you can reference a schema in a YAML file using a special comment syntax:

```yaml title="src/data/authors/armand.yml" ins={1}
# yaml-language-server: $schema=../../../.astro/collections/authors.schema.json
name: Armand
skills:
  - Astro
  - Starlight
```

<h4>Use schemas for a group of YAML files in VS Code</h4>

With the Red Hat YAML extension, you can configure a schema to apply to all YAML files in a collection using the `yaml.schemas` setting.
In the following example, all YAML files in the `src/data/authors/` directory will use the schema generated for the `authors` collection:

```json
{
  "yaml.schemas": {
    "./.astro/collections/authors.schema.json": ["/src/content/authors/*.yml"]
  }
}
```

See  in the Red Hat YAML extension documentation for more details.
