---
title: Deploy your Astro Site to AWS with SST
description: How to deploy your Astro site to AWS with SST
sidebar:
  label: AWS via SST
type: deploy
logo: sst
supports: ['ssr', 'static']
i18nReady: true
---

You can deploy an Astro site to AWS using , an open-source framework for deploying modern full-stack applications with SSG and SSR support.

You can also use any additional SST components like cron jobs, Buckets, Queues, etc while maintaining type-safety.

## Quickstart

<Steps>
1. Create an astro project.

2. Run `npx sst@latest init`.

3. It should detect that you are using Astro and ask you to confirm.

4. Once you're ready for deployment you can run `npx sst deploy --stage production`.
</Steps>

You can also read  that will guide you through the steps.

### SST components

To use any , add them to `sst.config.ts`. 

```ts {1} {5} title="sst.config.ts"
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public",
});
new sst.aws.Astro("MyWeb", {
  link: [bucket],
});
```

And then access them in your `.astro` file.

```astro
---
import { Resource } from "sst"
console.log(Resource.MyBucket.name)
---
```

Consult the  to learn more.

If you have any questions, you can .
