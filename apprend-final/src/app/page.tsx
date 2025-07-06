'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();

  const handleCommencer = () => {
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Logo et titre */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-teal-500 mb-2">
            APPREND<span className="text-2xl">+</span>
          </h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Bienvenue sur APPREND !
          </h2>
        </div>

        {/* Image du personnage */}
        <div className="mb-8">
          <div className="w-48 h-48 mx-auto mb-6 relative">
            <Image
              src="/images/Logo_Apprend.png"
              alt="Personnage APPREND+ - Femme avec livre et ampoule d'idée"
              width={192}
              height={192}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Message simplifié */}
        <div className="mb-8">
          <p className="text-gray-700 text-lg leading-relaxed font-medium">
            L'excellence mentale ancrée de manière durable.
          </p>
        </div>

        {/* Bouton Commencer */}
        <button 
          onClick={handleCommencer}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg w-full max-w-xs"
        >
          Commencer
        </button>
      </div>
    </div>
  );
}