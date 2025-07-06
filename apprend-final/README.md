diff --git a/README.md b/README.md
index e215bc4ccf138bbc38ad58ad57e92135484b3c0f..a6685d3b78c783d05bbadd2cd62860c26006aa95 100644
--- a/README.md
+++ b/README.md
@@ -1,36 +1,124 @@
-This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
+# Apprend Webapp
 
-## Getting Started
+A minimal web application boilerplate built with [Next.js](https://nextjs.org/), TypeScript and [Tailwind CSS](https://tailwindcss.com/).
+This project uses the Next.js App Router and demonstrates how to include Google fonts with `next/font`.
 
-First, run the development server:
+## Table of Contents
+- [Features](#features)
+- [Project Structure](#project-structure)
+- [Configuration](#configuration)
+- [Prerequisites](#prerequisites)
+- [Installation](#installation)
+- [Development](#development)
+- [Available Scripts](#available-scripts)
+- [Building for Production](#building-for-production)
+- [Customization](#customization)
+- [Deployment](#deployment)
+- [Contributing](#contributing)
+- [License](#license)
+
+## Features
+
+- **Next.js 15** with the App Router directory structure
+- **React 19** and **TypeScript** out of the box
+- **Tailwind CSS 4** configured through PostCSS
+- Light and dark themes via CSS variables in `app/globals.css`
+- Custom fonts provided by Vercel's Geist family
+- Static assets served from the `public/` directory
+
+## Project Structure
+
+```
+.
+├── app/                # Application pages and layout
+│   ├── globals.css     # Global styles and Tailwind directives
+│   ├── layout.tsx      # Root layout
+│   └── page.tsx        # Example home page
+├── public/             # Static files
+├── next.config.ts      # Next.js configuration
+├── postcss.config.mjs  # PostCSS/Tailwind configuration
+└── tsconfig.json       # TypeScript options
+```
+
+## Configuration
+
+Key configuration files and directories:
+
+- `next.config.ts` – customize Next.js options.
+- `postcss.config.mjs` – integrate Tailwind CSS via PostCSS.
+- `app/layout.tsx` – registers Google fonts using `next/font`.
+- `app/globals.css` – defines theme variables and global styles.
+
+## Prerequisites
+
+- [Node.js](https://nodejs.org/) (version 18 or higher)
+- [npm](https://www.npmjs.com/) installed with Node
+
+## Installation
+
+Install the dependencies once you have cloned the repository:
+
+```bash
+npm install
+```
+
+## Development
+
+Run the development server with hot reloading:
 
 ```bash
 npm run dev
-# or
-yarn dev
-# or
-pnpm dev
-# or
-bun dev
 ```
 
-Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
+Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.
+Changes to files inside `app/` will automatically refresh the page.
+
+## Available Scripts
+
+The following npm scripts are available:
+
+- `npm run dev` – start the development server.
+- `npm run build` – build the application for production.
+- `npm run start` – run the production server locally.
+- `npm run lint` – check and fix code style issues.
+
+## Building for Production
+
+Create an optimized production build:
+
+```bash
+npm run build
+```
 
-You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
+Start the production server locally:
+
+```bash
+npm run start
+```
+
+## Linting
+
+Check the codebase with ESLint:
+
+```bash
+npm run lint
+```
 
-This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
+## Customization
 
-## Learn More
+- Edit `app/page.tsx` or add files in `app/` to create new routes.
+- Update styles or theme variables in `app/globals.css`.
+- Add images and other static files to the `public/` directory and reference them with `/filename.ext`.
 
-To learn more about Next.js, take a look at the following resources:
+## Deployment
 
-- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
+This project can be deployed to any Node.js hosting provider. The easiest approach is to use [Vercel](https://vercel.com/) which offers zero-configuration Next.js hosting.
+For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
 
-You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
+## Contributing
 
-## Deploy on Vercel
+Bug reports and pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
 
-The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
+## License
 
-Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
+This project does not currently include a license file.
