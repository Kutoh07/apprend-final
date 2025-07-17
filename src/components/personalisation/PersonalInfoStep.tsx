// src/components/personalisation/PersonalInfoStep.tsx

import React, { useState, useCallback } from 'react';
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

  // Validation plus robuste pour l'année de naissance
  const validateBirthYear = (year: number) => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100; // 100 ans maximum
    const maxYear = currentYear - 13;  // 13 ans minimum
    
    return year >= minYear && year <= maxYear;
  };

  const handleInputChange = useCallback((field: keyof UserData, value: string | number) => {
    onUpdateData({ [field]: value });
    
    // Supprimer l'erreur si le champ est maintenant valide
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, [onUpdateData]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    // Champs obligatoires
    if (!userData.name?.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    // Validation plus précise pour l'année de naissance
    if (!userData.birthYear) {
      newErrors.birthYear = 'L\'année de naissance est obligatoire';
    } else if (userData.birthYear === currentYear) {
      newErrors.birthYear = 'Veuillez sélectionner votre année de naissance';
    } else if (!validateBirthYear(userData.birthYear)) {
      newErrors.birthYear = 'Année de naissance invalide';
    }

    if (!userData.profession?.trim()) {
      newErrors.profession = 'La profession est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [userData.name, userData.birthYear, userData.profession]);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      onNext();
    }
  }, [validateForm, onNext]);

  // Sécuriser les valeurs par défaut
  const safeUserData = {
    name: userData?.name || '',
    birthYear: userData?.birthYear || new Date().getFullYear(),
    profession: userData?.profession || '',
    gender: userData?.gender || '',
    phone: userData?.phone || '',
    country: userData?.country || ''
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
              value={safeUserData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Votre prénom"
              autoComplete="given-name"
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
              value={safeUserData.birthYear}
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
              value={safeUserData.profession}
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
              value={safeUserData.gender}
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
              value={safeUserData.phone}
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
              value={safeUserData.country}
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