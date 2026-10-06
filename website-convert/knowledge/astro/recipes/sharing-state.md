---
title: Share state between Astro components
description: Learn how to share state across Astro components with Nano Stores.
i18nReady: true
type: recipe
---


:::tip
Using framework components? See !
:::

When building an Astro website, you may need to share state across components. Astro recommends the use of  for shared client storage.

## Recipe

<Steps>
1. Install Nano Stores:

    <PackageManagerTabs>
      <Fragment slot="npm">
      ```shell
      npm install nanostores
      ```
      </Fragment>
      <Fragment slot="pnpm">
      ```shell
      pnpm add nanostores
      ```
      </Fragment>
      <Fragment slot="yarn">
      ```shell
      yarn add nanostores
      ```
      </Fragment>
    </PackageManagerTabs>

2. Create a store. In this example, the store tracks whether a dialog is open or not:

    ```ts title="src/store.js"
    import { atom } from 'nanostores';

    export const isOpen = atom(false);
    ```

3. Import and use the store in a `<script>` tag in the components that will share state.

    The following `Button` and `Dialog` components each use the shared `isOpen` state to control whether a particular `<div>` is hidden or displayed:

    ```astro title="src/components/Button.astro"
    <button id="openDialog">Open</button>

    <script>
      import { isOpen } from "../store.js";

      // Set the store to true when the button is clicked
      function openDialog() {
        isOpen.set(true);
      }

      // Add an event listener to the button
      document.getElementById("openDialog")?.addEventListener("click", openDialog);
    </script>
    ```

    ```astro title="src/components/Dialog.astro"
    <div id="dialog" style="display: none">Hello world!</div>

    <script>
      import { isOpen } from "../store.js";

      const dialog = document.getElementById("dialog");
      // Listen to changes in the store, and show/hide the dialog accordingly
      isOpen.subscribe((open) => {
        if (dialog) {
          if (open) {
            dialog.style.display = "block";
          } else {
            dialog.style.display = "none";
          }
        }
      });
    </script>
    ```
</Steps>

## Resources

- 
- 
