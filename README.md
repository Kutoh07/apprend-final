# Apprend+ : Plateforme Complète d'Excellence Mentale

## 🌟 Vue d'ensemble

**Apprend+** est une application web Next.js sophistiquée dédiée au développement personnel et à l'excellence mentale. Elle propose un parcours structuré et gamifié permettant aux utilisateurs de progresser à travers trois modules principaux : **Personnalisation**, **Programme**, et **Renaissance**.

### Mission
> "L'excellence mentale ancrée de manière durable"

L'application vise à accompagner les utilisateurs dans leur transformation personnelle à travers un parcours scientifiquement structuré, alliant psychologie positive, techniques de mémorisation, et suivi de progression personnalisé.

---

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend**: Next.js 15.3.5 + React 19.1.0 + TypeScript 5.8.3
- **Styling**: TailwindCSS 3.3.0 avec design system personnalisé
- **Base de données**: Supabase (PostgreSQL) avec RLS (Row Level Security)
- **Authentification**: Supabase Auth (OAuth Google + Email/Password)
- **Icons**: Lucide React 0.525.0
- **Performance**: Turbopack pour le développement rapide

### Architecture des Services

```
src/lib/
├── services/                    # Services métier
│   ├── axeSupabaseService.ts     # Gestion des axes Renaissance
│   ├── renaissanceService.ts     # Orchestration Renaissance
│   └── renaissanceSupabaseService.ts # Données Renaissance
├── types/                       # Types TypeScript
│   ├── programme.ts             # Types du programme principal
│   └── renaissance.ts           # Types du module Renaissance
├── utils/                       # Utilitaires
│   ├── flashGameEngine.ts       # Moteur de jeu flash
│   ├── stringComparison.ts      # Comparaison de chaînes
│   ├── sessionManager.ts        # Gestion de session
│   └── performanceUtils.ts      # Optimisation performance
└── hooks/                       # Hooks personnalisés
    ├── useAuth.ts               # Authentification
    ├── useComponentCache.ts     # Cache composants
    ├── usePerformanceTracker.ts # Suivi performance
    └── useSubPartData.ts        # Données sous-parties
```

---

## 📊 Base de Données Supabase

### Tables Principales

#### 🔐 Authentification (Schema `auth`)
- `users`: Utilisateurs avec métadonnées
- `identities`: Identités OAuth/Email
- `sessions`: Sessions utilisateur actives

#### 👤 Profils Utilisateur
```sql
user_profiles {
  id: uuid
  user_id: uuid (FK auth.users)
  name: text
  birth_year: integer
  profession: text
  gender: text
  phone: text
  country: text
  completion_percentage: integer (0-100)
  profile_completeness: jsonb
}
```

#### 📚 Programme Principal
```sql
user_programmes {
  user_id: uuid (PK)
  current_subpart: integer
  overall_progress: integer
  completed_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}

programme_entries {
  id: uuid
  user_id: uuid
  subpart_id: integer (1-8)
  value: text
  word_count: integer (auto-generated)
  validation_status: enum
  created_at: timestamp
}

subpart_progress {
  id: uuid
  user_id: uuid
  subpart_id: integer
  progress_percentage: integer
  is_completed: boolean
  completed_at: timestamp
}
```

#### 🎯 Module Renaissance
```sql
renaissance_axes {
  id: uuid
  name: text
  icon: text
  description: text
  sort_order: integer
  is_active: boolean
  is_customizable: boolean
}

user_renaissance_selection {
  id: uuid
  user_id: uuid
  axe_id: uuid
  custom_name: text
  custom_phrases: jsonb
  selection_order: integer
  is_started: boolean
  is_completed: boolean
}

renaissance_game_sessions {
  id: uuid
  user_id: uuid
  axe_id: uuid
  stage: enum ('discovery', 'level1', 'level2', 'level3')
  flash_duration_ms: integer (500|1500|3000)
  phrases_order: integer[]
  current_phrase_index: integer
  session_accuracy: numeric(5,2)
  is_completed: boolean
}

renaissance_attempts {
  id: uuid
  session_id: uuid
  phrase_id: uuid
  user_input: text
  expected_text: text
  is_correct: boolean
  response_time_ms: integer
  similarity_score: numeric(5,2)
  error_analysis: jsonb
}
```

