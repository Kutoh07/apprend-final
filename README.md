# Apprend-Final

Apprend-Final est une application web interactive de développement personnel, construite avec Next.js, TypeScript, React, Supabase et TailwindCSS. Elle propose un parcours personnalisé autour de la "Renaissance" (axes, jeux, progression, etc.), avec authentification, sauvegarde des progrès, et une interface moderne.

## Sommaire
- [Fonctionnalités](#fonctionnalités)
- [Architecture du projet](#architecture-du-projet)
- [Installation et démarrage](#installation-et-démarrage)
- [Configuration Supabase](#configuration-supabase)
- [Tests](#tests)
- [Scripts npm](#scripts-npm)
- [Structure des dossiers](#structure-des-dossiers)
- [Déploiement](#déploiement)
- [Contribuer](#contribuer)
- [Auteurs](#auteurs)

---

## Fonctionnalités
- Authentification sécurisée (Supabase)
- Parcours Renaissance : axes, jeux de découverte, encrage, progression
- Dashboard personnalisé avec statistiques
- Système de sauvegarde des progrès utilisateur (RLS Supabase)
- Navigation fluide (App Router Next.js)
- UI responsive et moderne (TailwindCSS)
- Tests unitaires et d’intégration (Jest, Testing Library)

## Architecture du projet
- **Next.js 15** (App Router, SSR, API routes)
- **TypeScript** (typages stricts)
- **Supabase** (auth, base de données, RLS)
- **React 19** (hooks, composants fonctionnels)
- **TailwindCSS** (design)

## Installation et démarrage

### Prérequis
- Node.js >= 18
- npm >= 9
- Compte Supabase (https://supabase.com)

### 1. Cloner le repo
```bash
git clone https://github.com/Kutoh07/apprend-final.git
cd apprend-final
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d’environnement
Crée un fichier `.env.local` à la racine :
```
NEXT_PUBLIC_SUPABASE_URL=... (URL de ton projet Supabase)
NEXT_PUBLIC_SUPABASE_ANON_KEY=... (clé anonyme Supabase)
```

### 4. Lancer en développement
```bash
npm run dev
```

### 5. Build et production
```bash
npm run build
npm start
```

## Configuration Supabase
1. **Créer le projet sur https://supabase.com**
2. **Importer le schéma**
   - Utilise le fichier `supabase/schema.sql` pour créer les tables nécessaires.
3. **Configurer les RLS (Row Level Security)**
   - Active RLS sur les tables sensibles (`user_renaissance_progress`, etc.)
   - Ajoute les policies recommandées (voir `supabase/tables_schema.json`)
4. **Renseigne les variables d’environnement dans `.env.local`**

## Tests
- **Lancer tous les tests** :
  ```bash
  npm test
  ```
- Les tests sont dans `__tests__/`, `tests/` ou à côté des modules (`*.test.ts[x]`).
- Utilise Jest et Testing Library pour les composants React.

## Scripts npm
- `npm run dev` : Démarre le serveur Next.js en mode développement
- `npm run build` : Build de production
- `npm start` : Démarre le serveur en mode production
- `npm run lint` : Lint du code
- `npm run build-css` : Génère le CSS Tailwind

## Structure des dossiers
```
apprend-final/
├── public/                # Images, icônes, assets statiques
├── src/
│   ├── app/               # Pages Next.js (App Router)
│   │   ├── dashboard/     # Dashboard utilisateur
│   │   ├── renaissance/   # Module Renaissance (axes, jeux, progression)
│   │   ├── programme/     # Parcours programme
│   │   └── ...
│   ├── components/        # Composants globaux (UI, navigation, etc.)
│   ├── hooks/             # Hooks personnalisés
│   ├── lib/               # Fonctions utilitaires, services Supabase, types
│   └── ...
├── supabase/              # Schéma SQL, policies, etc.
├── tests/                 # (optionnel) Tests globaux
├── package.json           # Dépendances et scripts
└── README.md              # Ce fichier
```

## Déploiement
- **Vercel** (recommandé) : Connecte le repo, configure les variables d’environnement, déploie automatiquement.
- **Autre hébergeur** : Build puis lance `npm start` sur le serveur.

## Contribuer
1. Fork le repo
2. Crée une branche (`git checkout -b feature/ma-feature`)
3. Commit et push
4. Ouvre une Pull Request

## Auteurs
- [Kutoh07](https://github.com/Kutoh07)
- Contributions bienvenues !

---

**Contact** : Pour toute question, ouvre une issue sur GitHub ou contacte l’auteur.
