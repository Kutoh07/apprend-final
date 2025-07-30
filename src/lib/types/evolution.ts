// src/lib/types/evolution.ts

export interface ProgressStats {
  overall: {
    completionPercentage: number;
    totalSubPartsCompleted: number;
    totalSubParts: number;
    dailyProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
  };
  programme: {
    subPartProgress: SubPartProgressData[];
    totalEntries: number;
    totalWords: number;
    timeSpentByModule: ModuleTimeData[];
  };
  renaissance: {
    averageAccuracy: number;
    progressByAxis: AxisProgressData[];
    currentStreak: number;
    totalTimePlayed: number;
  };
}

export interface SubPartProgressData {
  id: number;
  name: string;
  icon: string;
  color: string;
  progress: number;
  entriesCount: number;
  wordsCount: number;
  timeSpent: number; // en minutes
}

export interface ModuleTimeData {
  moduleId: number;
  moduleName: string;
  timeSpent: number; // en minutes
  lastActivity: string;
}

export interface AxisProgressData {
  axisId: string;
  axisName: string;
  progress: number;
  accuracy: number;
  timePlayed: number;
  levelsCompleted: number;
}

export interface MotivationStats {
  proximityToGoal: {
    remainingSubParts: number;
    remainingPercentage: number;
    estimatedTimeToComplete: number;
  };
  achievements: Achievement[];
  improvements: {
    accuracyImprovement: number;
    speedImprovement: number;
    consistencyScore: number;
  };
  streaks: {
    currentStreak: number;
    longestStreak: number;
    weeklyGoalProgress: number;
  };
  totalTimeInvested: number; // en minutes
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
  type: 'streak' | 'completion' | 'milestone' | 'time_based' | 'special';
  rarity: 1 | 2 | 3 | 4 | 5; // Nombre d'étoiles
  requirement?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface HeatmapData {
  date: string;
  activity: number;
  level: 0 | 1 | 2 | 3 | 4; // Niveau d'activité pour la couleur
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
    label: string;
  };
  color?: string;
  animated?: boolean;
}

export interface ProgressChartProps {
  data: TimeSeriesData[];
  title: string;
  height?: number;
  type?: 'line' | 'area';
  showGrid?: boolean;
}

export interface EvolutionData {
  progressStats: ProgressStats;
  motivationStats: MotivationStats;
  timeSeriesData: {
    daily: TimeSeriesData[];
    weekly: TimeSeriesData[];
    monthly: TimeSeriesData[];
  };
  heatmapData: HeatmapData[];
  lastUpdated: string;
}

// Types pour les composants de visualisation
export interface ChartConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    gradient: string[];
  };
  animations: {
    duration: number;
    delay: number;
    easing: string;
  };
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color?: string;
  animated?: boolean;
}
