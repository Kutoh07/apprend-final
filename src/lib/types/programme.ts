// app/lib/types/programme.ts

export interface SubPartField {
  id: string;
  value: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SubPart {
  id: number;
  slug: string;
  name: string;
  icon: string;
  color: string;
  fields: SubPartField[];
  completed: boolean;
  progress: number;
  description: string;
  placeholder?: string;
  minFields?: number;
  maxFields?: number;
}

export interface ProgrammeData {
  userId: string;
  subParts: SubPart[];
  currentSubPart: number;
  overallProgress: number;
  lastUpdated: Date;
  completedAt?: Date;
}

export const SUBPARTS_CONFIG: Omit<SubPart, 'fields' | 'completed' | 'progress'>[] = [
  {
    id: 1,
    slug: 'ambitions',
    name: 'AMBITIONS',
    icon: '🎯',
    color: 'from-pink-400 to-pink-600',
    description: 'Quel est ton objectif le plus ambitieux ?',
    placeholder: 'Décris ton ambition ici...',
    minFields: 1,
    maxFields: 5
  },
  {
    id: 2,
    slug: 'caractere',
    name: 'CARACTÈRE',
    icon: '🚀',
    color: 'from-purple-400 to-purple-600',
    description: "Copie et colle ta projection magique et ton personnage 2.0",
    placeholder: 'Une entrée pour ta projection magique et un entrée pour ton personnage 2.0',
    minFields: 2,
    maxFields: 2
  },
  {
    id: 3,
    slug: 'croyances',
    name: 'CROYANCES',
    icon: '📣',
    color: 'from-orange-400 to-orange-600',
    description: 'Quels sont tes croyances reformulées à l\'image de tes ambitions ?',
    placeholder: 'Mes nouvelles croyances - Une entrée par croyance',
    minFields: 3,
    maxFields: 10
  },
  {
    id: 4,
    slug: 'emotions',
    name: 'ÉMOTIONS',
    icon: '🔥',
    color: 'from-red-400 to-red-600',
    description: 'Copie et colle le bilan de ton scan émotionnel avec A.I.R.E',
    placeholder: 'Résultat du scan A.I.R.E...',
    minFields: 1,
    maxFields: 10
  },
  {
    id: 5,
    slug: 'pensees',
    name: 'PENSÉES',
    icon: '💭',
    color: 'from-gray-400 to-gray-600',
    description: 'Tes pensées positives',
    placeholder: 'Une pensée positive...',
    minFields: 5,
    maxFields: 10
  },
  {
    id: 6,
    slug: 'travail',
    name: 'TRAVAIL',
    icon: '📅',
    color: 'from-blue-400 to-blue-600',
    description: 'Quelles sont les grandes étapes de ton projet ?',
    placeholder: 'Une entrée par étape de ton projet',
    minFields: 5,
    maxFields: 10
  },
  {
    id: 7,
    slug: 'environnement',
    name: 'ENVIRONNEMENT',
    icon: '🌍',
    color: 'from-green-400 to-green-600',
    description: 'Quels sont les grands changements opérés ou à opérer (environnement humain, matériel et digital)',
    placeholder: ' Une entrée pour chacun des environnement (humain, matériel, digital)',
    minFields: 3,
    maxFields: 10
  },
  {
    id: 8,
    slug: 'retention',
    name: 'RÉTENTION',
    icon: '💡',
    color: 'from-yellow-400 to-yellow-600',
    description: 'Une nouvelle ère de transformation personnelle',
    placeholder: 'Ma transformation...',
    minFields: 1,
    maxFields: 1
  }
];