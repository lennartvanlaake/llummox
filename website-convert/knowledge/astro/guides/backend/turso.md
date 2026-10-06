---
title: Turso & Astro
description: Build locally with a SQLite file and deploy globally using Turso.
sidebar:
  label: Turso
type: backend
logo: turso
stub: false
i18nReady: true
---

export const turso = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});
```

## Querying your database

To access information from your database, import `turso` and  inside any `.astro` component.

The following example fetches all `posts` from your table, then displays a list of titles in a `<BlogIndex />` component:

```astro title="src/components/BlogIndex.astro"
---
import { turso } from '../turso'

const { rows } = await turso.execute('SELECT * FROM posts')
---

<ul>
  {rows.map((post) => (
    <li>{post.title}</li>
  ))}
</ul>
```

### SQL Placeholders

The `execute()` method can take , such as `slug`, or pagination.

The following example fetches a single entry from the `posts` table `WHERE` the `slug` is the retrieved value from `Astro.params`, then displays the title of the post.

```astro title="src/pages/index.astro"
---
import { turso } from '../turso'

const { slug } = Astro.params

const { rows } = await turso.execute({
  sql: 'SELECT * FROM posts WHERE slug = ?',
  args: [slug!]
})
---

<h1>{rows[0].title}</h1>
```

## Turso Resources
- 
- 
- 