### 🔍 Vues Optimisées
- `renaissance_dashboard_data`: Statistiques utilisateur compilées
- `active_renaissance_sessions`: Sessions actives en temps réel
- `renaissance_dashboard_summary`: Résumé performance globale

---

## 🎮 Fonctionnalités Détaillées

### 1. 🔐 Système d'Authentification
- **OAuth Google**: Intégration Supabase seamless
- **Email/Password**: Système classique avec validation
- **Gestion de session**: Auto-refresh et persistence localStorage
- **Redirection intelligente**: Basée sur l'état de progression

### 2. 📝 Module Personnalisation
**Localisation**: `src/app/personalisation/`

Étapes du processus :
1. **Welcome Step**: Introduction et motivation
2. **Personal Info Step**: Collecte données personnelles
3. **Success Step**: Validation et next steps

```typescript
interface PersonalInfo {
  name: string;
  birthYear: number;
  profession: string;
  gender?: string;
  phone?: string;
  country?: string;
}
```

### 3. 📚 Programme Principal
**Localisation**: `src/app/programme/`

#### Structure des 8 Modules
1. **Ambitions** (`🎯`) - Définition objectifs
2. **Caractère** (`🚀`) - Traits personnalité
3. **Croyances** (`💭`) - Système de croyances
4. **Émotions** (`❤️`) - Gestion émotionnelle
5. **Environnement** (`🌍`) - Contexte externe
6. **Pensées** (`🧠`) - Patterns de pensée
7. **Travail** (`💼`) - Excellence professionnelle
8. **Rétention** (`🧩`) - Mémorisation et ancrage

#### Logique de Progression
```typescript
// Calcul progression automatique
const calculateProgress = (fields: SubPartField[], minFields: number): number => {
  if (fields.length === 0) return 0;
  if (fields.length >= minFields) return 100;
  return Math.round((fields.length / minFields) * 100);
};

// Déblocage séquentiel
const canAccessSubPart = (subPartId: number, programmeData: ProgrammeData): boolean => {
  if (subPartId === 1) return true; // Premier module toujours accessible
  return programmeData.subParts[subPartId - 2]?.completed || false;
};
```

#### 🔄 Recalcul Automatique
- **Au chargement**: Recalcul complet des progressions
- **Périodique**: Toutes les 30 secondes via `setInterval`
- **Manuel**: Bouton refresh avec feedback utilisateur
- **Performance**: Cache et optimisation des requêtes parallèles

### 4. 🌟 Module Renaissance
**Localisation**: `src/app/renaissance/`

#### Sélection d'Axes (3-6 axes requis)
- **Axes Prédéfinis**: Confiance, Leadership, Créativité, etc.
- **Axe Personnalisé**: Création avec phrases custom
- **Protection Données**: Axes commencés non désélectionnables

#### Gameplay Flash Game
**Algorithme de Mémorisation Espacée**:
```typescript
const FLASH_DURATIONS = {
  discovery: 3000,  // 3 secondes - découverte
  level1: 1500,     // 1.5 secondes - ancrage
  level2: 1000,     // 1 seconde - consolidation  
  level3: 500       // 0.5 seconde - maîtrise
};

interface GameSession {
  stage: 'discovery' | 'level1' | 'level2' | 'level3';
  phrasesOrder: number[];  // Ordre aléatoire optimisé
  currentIndex: number;
  accuracy: number;        // Précision temps réel
  responseTime: number[];  // Temps de réponse par phrase
}
```

#### 🎯 Système de Progression
- **Discovery** (30%): Familiarisation, durée longue
- **Level 1** (23.33%): Première mémorisation
- **Level 2** (23.33%): Consolidation
- **Level 3** (23.34%): Automatisation rapide

