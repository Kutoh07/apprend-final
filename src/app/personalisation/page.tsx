'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserProfileService } from '../../lib/userProfileService';
import { programmeSupabaseService } from '../../lib/programmeSupabaseService';
import { supabase } from '../../lib/supabase';
import { CSP_OPTIONS, GENDER_OPTIONS, COUNTRY_OPTIONS } from '../../lib/constants';
import {
  getProfessionValueFromLabel,
  getCountryValueFromLabel,
  getProfessionLabelFromValue,
  getCountryLabelFromValue,
} from '../../lib/dataMappings';

export interface UserData {
  name: string;
  birthYear: number;
  profession: string;
  gender?: string;
  phone?: string;
  country?: string;
}

interface FormState {
  saving: boolean;
  saved: boolean;
  error: string | null;
}

interface ValidationErrors {
  [key: string]: string;
}

// ====== UTILITAIRES ======
function generateBirthYears() {
  const currentYear = new Date().getFullYear();
  const years = [{ value: currentYear, label: 'Sélectionner votre année de naissance' }];
  for (let y = currentYear - 1; y >= 1940; y--) {
    years.push({ value: y, label: y.toString() });
  }
  return years;
}

const validateForm = (userData: UserData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  if (!userData.name?.trim()) {
    errors.name = 'Le nom est obligatoire';
  }
  
  if (!userData.birthYear || userData.birthYear === new Date().getFullYear()) {
    errors.birthYear = 'L\'année de naissance est obligatoire';
  }
  
  if (!userData.profession?.trim()) {
    errors.profession = 'La profession est obligatoire';
  }
  
  return errors;
};

// ====== COMPOSANTS RÉUTILISABLES ======
interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, title = "PERSONALISATION" }) => (
  <div className="min-h-screen bg-gradient-to-br from-sky-100 to-sky-200">
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-sky-400 mb-8 tracking-wide">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  </div>
);

interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  disabled?: boolean;
  loading?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onBack,
  onNext,
  backLabel = "Retour",
  nextLabel = "Continuer",
  disabled = false,
  loading = false
}) => (
  <div className="flex justify-between items-center mt-16">
    <button 
      onClick={onBack}
      disabled={disabled}
      className="bg-sky-300 hover:bg-sky-400 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {backLabel}
    </button>
    
    <button 
      onClick={onNext}
      disabled={disabled}
      className="bg-sky-400 hover:bg-sky-500 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Chargement...' : nextLabel}
    </button>
  </div>
);

interface StatusMessageProps {
  type: 'loading' | 'success' | 'error';
  message: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ type, message }) => {
  const configs = {
    loading: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '⏳' },
    success: { bg: 'bg-green-50', text: 'text-green-700', icon: '✅' },
    error: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '⚠️' }
  };
  
  const config = configs[type];
  
  return (
    <div className={`mt-6 p-4 ${config.bg} rounded-lg`}>
      <div className="flex items-center space-x-2">
        {type === 'loading' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        ) : (
          <span>{config.icon}</span>
        )}
        <span className={config.text}>{message}</span>
      </div>
    </div>
  );
};

interface RocketAnimationProps {
  animated?: boolean;
}

const RocketAnimation: React.FC<RocketAnimationProps> = ({ animated = false }) => (
  <div className="flex-1 flex justify-center">
    <div className="relative">
      <div className="w-16 h-32 bg-gradient-to-t from-red-400 via-orange-400 to-yellow-400 rounded-t-full relative mx-auto">
        <div className="w-12 h-24 bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-full absolute top-8 left-2" />
        <div className="w-6 h-6 bg-blue-200 rounded-full absolute top-12 left-5 border-2 border-gray-400" />
        <div className="w-6 h-8 bg-red-500 absolute bottom-0 -left-2 transform -skew-x-12" />
        <div className="w-6 h-8 bg-red-500 absolute bottom-0 -right-2 transform skew-x-12" />
      </div>
      {animated && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-6 bg-gradient-to-t from-red-500 to-orange-400 rounded-b-full animate-pulse" />
        </div>
      )}
    </div>
  </div>
);

interface DataSummaryProps {
  userData: UserData;
}

const DataSummary: React.FC<DataSummaryProps> = ({ userData }) => {
  const getProfessionLabel = (value: string) => {
    const option = CSP_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getCountryLabel = (value: string) => {
    const option = COUNTRY_OPTIONS.find(opt => opt.value === value);
    return option ? `${option.flag} ${option.label}` : value;
  };

  const getGenderLabel = (value: string) => {
    const option = GENDER_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="mt-12 p-6 bg-sky-50 rounded-2xl">
      <h3 className="text-lg font-semibold text-sky-700 mb-4">Récapitulatif de tes informations :</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
        <div><strong>Nom :</strong> {userData.name}</div>
        <div><strong>Année de naissance :</strong> {userData.birthYear}</div>
        <div><strong>Profession :</strong> {getProfessionLabel(userData.profession)}</div>
        {userData.gender && <div><strong>Genre :</strong> {getGenderLabel(userData.gender)}</div>}
        {userData.phone && <div><strong>Téléphone :</strong> {userData.phone}</div>}
        {userData.country && <div><strong>Pays :</strong> {getCountryLabel(userData.country)}</div>}
      </div>
    </div>
  );
};

// ====== ÉTAPES DU FORMULAIRE ======
interface StepProps {
  onNext: () => void;
  onBack: () => void;
  userData?: UserData;
  onUpdateData?: (data: Partial<UserData>) => void;
}

const WelcomeStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const router = useRouter();
  
  const handleBack = () => router.push('/dashboard');
  
  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-8">
          <p className="text-xl text-gray-700 leading-relaxed">
            Ton programme de renaissance est sur mesure. Pour cela, il est essentiel que nous 
            apprenions à mieux nous connaître.
          </p>
        </div>
        
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
      
      <NavigationButtons 
        onBack={handleBack}
        onNext={onNext}
        nextLabel="Commencer"
      />
    </PageContainer>
  );
};

