---
title: ButterCMS & Astro
description: Add content to your Astro project using ButterCMS
sidebar:
  label: ButterCMS
type: cms
logo: buttercms
stub: false
i18nReady: true
---


    export const butterClient = Butter(import.meta.env.BUTTER_TOKEN);
    ```
</Steps>

**This authenticates the SDK using your API Token and exports it to be used across your project.**

### Fetching Data
To fetch content, import this client and use one of its `retrieve` functions. 

In this example, we  that has three fields: a short text `name`, a number `price`, and a WYSIWYG `description`. 

```astro title="src/pages/ShopItem.astro"
---

const response = await butterClient.content.retrieve(["shopitem"]);

interface ShopItem {
  name: string;
  price: number;
  description: string;
}

const items = response?.data?.data.shopitem as ShopItem[];
---

<body>
  {
    items.map((item) => (
      <div>
        <h2>
          {item.name} - ${item.price}
        </h2>
        <p set:html={item.description} />
      </div>
    ))
  }
</body>
```

The interface mirrors the field types. The WYSIWYG `description` field loads as a string of HTML, and  lets you render it.

Similarly, you can  and display its fields:

```astro title="src/pages/ShopItem.astro"
---

const response = await butterClient.page.retrieve("*", "simple-page");
const pageData = response?.data?.data;

interface Fields {
  seo_title: string;
  headline: string;
  hero_image: string;
}

const fields = pageData?.fields as Fields;
---

<html>
  <title>{fields.seo_title}</title>
  <body>
    <h1>{fields.headline}</h1>
    <img src={fields.hero_image} />
  </body>
</html>
```

## Official Resources

- 
- The 
- ButterCMS's 

## Community Resources 
- Add yours!
