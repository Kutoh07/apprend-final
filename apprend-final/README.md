# Apprend+ Web Application

Apprend+ is a self-development platform built with **Next.js** and **Supabase**. The app allows users to register, personalize their profile and follow a step-by-step programme designed to improve mental excellence.

## Features

- **User Authentication** powered by Supabase with Google, Apple and email/password providers.
- **Personalisation Flow** to collect basic profile information (name, birth year, profession, etc.).
- **Progressive Programme** composed of multiple parts (Ambitions, Caractère, Croyances, Émotions, Pensées, Travail, Environnement, Rétention) with local progress tracking.
- **Dashboard** displaying current level and skill progression.
- Built with **React 19**, **TypeScript**, **Tailwind CSS** and the latest **Next.js** app router.

## Project Structure

```
src/
  app/          Next.js routes and pages
  components/   Shared UI components
  hooks/        Custom React hooks (e.g. `useAuth`)
  lib/          Supabase client and domain services
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file at the project root and provide your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts


### Supabase Schema
The project expects two tables: `user_programmes` and `programme_entries`.
Run the SQL in `supabase/schema.sql` on your Supabase instance to create them.

- `npm run dev` – start the dev server with Turbopack
- `npm run build` – create an optimized production build
- `npm start` – run the built app
- `npm run lint` – run ESLint

## Deployment

The app can be deployed to any platform that supports Node.js. When using **Vercel**, simply set the environment variables above in the project settings and push the repository.

---

Made with ❤️ for personal growth.
