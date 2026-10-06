---
# NOTE: This file is auto-generated from 'scripts/error-docgen.mjs'
# Do not make edits to it directly, they will be overwritten.
# Instead, change this file: https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts
# Translators, please remove this note and the <DontEditWarning/> component.

title: Error reference
i18nReady: true
githubURL: https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts
---

import DontEditWarning from '~/components/DontEditWarning.astro'

<DontEditWarning />

The following reference is a complete list of the errors you may encounter while using Astro. For additional assistance, including common pitfalls, please also see our .

## Astro Errors

- <br/>Unknown compiler error.
- <br/>`Astro.clientAddress` is not available in current adapter.
- <br/>`Astro.clientAddress` cannot be used inside prerendered routes.
- <br/>`Astro.clientAddress` is not available in prerendered pages.
- <br/>No static path found for requested path.
- <br/>Invalid type returned by Astro page.
- <br/>Missing value for `client:media` directive.
- <br/>No matching renderer found.
- <br/>No client entrypoint specified in renderer.
- <br/>Missing hint on `client:only` directive.
- <br/>Invalid value returned by a route from `getStaticPaths()`.
- <br/>Invalid entry inside `getStaticPaths()`'s return value.
- <br/>Invalid value returned by `getStaticPaths()`.
- <br/>Missing params property on `getStaticPaths()` route.
- <br/>Invalid route parameter returned by `getStaticPaths()`.
- <br/>`getStaticPaths()` function required for dynamic routes.
- <br/>Invalid slot name.
- <br/>Cannot use server-side rendering without an adapter.
- <br/>Adapter does not support server output.
- <br/>Cannot use server islands without an adapter.
- <br/>No import found for component.
- <br/>Invalid prerender export.
- <br/>Invalid component arguments.
- <br/>Page number param not found.
- <br/>Image missing required "alt" property.
- <br/>Error while loading image service.
- <br/>Missing image dimensions.
- <br/>Failed to retrieve remote image dimensions.
- <br/>Remote image is not allowed.
- <br/>Unsupported image format.
- <br/>Unsupported image conversion.
- <br/>Cannot optimize SVG.
- <br/>Prerendered dynamic endpoint has path collision.
- <br/>Prerendered route generates the same path as another route.
- <br/>Expected src to be an image.
- <br/>Expected image options.
- <br/>Expected image options, not an ESM-imported image.
- <br/>`getImage()` must be used on the server.
- <br/>Cannot set both `densities` and `widths`.
- <br/>Image not found.
- <br/>Could not process image metadata.
- <br/>Could not transform image.
- <br/>Unable to set response.
- <br/>The middleware didn't return a `Response`.
- <br/>The middleware returned something that is not a `Response` object.
- <br/>The endpoint did not return a `Response`.
- <br/>Value assigned to `locals` is not accepted.
- <br/>`locals` must not be reassigned.
- <br/>`Astro.response.headers` must not be reassigned.
- <br/>Can't load the middleware.
- <br/>Local images must be imported.
- <br/>Astro.glob() used outside of an Astro file.
- <br/>Astro.glob() did not match any files.
- <br/>A redirect must be given a location with the `Location` header.
- <br/>Unsupported or malformed URL.
- <br/>Invalid redirect destination.
- <br/>Invalid dynamic route.
- <br/>Could not find Sharp.
- <br/>Unknown Vite error.
- <br/>Could not import file.
- <br/>Invalid glob pattern.
- <br/>Astro couldn't find the correct page to render.
- <br/>The provided locale does not exist.
- <br/>Index page not found.
- <br/>Function incompatible with the current strategy.
- <br/>Prerendered routes aren't supported when internationalization domains are enabled.
- <br/>Enabled manual internationalization routing without having a middleware.
- <br/>Invalid internationalization middleware configuration.
- <br/>Astro can't render the route.
- <br/>Unhandled rejection.
- <br/>Internationalization routing is not enabled.
- <br/>The path doesn't contain any locale.
- <br/>Route not found.
- <br/>Invalid environment variables.
- <br/>`envPrefix` conflicts with secret environment variables.
- <br/>Module is only available server-side.
- <br/>Cannot use `Astro.rewrite()` after the request body has been read.
- <br/>Forbidden rewrite to a static route.
- <br/>An unknown error occurred while reading or writing files to disk.
- <br/>Cannot extract the font type from the given URL.
- <br/>Cannot determine weight and style from font file.
- <br/>Cannot fetch the given font file.
- <br/>Font family not found.
- <br/>Font file URL not found.
- <br/>`experimental_getFontFileURL()` requires the request URL with on-demand rendering.
- <br/>Unavailable Astro global in `getStaticPaths()`.
- <br/>Unable to load the logger.
- <br/>The configuration of the logger is not serializable.
- <br/>No manifest available.

## CSS Errors

- <br/>Unknown CSS error.
- <br/>CSS syntax error.

## Markdown Errors

- <br/>Unknown Markdown error.
- <br/>Failed to parse Markdown frontmatter.
- <br/>Invalid frontmatter injection.
- <br/>MDX integration missing.
- <br/>Unknown configuration error.
- <br/>Specified configuration file not found.
- <br/>Legacy configuration detected.

## CLI Errors

- <br/>Unknown CLI error.
- <br/>Failed to generate content types.

## Content Collection Errors

- <br/>Unknown content collection error.
- <br/>Attempted to render an undefined content collection entry.
- <br/>Invalid use of `getDataEntryById` or `getEntryBySlug` function.
- <br/>Content entry frontmatter does not match schema.
- <br/>Content entry data does not match schema.
- <br/>Legacy content config file found.
- <br/>Content collection is missing a `loader` definition.
- <br/>Content collection has an invalid `type` field.
- <br/>Content loader returned an entry with an invalid `id`.
- <br/>Content entry data does not match schema.
- <br/>Error in live content config.
- <br/>Content entry is missing an ID.
- <br/>Invalid content entry slug.
- <br/>Content schema should not contain `slug`.
- <br/>Content and data cannot be in same collection.
- <br/>Collection contains entries of a different type.
- <br/>Data collection entry failed to parse.
- <br/>Duplicate content entry slug.
- <br/>Unsupported transform in content config.
- <br/>File parser not found.
- <br/>Glob patterns are not supported in the file loader.

## Action Errors

- <br/>Actions must be used with server output.
- <br/>Action handler returned invalid data.
- <br/>Action not found.
- <br/>Action called from the server without `Astro.callAction()`.
- <br/>Can't load the Astro actions.

## Session Errors

- <br/>Session storage could not be initialized.
- <br/>Session data could not be saved.

## Cache Errors

- <br/>Cache provider not found.
- <br/>Cache is not enabled.
- <br/>Conflicting cache query configuration.
