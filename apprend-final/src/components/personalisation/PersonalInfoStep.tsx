import React, { useState } from 'react';
import { CSP_OPTIONS, GENDER_OPTIONS, COUNTRY_OPTIONS, generateBirthYears } from '../../lib/constants';
import { UserData } from '../../app/personalisation/page';

interface PersonalInfoStepProps {
  userData: UserData;
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<UserData>) => void;
}

export default function PersonalInfoStep({ userData, onNext, onBack, onUpdateData }: PersonalInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const birthYearOptions = generateBirthYears();

  const handleInputChange = (field: keyof UserData, value: string | number) => {
    onUpdateData({ [field]: value });
    
    // Supprimer l'erreur si le champ est maintenant valide
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires
    if (!userData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    if (!userData.birthYear || userData.birthYear === new Date().getFullYear()) {
      newErrors.birthYear = 'L\'année de naissance est obligatoire';
    }

    if (!userData.profession) {
      newErrors.profession = 'La profession est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
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

        {/* Formulaire */}
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Question 1: Nom */}
          <div>
            <label className="block text-xl text-gray-700 mb-4">
              Comment aimerais-tu que nous t'appelions ?
            </label>
            <input
              type="text"
              value={userData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Votre prénom"
              className={`w-full p-4 text-lg border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all ${
                errors.name ? 'border-red-500' : 'border-sky-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-2">{errors.name}</p>
            )}
          </div>

          {/* Question 2: Année de naissance */}
          <div>
            <label className="block text-xl text-gray-700 mb-4">
              Quelle est ton année de naissance ?
            </label>
            <select
              value={userData.birthYear}
              onChange={(e) => handleInputChange('birthYear', parseInt(e.target.value))}
              className={`w-full p-4 text-lg border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all bg-white ${
                errors.birthYear ? 'border-red-500' : 'border-sky-300'
              }`}
            >
              {birthYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.birthYear && (
              <p className="text-red-500 text-sm mt-2">{errors.birthYear}</p>
            )}
          </div>

          {/* Question 3: Profession */}
          <div>
            <label className="block text-xl text-gray-700 mb-4">
              Quelle est ton activité principale ?
            </label>
            <select
              value={userData.profession}
              onChange={(e) => handleInputChange('profession', e.target.value)}
              className={`w-full p-4 text-lg border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all bg-white ${
                errors.profession ? 'border-red-500' : 'border-sky-300'
              }`}
            >
              {CSP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.profession && (
              <p className="text-red-500 text-sm mt-2">{errors.profession}</p>
            )}
          </div>

          {/* Ligne de séparation */}
          <div className="border-t border-gray-200 my-8"></div>
          
          <p className="text-lg text-gray-600 text-center italic">
            Informations optionnelles (pour mieux te connaître)
          </p>

          {/* Question optionnelle: Genre */}
          <div>
            <label className="block text-xl text-gray-700 mb-4">
              Genre (optionnel)
            </label>
            <select
              value={userData.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full p-4 text-lg border-2 border-sky-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all bg-white"
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question optionnelle: Téléphone */}
          <div>
            <label className="block text-xl text-gray-700 mb-4">
              Numéro de téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={userData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full p-4 text-lg border-2 border-sky-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
            />
          </div>

          {/* Question optionnelle: Pays */}
          <div>
            <label className="block text-xl text-gray-700 mb-4">
              Pays de résidence (optionnel)
            </label>
            <select
              value={userData.country || ''}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full p-4 text-lg border-2 border-sky-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all bg-white"
            >
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.flag} {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex justify-between items-center mt-16">
          <button 
            onClick={onBack}
            className="bg-sky-300 hover:bg-sky-400 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Retour
          </button>
          
          <button 
            onClick={handleNext}
            className="bg-sky-400 hover:bg-sky-500 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}