#### 📊 Statistiques Avancées
```typescript
interface RenaissanceStats {
  totalAxesSelected: number;
  axesCompleted: number;
  totalProgress: number;        // Moyenne pondérée
  averageAccuracy: number;      // Précision globale
  totalTimeSpent: number;       // Minutes investies
  totalAttempts: number;        // Tentatives totales
  currentStreak: number;        // Jours consécutifs
  lastActivityDate?: Date;
}
```

### 5. 📈 Dashboard Unifié
**Localisation**: `src/app/dashboard/`

#### Métriques Temps Réel
- **Niveaux de Progression**: Personnalisé, Programme, Renaissance, Évolution
- **Skills Dynamiques**: Confiance, Discipline, Action
- **Messages Motivationnels**: Basés sur progression et performance
- **Actions Rapides**: Navigation contextuelle intelligente

#### Calculs de Performance
```typescript
const calculateAverageProgress = (
  programmeData: ProgrammeData,
  renaissanceStats: RenaissanceStats
): number => {
  const weights = { programme: 0.6, renaissance: 0.4 };
  return Math.round(
    (programmeData.overallProgress * weights.programme) +
    (renaissanceStats.totalProgress * weights.renaissance)
  );
};
```

---

## 🔧 Optimisations et Performance

### Cache Intelligent
```typescript
// Cache composants avec TTL
const useComponentCache = <T>(key: string, ttl: number = 300000) => {
  // 5 minutes par défaut
  const getCached = (): T | null => { /* ... */ };
  const setCached = (data: T): void => { /* ... */ };
  const invalidate = (): void => { /* ... */ };
};

// Cache base de données avec invalidation
const programmeCache = new Map<string, ProgrammeData>();
const setCachedProgramme = (userId: string, data: ProgrammeData) => {
  programmeCache.set(`programme_${userId}`, {
    ...data,
    _cached_at: new Date()
  });
};
```

### Requêtes Optimisées
```typescript
// Requêtes parallèles pour performance maximale
const [programmeResult, entriesResult, progressResult] = await Promise.all([
  supabase.from('user_programmes').select('*').eq('user_id', userId).single(),
  supabase.from('programme_entries').select('*').eq('user_id', userId),
  supabase.from('subpart_progress').select('*').eq('user_id', userId)
]);
```

### Gestion d'Erreurs Robuste
```typescript
// Fallback gracieux avec retry automatique
const getUserStats = async (userId: string): Promise<RenaissanceStats> => {
  try {
    // Tentative cache avancé
    const cached = await getCachedStats(userId);
    if (cached) return cached;
    
    // Calcul temps réel avec fallback
    return await calculateStatsRealtime(userId);
  } catch (error) {
    console.warn('Cache indisponible, calcul direct:', error);
    return await getUserStatsLegacy(userId);
  }
};
```

---

## 🎨 Design System

### Palette de Couleurs
```css
/* Gradients principaux */
.gradient-primary { @apply bg-gradient-to-r from-pink-500 to-purple-500; }
.gradient-secondary { @apply bg-gradient-to-r from-teal-400 to-blue-500; }
.gradient-success { @apply bg-gradient-to-r from-green-400 to-green-600; }

/* États de progression */
.progress-bar { @apply bg-gray-200 rounded-full overflow-hidden; }
.progress-fill { @apply h-full bg-gradient-to-r transition-all duration-1000; }
.progress-shimmer { @apply absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse; }
```

### Composants Réutilisables
- **LoadingSpinner**: États de chargement avec animations CSS
- **ProgressBar**: Barres de progression avec effets visuels
- **Modal**: Système modal responsive avec gestion focus
- **Button**: Boutons avec états hover, disabled, loading
- **Input**: Champs avec validation et feedback utilisateur

