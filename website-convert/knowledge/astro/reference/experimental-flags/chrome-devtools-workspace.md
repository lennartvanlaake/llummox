---
title: Experimental Chrome DevTools workspace
sidebar:
  label: Chrome DevTools workspace
i18nReady: true
---



<p>

**Type:** `boolean`<br />
**Default:** `false`<br />
<Since v="5.13.0" />
</p>

Enables experimental  for the Astro dev server.

This feature allows you to edit files directly in Chrome DevTools and have those changes reflected in your local file system via a connected workspace folder. This is useful for applying edits such as adjusting CSS values without leaving your browser tab.

With this feature enabled, running `astro dev` will automatically configure a Chrome DevTools workspace for your project. Your project will then appear as an available . Then, changes that you make in the "Sources" panel are automatically saved to your project source code.

To enable this feature, add the experimental flag `chromeDevtoolsWorkspace` to your Astro config:

```js title="astro.config.mjs" ins={4-6}

export default defineConfig({
  experimental: {
    chromeDevtoolsWorkspace: true,
  },
});
```

## Connecting your project

Astro will create the necessary configuration file to support Chrome DevTools workspaces. However, your project must also be  to enable file saving.

<Steps>

1.  with the appropriate CLI command for your package manager.

2. Navigate to your site preview (e.g. `http://localhost:4321/`) in Chrome and open DevTools.

3. Under the **Sources** > **Workspaces** tab, you will find your Astro project folder. Click **Connect** to add your directory as a workspace.

</Steps>

See the  for more information.
