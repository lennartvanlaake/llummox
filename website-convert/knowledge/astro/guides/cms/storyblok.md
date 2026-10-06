---
title: Storyblok & Astro
description: Add content to your Astro project using Storyblok as a CMS
sidebar:
  label: Storyblok
type: cms
logo: storyblok
stub: false
i18nReady: true
---





const env = loadEnv("", process.cwd(), 'STORYBLOK');

export default defineConfig({
  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_TOKEN,
      components: {
        // Add your components here
      },
      apiOptions: {
        // Choose your Storyblok space region
        region: 'us', // optional,  or 'eu' (default)
      },
    })
  ],
});
```

The Storyblok integration requires an object with the following properties:

1. `accessToken` - This references the Storyblok API token that you added in the previous step.

    :::tip
    Since the Astro config file does not normally support environment variables, use the `loadEnv` function from Vite to load them.
    :::

2. `components` - An object that maps Storyblok component names to paths to your local components. This is required to render your Storyblok Bloks in Astro.

    :::note
    The component paths are relative to the `src` directory. For example, if your component is located at `src/storyblok/MyComponent.astro`, the path would be `storyblok/MyComponent` (without the `.astro` extension).
    :::

3. `apiOptions` - An object containing . 

    :::caution
    By default, the region is `eu`. If your Storyblok space was created in the US region, you will need to set the region to `us`.
    :::

### Connecting Bloks to Astro components

To connect your Bloks to Astro, create a new folder named `storyblok` in the `src` directory. This folder will contain all the Astro components that will match your Bloks in your Storyblok Blok library.

In this example, you have a `blogPost` Blok content type in your Storyblok library with the following fields:

- `title` - A text field
- `description` - A text field
- `content` - A rich text field

Our goal is to create the equivalent Astro component that will use these fields to render its content. To do this, create a new file named `BlogPost.astro` inside `src/storyblok` with the following content:

```astro title="src/storyblok/BlogPost.astro"
---



const env = loadEnv("", process.cwd(), 'STORYBLOK');

export default defineConfig({
  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_TOKEN,
      components: {
        blogPost: 'storyblok/BlogPost',
      },
      apiOptions: { 
        region: 'us',
      },
    })
  ],
});
```

### Fetching data

To test the setup, in Storyblok create a new story with the `blogPost` content type named `test-post`.
In Astro, create a new page in the `src/pages/` directory named `test-post.astro` with the following content:

```astro title="src/pages/test-post.astro"
---

const content = data.story.content;
---
<StoryblokComponent blok={content} />
```

To query your data, use the `useStoryblokApi` hook. This will initialize a new client instance using your integration configuration.

To render your content, pass the `content` property of the Story to the `StoryblokComponent` as a `blok` prop. This component will render the Bloks that are defined inside the `content` property. In this case, it will render the `BlogPost` component.

## Making a blog with Astro and Storyblok

With the integration set up, you can now create a blog with Astro and Storyblok.

### Prerequisites

1. **A Storyblok space** - For this tutorial, we recommend using a new space. If you already have a space with Bloks, feel free to use them, but you will need to modify the code to match the Blok names and content types.

2. **An Astro project integrated with Storyblok** - See  for instructions on how to set up the integration.

### Creating a blok library

To create Bloks, go to the Storyblok app and click on the **Block Library** tab. Click on the <kbd>+ New blok</kbd> button and create the following Bloks:

1. `blogPost` - A content type Blok with the following fields:
    - `title` - A text field
    - `description` - A text field
    - `content` - A rich text field

2. `blogPostList` - An empty nestable Blok

3. `page` - A content type Blok with the following fields:
    - `body` - A nestable Blok

### Creating content

To add new content, go to the content section by clicking on the **Content** tab. Using the Blok library that you created in the previous step, create the following stories:

1. `home` - A content type story with the `page` Blok. Inside the `body` field, add a `blogPostList` Blok.

2. `blog/no-javascript` - A story with the `blogPost` content type inside the blog folder.
    ```yaml
    title: No JavaScript
    description: A sample blog post
    content: Hi there! This blog post doesn't use JavaScript.
    ```
3. `blog/astro-is-amazing` - A story with the `blogPost` content type inside the blog folder.
    ```yaml
    title: Astro is amazing
    description: We love Astro
    content: Hi there! This blog post was build with Astro.
    ```

Now that you have your content ready, return to your Astro project and start building your blog.

### Connecting Bloks to components

To connect your newly created Bloks to Astro components, create a new folder named `storyblok` in your `src` directory and add the following files:

`Page.astro` is a nestable Block content type component that will recursively render all the Bloks inside the `body` property of the `page` Blok. It also adds the `storyblokEditable` attributes to the parent element which will allow us to edit the page in Storyblok.

```astro title="src/storyblok/Page.astro"
---

const { blok } = Astro.props
---

<main {...storyblokEditable(blok)}>
  {
    blok.body?.map((blok: any) => {
      return <StoryblokComponent blok={blok} />
    })
  }
</main>
```

`BlogPost.astro` will render the `title`, `description` and `content` properties of the `blogPost` Blok.

To transform the `content` property from a rich text field to HTML, you can use the `renderRichText` helper function.

```astro title="src/storyblok/BlogPost.astro"
---


const storyblokApi = useStoryblokApi();

const { data } = await storyblokApi.get("cdn/stories", {
  version: import.meta.env.DEV ? "draft" : "published",
  content_type: "blogPost",
});

const posts = data.stories.map((story: any) => {
  return {
    title: story.content.title,
    date: new Date(story.published_at).toLocaleDateString("en-US", {
      dateStyle: "full",
    }),
    description: story.content.description,
    slug: story.full_slug,
  };
});

