---
title: Editor setup
description: Set up your code editor to build with Astro.
i18nReady: true
---



<ReadMore>See how to  in your Astro project.</ReadMore>

## Zed

 is a high-performance, multiplayer code editor that is optimized for speed and large projects. Their  includes features like syntax highlighting for `.astro` files, code completion, formatting, diagnostics, and go-to-definition.

## JetBrains IDEs

 is a JavaScript and TypeScript IDE that added support for the Astro Language Server in version 2024.2. This update brings features like syntax highlighting, code completion, and formatting.

Install the official plugin through  or by searching for "Astro" in the IDE's Plugins tab. You can toggle the language server in `Settings | Languages & Frameworks | TypeScript | Astro`.

For more information on Astro support in Webstorm, check out .

## Other Code Editors

Our amazing community maintains several extensions for other popular editors, including:

-  <span style="margin: 0.25em;"><Badge text="Official" /></span> - The official Astro VS Code Extension, available on the Open VSX registry for editors like  or .
-  <span style="margin: 0.25em;"><Badge class="neutral-badge" text="Community" /></span> - Provides syntax highlighting, indentation, and code folding support for Astro inside of Vim or Neovim
- Neovim  and  Plugins <span style="margin: 0.25em;"><Badge class="neutral-badge" text="Community" /></span> - Provides syntax highlighting, treesitter parsing, and code completion for Astro inside of Neovim
- Emacs - See instructions for  <span style="margin: 0.25em;"><Badge class="neutral-badge" text="Community" /></span> to work with Astro
-  <span style="margin: 0.25em;"><Badge class="neutral-badge" text="Community" /></span> - The Astro package for Sublime Text, available on the Sublime Text package manager.
-  <span style="margin: 0.25em;"><Badge class="neutral-badge" text="Community" /></span> - Provides syntax highlighting and code completion for Astro inside of Nova

## In-Browser Editors

In addition to local editors, Astro also runs well on in-browser hosted editors, including:

-  and  - online editors that run in your browser, with built-in syntax highlighting support for `.astro` files. No installation or configuration required!
-  - allows you to install the Astro VS Code extension as a , which gives you access to only some of the full extension features. Currently, only syntax highlighting is supported.

## Other tools

### ESLint

 is a popular linter for JavaScript and JSX. For Astro support,  can be installed.

See  for more information on how to install and set up ESLint for your project.

### Stylelint

 is a popular linter for CSS.  provides Astro support.

Installation instructions, editor integration, and additional information can be found in the project's README.

### Biome

 is an all-in-one linter and formatter for the web. , and can be used to lint and format the frontmatter in `.astro` files.

### Prettier

 is a popular formatter for JavaScript, HTML, CSS, and more. If you're using the , code formatting with Prettier is included.

To add support for formatting `.astro` files outside of the editor (e.g. CLI) or inside editors that don't support our editor tooling, install .

<Steps>
1. Install `prettier` and `prettier-plugin-astro`.

    <PackageManagerTabs>
      <Fragment slot="npm">
      ```shell
      npm install --save-dev --save-exact prettier prettier-plugin-astro
      ```
      </Fragment>
      <Fragment slot="pnpm">
      ```shell
      pnpm add --save-dev --save-exact prettier prettier-plugin-astro
      ```
      </Fragment>
      <Fragment slot="yarn">
      ```shell
      yarn add --dev --exact prettier prettier-plugin-astro
      ```
      </Fragment>
    </PackageManagerTabs>

2. Create a `.prettierrc` configuration file (or `.prettierrc.json`, `.prettierrc.mjs`, or ) in the root of your project and add `prettier-plugin-astro` to it.

    In this file, also manually specify the parser for Astro files.

    ```json title=".prettierrc"
    {
      "plugins": ["prettier-plugin-astro"],
      "overrides": [
        {
          "files": "*.astro",
          "options": {
            "parser": "astro"
          }
        }
      ]
    }
    ```

3. Optionally, install other Prettier plugins for your project, and add them to the configuration file. These additional plugins may need to be listed in a specific order. For example, if you use Tailwind, `prettier-plugin-tailwindcss` must be .

    ```json title=".prettierrc"
    {
      "plugins": [
        "prettier-plugin-astro",
        "prettier-plugin-tailwindcss" // needs to be last
      ],
      "overrides": [
        {
          "files": "*.astro",
          "options": {
            "parser": "astro"
          }
        }
      ]
    }
    ```

4. Run the following command in your terminal to format your files.

    <PackageManagerTabs>
      <Fragment slot="npm">
      ```shell
      npx prettier . --write
      ```
      </Fragment>
      <Fragment slot="pnpm">
      ```shell
      pnpm exec prettier . --write
      ```
      </Fragment>
      <Fragment slot="yarn">
      ```shell
      yarn exec prettier . --write
      ```
      </Fragment>
    </PackageManagerTabs>
</Steps>

See the  for more information about its supported options, how to set up Prettier inside VS Code, and more.

### dprint

 is a highly-configurable code formatter that supports many languages, including JavaScript, TypeScript, CSS, and more. Support for `.astro` files can be added using the .
