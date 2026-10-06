---
title: Zod API Reference
sidebar:
  label: 'astro/zod'
i18nReady: true
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 6
---

 is a TypeScript-based schema declaration and validation library. This allows you to define schemas you can use to validate data and transform data, from a simple type (e.g. `string`, `number`) to complex data structures (e.g. nested objects).

The `astro/zod` module exposes a re-export of Zod that gives you access to all the features of Zod v4. By using this module, you do not need to install Zod yourself. This also ensures that your project uses the same API versions as Astro when using features such as  or .

<ReadMore>See the  for complete documentation on how Zod works and what features are available.</ReadMore>

## Imports from `astro/zod`

```ts

```

### `z`

<p>

**Type:** `object`
</p>

The `z` utility gives you access to validators for a wide range of data types, methods and types for working with your data.

<ReadMore>Learn more about the `z` utility in </ReadMore>

#### Common data type validators

With Zod, you can validate any type of data, such as , ,  and more.

The following example shows a cheatsheet of many common Zod data types to create a `user` schema:

```ts

const user = z.object({
  username: z.string(),
  name: z.string().min(2),
  email: z.email(),
  role: z.enum(["admin", "editor"]),
  language: z.enum(["en", "fr", "es"]).default("en"),
  hobbies: z.array(z.string()),
  age: z.number(),
  isEmailConfirmed: z.boolean(),
  inscriptionDate: z.date(),
  website: z.url().optional(),
});
```

#### Extracting a TypeScript type

Zod allows you to create a TypeScript type from any schema . This can be useful for describing an expected data structure when .

The following example create a `User` type based on the previous schema:

```ts
type User = z.infer<typeof user>;

/* The `User` type will be:
 * type User = {
 *   username: string;
 *   name: string;
 *   email: string;
 *   role: "admin" | "editor";
 *   language: "en" | "fr" | "es";
 *   hobbies: string[];
 *   age: number;
 *   isEmailConfirmed: boolean;
 *   inscriptionDate: Date;
 *   website?: string | undefined;
 * }
 */
```

#### Using Zod methods

Zod provides various schema methods to , , or create .

```ts

// Customize the error message
const nonEmptyStrings = z.array(z.string()).nonempty("Can't be empty!");

// Validate a data from a schema
nonEmptyStrings.parse([]); // will throws our custom error

// Create an object from a URL for a decorative img
const decorativeImg = z.string().transform((value) => {
  return { src: value, alt: "" };
});

// Create a custom validator and error message for a string
const constrainedString = z
  .string()
  .refine((val) => val.length > 0 && val.length <= 255, {
    error: "Must be between 1 and 255 characters.",
  });
```

### Individual imports

Alternatively, you can import all the Zod validators, methods and types available in the  directly from the module.

The following example imports `coerce` to create a `Date` object from a date string:

```ts

const publishedOn = coerce.date();
const publicationDate = publishedOn.parse("2025-12-03");
```
