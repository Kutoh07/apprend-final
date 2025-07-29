// src/lib/types/retention.ts

export interface RetentionValidationStep {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  actionText: string;
  icon: string;
  color: string;
  gradient: string;
  completed: boolean;
  current: boolean;
  locked: boolean;
}

export interface RetentionValidationState {
  id: string;
  userId: string;
  currentStep: number;
  completedSteps: number[];
  stepTimestamps: {
    step1?: string;
    step2?: string;
    step3?: string;
    step4?: string;
    step5?: string;
    step6?: string;
  };
  isCompleted: boolean;
  completedAt?: string;
  startedAt: string;
  updatedAt: string;
}

export interface StepperNavigationProps {
  steps: RetentionValidationStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  className?: string;
}

export interface StepContentProps {
  step: RetentionValidationStep;
  onNext: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  className?: string;
}

export interface RetentionStepperProps {
  userId: string;
  onComplete: () => void;
  className?: string;
}

// Configuration des étapes
export const RETENTION_STEPS_CONFIG: Omit<RetentionValidationStep, 'completed' | 'current' | 'locked'>[] = [
  {
    id: 1,
    title: "🎉 Félicitations !",
    subtitle: "Tu as accompli quelque chose d'extraordinaire",
    content: `Bravo ! Tu viens de franchir une étape majeure de ta transformation personnelle. 
    Ton engagement et ta persévérance dans ce programme témoignent de ta détermination à devenir 
    la femme que tu aspires à être. Cette réussite n'est que le début d'un voyage encore plus beau.`,
    actionText: "Découvrir la suite",
    icon: "🏆",
    color: "from-yellow-400 to-orange-500",
    gradient: "bg-gradient-to-r from-yellow-400 to-orange-500"
  },
  {
    id: 2,
    title: "🚀 C'est quoi la suite ?",
    subtitle: "Ta transformation entre dans une nouvelle phase",
    content: `Tu vas maintenant passer à l'étape de Renaissance ! Cette phase cruciale va t'aider à 
    ancrer durablement tout ce que tu as appris et construit. Plus qu'un simple programme, 
    c'est un processus de transformation profonde qui va faire de tes nouvelles habitudes 
    ta nouvelle identité naturelle.`,
    actionText: "Comprendre l'objectif",
    icon: "🌟",
    color: "from-blue-500 to-indigo-600",
    gradient: "bg-gradient-to-r from-blue-500 to-indigo-600"
  },
  {
    id: 3,
    title: "Objectif du module Renaissance",
    subtitle: "Ancrer ta transformation pour qu'elle devienne ta nouvelle norme",
    content: `L'objectif est d'ancrer en profondeur ce que tu as appris et construit, pour que ta 
    transformation devienne ta nouvelle norme. Tu n'auras plus besoin de te "motiver" pour être 
    la femme que tu es devenue : c'est intégré, incarné et durable. Cette phase va consolider 
    ton nouveau fonctionnement mental de manière permanente.`,
    actionText: "Découvrir pourquoi c'est crucial",
    icon: "🎯",
    color: "from-purple-500 to-pink-600",
    gradient: "bg-gradient-to-r from-purple-500 to-pink-600"
  },
  {
    id: 4,
    title: "💡 Pourquoi est-ce crucial ?",
    subtitle: "Les 4 piliers de l'ancrage durable",
    content: `
    • **Le vrai changement vient de la régularité maîtrisée**, pas de l'intensité ponctuelle
    • **Tu as fait un travail immense** et il mérite d'être consolidé
    • **Il s'agit maintenant de consolider** ton nouveau fonctionnement mental grâce aux neurosciences
    • **Pour garder et incarner** ce que tu as construit, tu dois apprendre à le faire vivre dans le temps
    `,
    actionText: "Voir les résultats attendus",
    icon: "⚡",
    color: "from-green-500 to-teal-600",
    gradient: "bg-gradient-to-r from-green-500 to-teal-600"
  },
  {
    id: 5,
    title: "🏅 Les résultats recherchés",
    subtitle: "Être capable de :",
    content: `
    • **Consolider durablement** ta nouvelle identité mentale
    • **Intégrer la méthode** dans ton quotidien sans charge mentale
    • **Faire vivre et grandir** ta transformation de manière autonome
    
    Tu deviendras la femme qui atteint naturellement ses objectifs, sans effort conscient.`,
    actionText: "Découvrir la méthode",
    icon: "🌈",
    color: "from-rose-500 to-red-600",
    gradient: "bg-gradient-to-r from-rose-500 to-red-600"
  },
  {
    id: 6,
    title: "🛠️ Comment se déroule le module",
    subtitle: "La technique d'ancrage multisensoriel",
    content: `
    **La technique :** Ancrage actif multisensoriel utilisant le maximum de sens pour ancrer dans ta mémoire long terme chaque transformation.
    
    **Comment la mettre en place :**
    • **Se préparer** avec des fournitures aux couleurs, design et textures qui t'inspirent
    • **Engager tous tes sens** : vue, ouïe, odorat, toucher
    • **Créer des associations positives** avec tes souvenirs d'enfance favoris
    
    **Résultat :** Une intégration profonde et durable de ta nouvelle identité.`,
    actionText: "Commencer la Renaissance",
    icon: "✨",
    color: "from-indigo-500 to-purple-600",
    gradient: "bg-gradient-to-r from-indigo-500 to-purple-600"
  }
];
