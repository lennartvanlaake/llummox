---
title: Deploy your Astro Site with CloudRay
description: How to deploy your Astro site to your Ubuntu Server using CloudRay
sidebar:
  label: CloudRay
type: deploy
logo: cloudray
supports: ['static']
i18nReady: true
---

You can deploy your Astro project using , a centralized platform that helps you manage your servers, organize Bash scripts, and automate deployment tasks across virtual machines and cloud servers.

:::note
CloudRay itself does not host your site. Instead, it provides automation tools to run deployment scripts on your own infrastructure (e.g., Ubuntu servers) using a connected agent.
:::

## Prerequisites 

To get started, you will need:

- A 
- Your app code stored in a  repository

## How to Deploy through CloudRay Dashboard

Deploying with CloudRay typically involves three main steps:

<Steps>
1. Install the  on your server to securely register your machine and enable remote automation.

2. In your CloudRay Dashboard, write a reusable Bash script that clones your Astro repo, installs dependencies, builds your site, and configures a web server. Define any repo-specific values using .

3. Use CloudRay’s Runlog interface to execute your script on your connected server and monitor the deployment in real time.
</Steps>

## Official Resources

Check out .
