---
title: Data fetching
description: Learn how to fetch remote data with Astro using the fetch API.
i18nReady: true
---
`.astro` files can fetch remote data to help you generate your pages.

## `fetch()` in Astro

All  have access to the  in their component script to make HTTP requests to APIs using the full URL (e.g. `https://example.com/api`).
Additionally, you can construct a URL to your project's pages and endpoints that are rendered on demand on the server using .

This fetch call will be executed at build time, and the data will be available to the component template for generating dynamic HTML. If  mode is enabled, any fetch calls will be executed at runtime.

💡 Take advantage of  inside of your Astro component script.

💡 Pass fetched data to both Astro and framework components, as props.

```astro /await fetch\\(.*?\\);/
---
// src/components/User.astro


const response = await fetch("https://randomuser.me/api/");
const data = await response.json();
const randomUser = data.results[0];
---
<!-- Data fetched at build can be rendered in HTML -->
<h1>User</h1>
<h2>{randomUser.name.first} {randomUser.name.last}</h2>

<!-- Data fetched at build can be passed to components as props -->
<Contact client:load email={randomUser.email} />
<Location city={randomUser.location.city} />
```

:::note
Remember, all data in Astro components is fetched when a component is rendered.

Your deployed Astro site will fetch data **once, at build time**. In dev, you will see data fetches on component refreshes. If you need to re-fetch data multiple times client-side, use a  or a  in an Astro component.
:::

## `fetch()` in Framework Components

The `fetch()` function is also globally available to any :

```tsx title="src/components/Movies.tsx" /await fetch\\(.*?\\)/

const data = await fetch('https://example.com/movies.json').then((response) => response.json());

// Components that are build-time rendered also log to the CLI.
// When rendered with a `client:*` directive, they also log to the browser console.
console.log(data);

const Movies: FunctionalComponent = () => {
  // Output the result to the page
  return <div>{JSON.stringify(data)}</div>;
};

export default Movies;
```

## GraphQL queries

Astro can also use `fetch()` to query a GraphQL server with any valid GraphQL query.

```astro title="src/components/Film.astro" "await fetch"
---
const response = await fetch(
  "https://swapi-graphql.netlify.app/.netlify/functions/index",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query getFilm ($id:ID!) {
          film(id: $id) {
            title
            releaseDate
          }
        }
      `,
      variables: {
        id: "ZmlsbXM6MQ==",
      },
    }),
  }
);


const json = await response.json();
const { film } = json.data;
---
<h1>Fetching information about Star Wars: A New Hope</h1>
<h2>Title: {film.title}</h2>
<p>Year: {film.releaseDate}</p>
```

## Fetch from a Headless CMS

Astro components can fetch data from your favorite CMS and then render it as your page content. Using , components can even generate pages based on your CMS content.

See our  for full details on integrating Astro with headless CMSes including Storyblok, Contentful, and WordPress.

## Community resources

- 
