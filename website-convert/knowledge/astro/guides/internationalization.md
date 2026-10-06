---
title: Internationalization (i18n) Routing
sidebar:
  label: Internationalization (i18n)
description: Learn how to use Astro’s i18n routing features to localize your site’s pages.
i18nReady: true
---



// defaultLocale is "es"
const aboutURL = getRelativeLocaleUrl("es", "about");
---

<a href="/get-started/">¡Vamos!</a>
<a href={getRelativeLocaleUrl('es', 'blog')}>Blog</a>
<a href={aboutURL}>Acerca</a> 
``` 

## `routing`

Astro's built-in file-based routing automatically creates URL routes for you based on your file structure within `src/pages/`.

When you configure i18n routing, information about this file structure (and the corresponding URL paths generated) is available to the i18n helper functions so they can generate, use, and verify the routes in your project. Many of these options can be used together for even more customization and per-language flexibility.

You can even choose to  for even greater control.

### `prefixDefaultLocale`

<p><Since v="3.5.0" /></p>

This routing option defines whether or not your default language's URLs should use a language prefix (e.g. `/en/about/`).

All non-default supported languages **will** use a localized prefix (e.g. `/fr/` or `/french/`) and content files must be located in appropriate folders. This configuration option allows you to specify whether your default language should also follow a localized URL structure.

This setting also determines where the page files for your default language must exist (e.g. `src/pages/about/` or `src/pages/en/about`) as the file structure and URL structure must match for all languages.

- `"prefixDefaultLocale: false"` (default): URLs in your default language will **not** have a `/[locale]/` prefix. All other locales will.

- `"prefixDefaultLocale: true"`: All URLs, including your default language, will have a `/[locale]/` prefix.


#### `prefixDefaultLocale: false`

```js title="astro.config.mjs" ins={7}


  } else {
    return redirectToDefaultLocale(ctx, 302);
  }
})
```

#### middleware function

The  function manually creates Astro's i18n middleware. This allows you to extend Astro's i18n routing instead of completely replacing it. 

You can run `middleware()` with  in combination with your own middleware, using the  utility to determine the order:

```js title="src/middleware.js"


  // the /about page is an exception and we want to render it
  if (ctx.url.pathname.startsWith("/about")) {
    return new Response("About page", {
      status: 200,
    });
  } else {
    return response;
  }
});

export const onRequest = sequence(
  userMiddleware,
  middleware({
    redirectToDefaultLocale: false,
    prefixDefaultLocale: true,
    fallbackType: "redirect",
  }),
);
```

## `domains`

<p><Since v="4.9.0" /></p>

This routing option allows you to customize your domains on a per-language basis for `server` rendered projects using the  or  adapter with a `site` configured.

Add `i18n.domains` to map any of your supported `locales` to custom URLs:

```js title="astro.config.mjs" {3-7} ins={14-17}
import { defineConfig } from "astro/config"
export default defineConfig({
  site: "https://example.com",
  output: "server", // required, with no prerendered pages
  adapter: node({
    mode: 'standalone',
  }),
  i18n: {
    locales: ["es", "en", "fr", "ja"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false
    },
    domains: {
      fr: "https://fr.example.com",
      es: "https://example.es"
    }
  }
})
```

All non-mapped `locales` will follow your `prefixDefaultLocales` configuration. 

With the above configuration:

- The file `/fr/about.astro` will create the URL `https://fr.example.com/about`.
- The file `/es/about.astro` will create the URL `https://example.es/about`.
- The file `/ja/about.astro` will create the URL `https://example.com/ja/about`.
- The file `/about.astro` will create the URL `https://example.com/about`.

The above URLs will also be returned by the `getAbsoluteLocaleUrl()` and `getAbsoluteLocaleUrlList()` functions.

## Fallback

When a page in one language doesn't exist (e.g. a page that is not yet translated), instead of displaying a 404 page, you can choose to display fallback content from another `locale` on a per-language basis. This is useful when you do not yet have a page for every route, but you want to still provide some content to your visitors.

