import type { ComponentType } from 'react';

export interface UserProgress {
  level: number;
  skills: {
    confiance: number;
    discipline: number;
    action: number;
  };
}

export interface User {
  email: string;
  name: string;
  progress: UserProgress;
  createdAt?: string;
}

export interface Level {
  name: string;
  color: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  progress: number;
  description: string;
  isClickable?: boolean;
}

export interface Skill {
  name: string;
  value: number;
  color: string;
  description: string;
  icon: string;
}

export interface ProgressMessage {
  range: string;
  message: string;
  emoji: string;
  bgColor: string;
  textColor: string;
}

export interface ActionCard {
  title: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  onClick: () => void;
}