const { blok } = Astro.props;
---

<ul {...storyblokEditable(blok)}>
  {
    posts.map((post: any) => (
      <li>
        <time>{post.date}</time>
        <a href={post.slug}>{post.title}</a>
        <p>{post.description}</p>
      </li>
    ))
  }
</ul>
```

Finally, add your components to the `components` property of the `storyblok` config object in `astro.config.mjs`. The key is the name of the Blok in Storyblok, and the value is the path to the component relative to `src`.

```js title="astro.config.mjs" ins={12-14}



const env = loadEnv("", process.cwd(), 'STORYBLOK');

export default defineConfig({
  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_TOKEN,
      components: {
        blogPost: 'storyblok/BlogPost',
        blogPostList: 'storyblok/BlogPostList',
        page: 'storyblok/Page',
      },
      apiOptions: { 
        region: 'us',
      },
    })
  ],
});
```

### Generating pages

To create a route for a specific `page`, you can fetch its content directly from the Storyblok API and pass it to the `StoryblokComponent` component.  Remember to make sure you have added the `Page` component to your astro.config.mjs.

Create an `index.astro` file in `src/pages/` to render the `home` page:

```astro title="src/pages/index.astro" {3,7,8,9,17} 
---

const { data } = await storyblokApi.get('cdn/stories/home', {
  version: import.meta.env.DEV ? "draft" : "published",
});
const content = data.story.content;
---
<html lang="en">
  <head>
    <title>Storyblok & Astro</title>
  </head>
  <body>
    <StoryblokComponent blok={content} />
  </body>
</html>
```

To generate pages for all of your blog posts, create a `.astro` page that will create dynamic routes. This approach varies depending on whether your routes are prerendered (the default in Astro) or .

#### Static site generation

If you are using Astro's default static site generation, you will use  and the `getStaticPaths` function to generate your project pages.

Create a new directory `src/pages/blog/` and add a new file called `[...slug].astro` with the following code:

```astro title="src/pages/blog/[...slug].astro"
---


export async function getStaticPaths() {
  const sbApi = useStoryblokApi();

  const { data } = await sbApi.get("cdn/stories", {
    content_type: "blogPost",
    version: import.meta.env.DEV ? "draft" : "published",
  });

  const stories = Object.values(data.stories);

  return stories.map((story: any) => {
    return {
      params: { slug: story.slug },
    };
  });
}

const sbApi = useStoryblokApi();
const { slug } = Astro.params;
const { data } = await sbApi.get(`cdn/stories/blog/${slug}`, {
  version: import.meta.env.DEV ? "draft" : "published",
});

const story = data.story;
---

<html lang="en">
  <head>
    <title>Storyblok & Astro</title>
  </head>
  <body>
    <StoryblokComponent blok={story.content} />
  </body>
</html>
```

This file will generate a page for each story, with the slug and content fetched from the Storyblok API.

:::note
When adding folders inside of Storyblok, include them in the slug when interacting with the Storyblok API. For example, in the GET request above we can use **cdn/stories/blog**, with a blog folder inside rather than using them at the root.
:::

#### On-demand rendering

If you are , you will use dynamic routes to fetch the page data from Storyblok.

Create a new directory `src/pages/blog/` and add a new file called `[...slug].astro` with the following code:

```astro title="src/pages/blog/[...slug].astro"
---

let content;
try {
  const { data } = await storyblokApi.get(`cdn/stories/blog/${slug}`, {
    version: import.meta.env.DEV ? "draft" : "published",
  });
  content = data.story.content
} catch (error) {
  return Astro.redirect('/404')
}
---
<html lang="en">
  <head>
    <title>Storyblok & Astro</title>
  </head>
  <body>
    <StoryblokComponent blok={content} />
  </body>
</html>
```

This file will fetch and render the page data from Storyblok that matches the dynamic `slug` parameter.

Since you are using a redirect to `/404`, create a 404 page in `src/pages`: 

```astro title="src/pages/404.astro"
<html lang="en">
  <head>
    <title>Not found</title>
  </head>
  <body>
    <p>Sorry, this page does not exist.</p>
  </body>
</html>
```

If the story is not found, the request will be redirected to the 404 page.

### Publishing your site

To deploy your website, visit our  and follow the instructions for your preferred hosting provider.

#### Rebuild on Storyblok changes

If your project is using Astro's default static mode, you will need to set up a webhook to trigger a new build when your content changes. If you are using Netlify or Vercel as your hosting provider, you can use its webhook feature to trigger a new build from Storyblok events. 

##### Netlify

To set up a webhook in Netlify:

<Steps>
1. Go to your site dashboard and click on **Build & deploy**. 

2. Under the **Continuous Deployment** tab, find the **Build hooks** section and click on **Add build hook**. 

3. Provide a name for your webhook and select the branch you want to trigger the build on. Click on **Save** and copy the generated URL.
</Steps>

##### Vercel

To set up a webhook in Vercel:

<Steps>
1. Go to your project dashboard and click on **Settings**. 

2. Under the **Git** tab, find the **Deploy Hooks** section. 

3. Provide a name for your webhook and the branch you want to trigger the build on. Click **Add** and copy the generated URL.
</Steps>

##### Adding a webhook to Storyblok

In your Storyblok space **Settings**, click on the **Webhooks** tab. Paste the webhook URL you copied in the **Story published & unpublished** field and hit <kbd>Save</kbd> to create a webhook.

Now, whenever you publish a new story, a new build will be triggered and your blog will be updated.

## Official Resources

-  to add Storyblok to your project.
- 
- 

## Community Resources 

-  by Sandra Rodgers
-  by Jonas Gierer
-  by Sandra Rodgers
