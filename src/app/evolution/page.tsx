// src/app/evolution/page.tsx

import React from 'react';
import { ModernLayout } from '@/components/layout/ModernLayout';
//import EvolutionDashboard from '@/components/evolution/EvolutionDashboard';
import SimpleEvolutionDashboard from '@/components/evolution/SimpleEvolutionDashboard';

export default function EvolutionPage() {
  return (
    <ModernLayout
      title="Évolution & Progression 🏆"
      description="Suivez votre progression, découvrez vos réussites et restez motivé dans votre parcours de développement personnel."
    >
      <SimpleEvolutionDashboard />
    </ModernLayout>
  );
}
