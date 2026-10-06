---
title: Deploy your Astro Site to Microsoft Azure
description: How to deploy your Astro site to the web using Microsoft Azure.
sidebar:
  label: Microsoft Azure
type: deploy
logo: microsoft-azure
supports: ['static']
i18nReady: true
---

 is a cloud platform from Microsoft. You can deploy your Astro site with Microsoft Azure’s  service.

This guide takes you through deploying your Astro site stored in GitHub using Visual Studio Code. Please see Microsoft guides for using an  for other setups.

## Prerequisites

To follow this guide, you will need:

- An Azure account and a subscription key. You can create a .
- Your app code pushed to .
- The  in .

## How to deploy

<Steps>
1. Open your project in VS Code.

2. Open the Static Web Apps extension, sign in to Azure, and click the **+** button to create a new Static Web App. You will be prompted to designate which subscription key to use.

3. Follow the wizard started by the extension to give your app a name, choose a framework preset, and designate the app root (usually `/`) and built file location (use `/dist`). Astro is not listed in the built-in templates in Azure so you will need to select `custom`. The wizard will run and will create a  in the `.github` folder of your repo. (This folder will be automatically created if it does not already exist.) 
</Steps>

The GitHub Action will deploy your app (you can see its progress in your repo’s Actions tab on GitHub). When successfully completed, you can view your app at the address shown in the SWA Extension’s progress window by clicking the **Browse Website** button (this will appear after the GitHub Action has run).

## Known Issues

The GitHub action yaml that is created for you assumes the use of node 14. This means the Astro build fails. To resolve this update your projects package.json file with this snippet.

```
  "engines": {
    "node": ">=22.12.0"
  },
```

## Official Resources

- 

## Community Resources 

- 
- 
- 
