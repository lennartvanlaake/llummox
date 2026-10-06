---
title: Caisy & Astro
description: Add content to your Astro project using Caisy as a CMS
sidebar:
  label: Caisy
type: cms
logo: caisy
i18nReady: true
stub: true
---

 is a headless CMS that exposes a GraphQL API to access content.

## Using Caisy CMS with Astro

Use `graphql-request` and Caisy's rich text renderer for Astro to fetch your CMS data and display your content on an Astro page:

```astro title="src/pages/blog/[...slug].astro"
---


const params = Astro.params;

const client = new GraphQLClient(
	`https://cloud.caisy.io/api/v3/e/${import.meta.env.CAISY_PROJECT_ID}/graphql`,
	{
		headers: {
			'x-caisy-apikey': import.meta.env.CAISY_API_KEY
		}
	}
);
const gqlResponse = await client.request(
	gql`
		query allBlogArticle($slug: String) {
			allBlogArticle(where: { slug: { eq: $slug } }) {
				edges {
					node {
						text {
							json
						}
						title
						slug
						id
					}
				}
			}
		}
	`,
	{ slug: params.slug }
);

const post = gqlResponse?.allBlogArticle?.edges?.[0]?.node;
---
<h1>{post.title}</h1>
<RichTextRenderer node={post.text.json} />
```

## Official Resources

- Check out the Caisy + Astro example on  or 
- Query your documents in  and multiple .
- Use  to query large numbers of documents.
- Use  in your queries and  the results