### Animations et Transitions
```css
/* Animations personnalisées */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* Classes utilitaires */
.animate-shimmer { animation: shimmer 2s infinite; }
.hover-lift { @apply transform transition-all duration-200 hover:scale-105 hover:shadow-xl; }
```

---

## 🚀 Processus de Déploiement

### Variables d'Environnement
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration  
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_ENVIRONMENT=production
```

### Scripts de Build
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "build-css": "tailwindcss -o ./src/app/globals.css --watch"
  }
}
```

### Configuration Vercel
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
```

---

## 🔍 Monitoring et Analytics

### Tracking de Performance
```typescript
const usePerformanceTracker = () => {
  const trackUserAction = (action: string, data?: any) => {
    const timestamp = performance.now();
    console.log(`[PERF] ${action}:`, {
      timestamp,
      duration: timestamp - pageLoadTime,
      data
    });
  };
  
  return { trackUserAction };
};
```

### Métriques Suivies
- **Temps de chargement** par page et composant
- **Taux de completion** par module et sous-partie
- **Accuracy moyenne** dans les jeux Renaissance
- **Temps de session** et patterns d'usage
- **Erreurs techniques** avec stack traces

---

## 🛠️ Guide de Développement

### Installation Locale
```bash
# Clone du repository
git clone https://github.com/user/apprend-final.git
cd apprend-final

# Installation dépendances
npm install

# Configuration Supabase
cp .env.local.example .env.local
# Renseigner les variables SUPABASE

# Démarrage serveur de développement
npm run dev
```

### Structure des Commits
```
feat(module): ajout nouvelle fonctionnalité
fix(bug): correction erreur critique
perf(cache): optimisation système de cache
style(ui): amélioration interface utilisateur
docs(readme): mise à jour documentation
```

### Tests et Validation
```bash
# Validation TypeScript
npm run build

# Linting
npm run lint

# Tests unitaires (à implémenter)
npm run test
```

---

## 🔮 Évolutions Prévues

### Court Terme
- [ ] **Tests automatisés** (Jest + Testing Library)
- [ ] **Analytics avancées** (Mixpanel/Amplitude)
- [ ] **PWA Support** pour usage mobile offline
- [ ] **Notifications push** pour rappels et motivation

### Moyen Terme  
- [ ] **IA Personnalisation** (recommandations adaptatives)
- [ ] **Communauté sociale** (partage progrès, défis)
- [ ] **Coaching virtuel** (chatbot intelligence contextuelle)
- [ ] **API publique** pour intégrations tierces

### Long Terme
- [ ] **Application mobile** native (React Native)
- [ ] **Réalité virtuelle** pour immersion Renaissance
- [ ] **Blockchain rewards** (tokens motivation)
- [ ] **Marketplace coaching** (coachs certifiés)

---

## 👥 Contribution

### Guidelines
1. **Fork** le repository
2. **Créer branche** feature/nom-fonctionnalité
3. **Développer** avec tests et documentation
4. **Pull Request** avec description détaillée
5. **Review** par mainteneurs avant merge

### Standards Code
- **TypeScript strict** avec types explicites
- **ESLint + Prettier** pour cohérence style
- **Composants fonctionnels** avec hooks
- **Documentation** JSDoc pour fonctions publiques

---

## 📞 Support et Contact

### Développeur Principal
**Hermanno Kutoh**  
📧 Email: bhermanno@yahoo.fr  
🐙 GitHub: @Kutoh07  

### Resources Techniques
- 📚 [Documentation Supabase](https://supabase.com/docs)
- ⚛️ [Next.js Documentation](https://nextjs.org/docs)
- 🎨 [TailwindCSS Reference](https://tailwindcss.com/docs)

---

## 📄 Licence

Ce projet est sous licence propriétaire. Tous droits réservés.

**© 2024 Apprend+ - L'excellence mentale ancrée de manière durable**

---

*Ce README détaille l'architecture complète et les fonctionnalités de la plateforme Apprend+. Pour toute question technique ou contribution, n'hésitez pas à contacter l'équipe de développement.*
