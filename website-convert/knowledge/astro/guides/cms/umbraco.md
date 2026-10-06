---
title: Umbraco & Astro
description: Add content to your Astro project using Umbraco as a CMS
sidebar:
  label: Umbraco
type: cms
stub: false
logo: umbraco
i18nReady: true
---


 is an open-source ASP.NET Core CMS. By default, Umbraco uses Razor pages for its front-end, but can be used as a headless CMS.

## Integrating with Astro

In this section you will use Umbraco's native  to provide content to your Astro project.

### Prerequisites

To get started, you will need to have the following:

1. **An Astro project** - If you don’t have an Astro project yet, our  will get you up and running in no time.
2. **An Umbraco (v12+) project** - If you don’t have an Umbraco project yet, please see this .

### Setting up the Content Delivery API

To enable the Content Delivery API, update your Umbraco project's `appsettings.json` file:

```json title="appsettings.json"
{
  "Umbraco": {
    "CMS": {
      "DeliveryApi": {
        "Enabled": true,
        "PublicAccess": true
      }
    }
  }
}
```

You can configure additional options as needed such as public access, API keys, allowed content types, membership authorisation, and more. See the  for more information.

### Fetching Data

Use a `fetch()` call to the Content Delivery API to access your content and make it available to your Astro components.

The following example displays a list of fetched articles, including properties such as the article date and content.

```astro title="src/pages/index.astro"
---
const res = await fetch('http://localhost/umbraco/delivery/api/v2/content?filter=contentType:article');
const articles = await res.json();
---
<h1>Astro + Umbraco 🚀</h1>
{
  articles.items.map((article: any) => (
      <h1>{article.name}</h1>
      <p>{article.properties.articleDate}</p>
      <div set:html={article.properties.content?.markup}></div>
  ))
}
```


<ReadMore>Read more about .</ReadMore>

## Building a blog with Umbraco and Astro

### Prerequisites

- **An Astro project** - If you don’t have an Astro project yet, our  will get you up and running in no time.

- **An Umbraco project (v12+)** with the Content Delivery API enabled - Follow this  to create a new project.

### Creating blog posts in Umbraco

From the , create a Document Type for a simple blog article called 'Article'.

<Steps>
1. Configure your 'Article' Document Type with the following properties:

		- Title (DataType: Textstring)
		- Article Date (DataType: Date Picker)
		- Content (DataType: Richtext Editor)

2. Toggle "Allow as root" to `true` on the 'Article' document type.

3. From the "Content" section in the Umbraco backoffice, . Repeat the process as many times as you like.

</Steps>

For more information, watch a .

### Displaying a list of blog posts in Astro

Create a `src/layouts/` folder, then add a new file `Layout.astro` with the following code:

```astro title="src/layouts/Layout.astro"
---
---
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>My Blog with Astro and Umbraco</title>
</head>
<body>
    <main>
        <slot />
    </main>
</body>
</html>
```

Your project should now contain the following files:

<FileTree>
- src/
  - **layouts/**
    - **Layout.astro**
  - pages/
    - index.astro
</FileTree>

To create a list of blog posts, first `fetch` to call the Content Delivery API  `content` endpoint and filter by contentType of 'article'. The article objects will include the properties and content set in the CMS. You can then loop through the articles and display each title with a link to its article.

Replace the default contents of `index.astro` with the following code:

```astro title="src/pages/index.astro"
---

const res = await fetch('http://localhost/umbraco/delivery/api/v2/content?filter=contentType:article');
const articles = await res.json();
---
<Layout>
	<h2>Blog Articles</h2>
	{
        articles.items.map((article: any) => (
            <div>
                <h3>{article.properties.title}</h3>
                <p>{article.properties.articleDate}</p>
                <a href={article.route.path}>Read more</a>
            </div>
        ))
    }
</Layout>
```

### Generating individual blog posts

Create the file `[...slug].astro` at the root of the `/pages/` directory. This file will be used to .

Note that the `params` property, which generates the URL path of the page, contains `article.route.path` from the API fetch. Similarly, the `props` property must include the entire `article` itself so that you can access all the information in your CMS entry.

Add the following code to `[...slug].astro` which will create your individual blog post pages:

```astro title="src/pages/[...slug].astro"
---

export async function getStaticPaths() {
    let data = await fetch("http://localhost/umbraco/delivery/api/v2/content?filter=contentType:article");
    let articles = await data.json();
    
    return articles.items.map((article: any) => ({
        params: { slug: article.route.path },
        props: { article: article },
    }));
}

const { article } = Astro.props;
---

<Layout>
  <h1>{article.properties.title}</h1>
  <p>{article.properties.articleDate}</p>
  <div set:html={article.properties.content?.markup}></div>
</Layout>
```

Your project should now contain the following files:

<FileTree>
- src/
  - layouts/
    - Layout.astro
  - pages/
    - index.astro
    - **[...slug].astro**
</FileTree>

With the dev server running, you should now be able to view your Umbraco-created content in your browser preview of your Astro project. Congratulations! 🚀


## Publishing your site

To deploy your site visit our  and follow the instructions for your preferred hosting provider.

## Local dev, HTTPS and self-signed SSL certificates

If you are using the Umbraco HTTPS endpoint locally, any `fetch` queries will result in `fetch failed` with code `DEPTH_ZERO_SELF_SIGNED_CERT`. This is because Node (upon which Astro is built) won't accept self-signed certificates by default. To avoid this, use the Umbraco HTTP endpoint for local dev.

Alternatively, you can set `NODE_TLS_REJECT_UNAUTHORIZED=0` in an `env.development` file and update `astro.config.js` as shown:

```ini title=".env.development"
NODE_TLS_REJECT_UNAUTHORIZED=0
```

```js title="astro.config.mjs"


const { NODE_TLS_REJECT_UNAUTHORIZED } = loadEnv(process.env.NODE_ENV, process.cwd(), "");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = NODE_TLS_REJECT_UNAUTHORIZED;
// https://astro.build/config
export default defineConfig({});
```

This method is described in more detail in this , with an .

## Official Documentation
- 

## Community Resources

- 
- 
- 
- 
- 
