---
title: Monitor your Astro Site with Sentry
description: How to monitor your Astro site with Sentry
sidebar:
  label: Sentry
type: backend
logo: sentry
stub: false
i18nReady: true
---




export default defineConfig({
  integrations: [
    sentry({
      dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      sourceMapsUploadOptions: {
        project: 'example-project',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],
});
```
Once you've configured your `sourceMapsUploadOptions` and added your `dsn`, the SDK will automatically capture and send errors and performance events to Sentry.

## Test your setup

Add the following `<button>` element to one of your `.astro` pages. This will allow you to manually trigger an error so you can test the error reporting process.

```astro title="src/pages/index.astro"
<button onclick="throw new Error('This is a test error')">Throw test error</button>
```

To view and resolve the recorded error, log into  and open your project.