Your fallback strategy consists of two parts: choosing which languages should fallback to which other languages () and choosing whether to perform a  or a  to show the fallback content ( added in Astro v4.15.0).

For example, when you configure `i18n.fallback: { fr: "es" }`, Astro will ensure that a page is built in `src/pages/fr/` for every page that exists in `src/pages/es/`.

If any page does not already exist, then a page will be created depending on your `fallbackType`:

- With a redirect to the corresponding `es` route (default behavior).
- With the content of the `/es/` page (`i18n.routing.fallbackType: "rewrite"`).

For example, the configuration below sets `es` as the fallback locale for any missing `fr` routes. This means that a user visiting `example.com/fr/my-page/` will be shown the content for `example.com/es/my-page/` (without being redirected) instead of being taken to a 404 page when `src/pages/fr/my-page.astro` does not exist.

```js title="astro.config.mjs" ins={6-8,10} 
import { defineConfig } from "astro/config"
export default defineConfig({
  i18n: {
    locales: ["es", "en", "fr"],
    defaultLocale: "en",
    fallback: {
      fr: "es"  
    },
    routing: {
      fallbackType: "rewrite"
    }
  }
})
```

## Custom locale paths

In addition to defining your site's supported `locales` as strings (e.g. "en", "pt-br"), Astro also allows you to map an arbitrary number of  to a custom URL `path`. While locales can be strings of any format as long as they correspond to your project folder structure, `codes` must follow the browser's accepted syntax.

Pass an object to the `locales` array with a `path` key to define a custom URL prefix, and `codes` to indicate the languages mapped to this URL. In this case, your `/[locale]/` folder name must match exactly the value of the `path` and your URLs will be generated using the `path` value.

This is useful if you support multiple variations of a language (e.g. `"fr"`, `"fr-BR"`, and `"fr-CA"`) and you want to have all these variations mapped under the same URL `/fr/`, or even customize it entirely (e.g. `/french/`):

```js title="astro.config.mjs" del={4} ins={5-8}
import { defineConfig } from "astro/config"
export default defineConfig({
  i18n: {
    locales: ["es", "en", "fr"],
    locales: ["es", "en", {
      path: "french", // no slashes included
      codes: ["fr", "fr-BR", "fr-CA"]
    }],
    defaultLocale: "en",
    routing: {
        prefixDefaultLocale: true
    }
  }
})
```

When using functions from the  to compute valid URL paths based on your configuration (e.g. `getRelativeLocaleUrl()`), .

#### Limitations

This feature has some restrictions:
- The `site` option is mandatory.
- The `output` option must be set to `"server"`.
- There cannot be any individual prerendered pages.


Astro relies on the following headers in order to support the feature:
-  and . Astro will use the former, and if not present, will try the latter.
-  and  of the server request.

Make sure that your server proxy/hosting platform is able to provide this information. Failing to retrieve these headers will result in a 404 (status code) page.

## Browser language detection

Astro’s i18n routing allows you to access two properties for browser language detection in pages rendered on demand: `Astro.preferredLocale` and `Astro.preferredLocaleList`. All pages, including static prerendered pages, have access to `Astro.currentLocale`.

These combine the browser's `Accept-Language` header, and your `locales` (strings or `codes`) to automatically respect your visitor's preferred languages.

- :  Astro can compute a **preferred locale** for your visitor if their browser's preferred locale is included in your `locales` array. This value is undefined if no such match exists.

- : An array of all locales that are both requested by the browser and supported by your website. This produces a list of all compatible languages between your site and your visitor. The value is `[]` if none of the browser's requested languages are found in your `locales` array. If the browser does not specify any preferred languages, then this value will be [`i18n.locales`].

- : The locale computed from the current URL, using the syntax specified in your `locales` configuration. If the URL does not contain a `/[locale]/` prefix, then the value will default to .

In order to successfully match your visitors' preferences, provide your `codes` using the same pattern .

[`site`]: /en/reference/configuration-reference/#site
[`i18n.locales`]: /en/reference/configuration-reference/#i18nlocales