const PersonalInfoStep: React.FC<StepProps & { userData: UserData; onUpdateData: (data: Partial<UserData>) => void }> = ({ 
  userData, 
  onNext, 
  onBack, 
  onUpdateData 
}) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const birthYearOptions = generateBirthYears();

  const handleInputChange = (field: keyof UserData, value: string | number) => {
    onUpdateData({ [field]: value });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    const newErrors = validateForm(userData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const safeUserData = {
    name: userData?.name || '',
    birthYear: userData?.birthYear || new Date().getFullYear(),
    profession: userData?.profession || '',
    gender: userData?.gender || '',
    phone: userData?.phone || '',
    country: userData?.country || ''
  };

  return (
    <PageContainer>
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

        {/* Séparateur */}
        <div className="border-t border-gray-200 my-8" />
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

      <NavigationButtons 
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Valider"
      />
    </PageContainer>
  );
};

const SuccessStep: React.FC<StepProps & { userData: UserData }> = ({ userData, onBack }) => {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    saving: false,
    saved: false,
    error: null
  });

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  const handleContinue = async () => {
    updateFormState({ saving: true, error: null });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('Sauvegarde du profil utilisateur:', userData);
      
      const result = await UserProfileService.saveUserProfile(userData);
      
      if (result && !result.error) {
        console.log('Profil sauvegardé avec succès:', result);
        
        console.log('Initialisation du programme...');
        await programmeSupabaseService.initializeProgramme(session.user.id);
        
        updateFormState({ saved: true });
        
        // Sauvegarder aussi en local pour compatibilité
        const userInfo = {
          id: session.user.id,
          email: session.user.email,
          name: userData.name,
          created_at: session.user.created_at,
          progress: {
            level: 0,
            skills: { confiance: 20, discipline: 15, action: 30 }
          }
        };
        
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('userPersonalisation', JSON.stringify(userData));
        
        setTimeout(() => router.push('/dashboard'), 1500);
        
      } else {
        throw new Error(result?.error?.message || 'Erreur lors de la sauvegarde');
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      updateFormState({ 
        error: 'Erreur lors de la sauvegarde. Vos données ont été sauvegardées localement.' 
      });
      
      localStorage.setItem('userPersonalisation', JSON.stringify(userData));
      setTimeout(() => router.push('/dashboard'), 2000);
      
    } finally {
      updateFormState({ saving: false });
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-8">
          <p className="text-xl text-gray-700 leading-relaxed mb-6">
            Enchanté <strong className="text-sky-600">{userData.name}</strong> ! L'équipe APPREND est 
            heureuse de t'accueillir à bord de sa fusée à destination de la femme 2.0 que tu aspires à 
            devenir.
          </p>
          <p className="text-xl text-gray-700 leading-relaxed">
            Maintenant tu peux renseigner tes résultats de la méthode "ACCEPTER"
          </p>
          
          {formState.saving && (
            <StatusMessage 
              type="loading" 
              message="Sauvegarde et initialisation du programme..." 
            />
          )}
          
          {formState.saved && (
            <StatusMessage 
              type="success" 
              message="Profil sauvegardé et programme initialisé ! Redirection en cours..." 
            />
          )}
          
          {formState.error && (
            <StatusMessage 
              type="error" 
              message={formState.error} 
            />
          )}
        </div>

        <RocketAnimation animated={formState.saving} />
      </div>

      <DataSummary userData={userData} />

      <NavigationButtons 
        onBack={onBack}
        onNext={handleContinue}
        disabled={formState.saving || formState.saved}
        loading={formState.saving}
        nextLabel={formState.saving ? 'Sauvegarde...' : formState.saved ? 'Redirection...' : 'Continuer'}
      />
    </PageContainer>
  );
};

// ====== COMPOSANT PRINCIPAL ======
export default function PersonalisationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    birthYear: new Date().getFullYear(),
    profession: ''
  });

  // Charger les données existantes au montage du composant
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        console.log('🔄 Chargement des données utilisateur...');
        const { data, error } = await UserProfileService.getUserProfile();
        
        if (error) {
          console.log('ℹ️ Aucun profil existant trouvé:', error);
        } else if (data) {
          console.log('✅ Profil existant trouvé:', data);
          setUserData({
            name: data.name || '',
            birthYear: data.birthYear || new Date().getFullYear(),
            profession: getProfessionValueFromLabel(data.profession || ''),
            gender: data.gender || undefined,
            phone: data.phone || undefined,
            country: getCountryValueFromLabel(data.country || '') || undefined,
          });
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingData();
  }, []);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleUpdateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de votre profil...</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <WelcomeStep 
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 1:
        return (
          <PersonalInfoStep 
            userData={userData}
            onNext={handleNext}
            onBack={handleBack}
            onUpdateData={handleUpdateUserData}
          />
        );
      case 2:
        return (
          <SuccessStep 
            userData={userData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-sky-200">
      {renderStep()}
    </div>
  );
}