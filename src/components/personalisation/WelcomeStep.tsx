// src/components/personalisation/WelcomeStep.tsx

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface WelcomeStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function WelcomeStep({ onNext, onBack }: WelcomeStepProps) {

  const router = useRouter();
  const handleBack = () => {
    // Rediriger vers le dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8">
        
        {/* Titre */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-sky-400 mb-8 tracking-wide">
            PERSONALISATION
          </h1>
        </div>

        {/* Contenu principal */}
        <div className="flex items-center justify-between">
          
          {/* Texte explicatif */}
          <div className="flex-1 pr-8">
            <p className="text-xl text-gray-700 leading-relaxed">
              Ton programme de renaissance est sur mesure. Pour cela, il est essentiel que nous 
              apprenions à mieux nous connaître.
            </p>
          </div>

          {/* Image de personnalisation */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <Image
                src="/images/Personalisation.png"
                alt="Illustration de personnalisation"
                width={400}
                height={300}
                className="rounded-2xl shadow-lg object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-between items-center mt-16">
          <button 
            onClick={handleBack}
            className="bg-sky-300 hover:bg-sky-400 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Retour
          </button>
          
          <button 
            onClick={onNext}
            className="bg-sky-400 hover:bg-sky-500 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Commencer
          </button>
        </div>
      </div>
    </div>
  );
}