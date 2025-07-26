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
import { ModernLayout } from '@/components/layout/ModernLayout';
import { ModernCard, CardHeader, CardContent } from '@/components/ui/ModernCard';
import { ModernButton, ActionButton } from '@/components/ui/ModernButton';
import { ModernProgress } from '@/components/ui/ModernProgress';
import { User, Calendar, Briefcase, Globe, Check, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';

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
  <ModernLayout
    title="Personnalisation 👤"
    className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50"
  >
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ModernCard variant="glass" className="animate-scale-in">
        <CardHeader
          title={title}
          className="text-center"
        />
        <CardContent spacing="lg">
          {children}
        </CardContent>
      </ModernCard>
    </div>
  </ModernLayout>
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
  <div className="flex justify-between items-center mt-12 gap-4">
    <ModernButton
      variant="outline"
      size="lg"
      onClick={onBack}
      disabled={disabled}
      leftIcon={<ArrowLeft className="w-5 h-5" />}
    >
      {backLabel}
    </ModernButton>
    
    <ActionButton
      size="lg"
      onClick={onNext}
      disabled={disabled}
      isLoading={loading}
      loadingText="Chargement..."
      rightIcon={<ArrowRight className="w-5 h-5" />}
    >
      {nextLabel}
    </ActionButton>
  </div>
);

interface StatusMessageProps {
  type: 'loading' | 'success' | 'error';
  message: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ type, message }) => {
  const configs = {
    loading: { 
      bg: 'bg-primary-50', 
      text: 'text-primary-700', 
      border: 'border-primary-200',
      icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
    },
    success: { 
      bg: 'bg-success-50', 
      text: 'text-success-700', 
      border: 'border-success-200',
      icon: <Check className="w-5 h-5 text-success-600" />
    },
    error: { 
      bg: 'bg-error-50', 
      text: 'text-error-700', 
      border: 'border-error-200',
      icon: <AlertCircle className="w-5 h-5 text-error-600" />
    }
  };
  
  const config = configs[type];
  
  return (
    <div className={`mt-6 p-4 ${config.bg} border ${config.border} rounded-xl`}>
      <div className="flex items-center space-x-3">
        {config.icon}
        <span className={`${config.text} text-sm font-medium`}>{message}</span>
      </div>
    </div>
  );
};

interface RocketAnimationProps {
  animated?: boolean;
}

const RocketAnimation: React.FC<RocketAnimationProps> = ({ animated = false }) => (
  <div className="flex justify-center">
    <div className="relative">
      {/* Animated background glow */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-t from-orange-400 via-red-400 to-yellow-400 rounded-full blur-xl opacity-60 animate-pulse scale-150" />
      )}
      
      {/* Rocket body */}
      <div className={`relative w-20 h-40 bg-gradient-to-t from-gray-300 via-gray-100 to-white rounded-t-full shadow-xl transform ${animated ? 'animate-bounce' : ''}`}>
        {/* Main body decoration */}
        <div className="w-16 h-32 bg-gradient-to-t from-primary-400 to-primary-200 rounded-t-full absolute top-2 left-2" />
        
        {/* Window */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-200 to-blue-400 rounded-full absolute top-8 left-6 border-2 border-gray-300" />
        
        {/* Side fins */}
        <div className="w-6 h-12 bg-gradient-to-br from-red-500 to-red-600 absolute bottom-0 -left-3 transform -skew-x-12 rounded-b-lg shadow-lg" />
        <div className="w-6 h-12 bg-gradient-to-br from-red-500 to-red-600 absolute bottom-0 -right-3 transform skew-x-12 rounded-b-lg shadow-lg" />
        
        {/* Engine fire */}
        {animated && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="w-10 h-8 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-b-full animate-pulse opacity-80" />
            <div className="w-6 h-4 bg-gradient-to-t from-yellow-400 to-orange-300 rounded-b-full absolute bottom-0 left-1/2 transform -translate-x-1/2 animate-pulse" />
          </div>
        )}
      </div>
      
      {/* Floating particles */}
      {animated && (
        <>
          <div className="absolute top-10 left-8 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75" />
          <div className="absolute top-16 right-6 w-1 h-1 bg-orange-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-20 left-12 w-1 h-1 bg-red-400 rounded-full animate-ping opacity-80" style={{ animationDelay: '1s' }} />
        </>
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
    <ModernCard variant="gradient" className="mt-8">
      <CardHeader title="Récapitulatif de tes informations" />
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <span className="text-sm text-gray-500">Nom</span>
              <p className="font-semibold text-gray-900">{userData.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <span className="text-sm text-gray-500">Année de naissance</span>
              <p className="font-semibold text-gray-900">{userData.birthYear}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <span className="text-sm text-gray-500">Profession</span>
              <p className="font-semibold text-gray-900">{getProfessionLabel(userData.profession)}</p>
            </div>
          </div>
          
          {userData.gender && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <span className="text-sm text-gray-500">Genre</span>
                <p className="font-semibold text-gray-900">{getGenderLabel(userData.gender)}</p>
              </div>
            </div>
          )}
          
          {userData.phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                <span className="text-secondary-600 text-sm">📱</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Téléphone</span>
                <p className="font-semibold text-gray-900">{userData.phone}</p>
              </div>
            </div>
          )}
          
          {userData.country && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <span className="text-sm text-gray-500">Pays</span>
                <p className="font-semibold text-gray-900">{getCountryLabel(userData.country)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </ModernCard>
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
    <PageContainer title="Bienvenue dans ton espace personnalisation">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Créons ton programme sur mesure
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Ton programme de renaissance est unique. Pour te proposer le parcours le plus adapté, 
              nous avons besoin d'apprendre à mieux te connaître.
            </p>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl border border-primary-200">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-primary-900">Informations personnalisées</p>
              <p className="text-sm text-primary-700">Quelques questions pour adapter ton parcours</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-2xl blur-2xl opacity-20 animate-pulse" />
            <Image
              src="/images/Personalisation.png"
              alt="Illustration de personnalisation"
              width={400}
              height={300}
              className="relative rounded-2xl shadow-xl object-contain hover-lift"
              priority
            />
          </div>
        </div>
      </div>
      
      <NavigationButtons 
        onBack={handleBack}
        onNext={onNext}
        backLabel="Retour au dashboard"
        nextLabel="Commencer la personnalisation"
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
        <div className="space-y-3">
          <label className="flex items-center text-lg font-medium text-gray-700 gap-2">
            <User className="w-5 h-5 text-primary-600" />
            Comment aimerais-tu que nous t'appelions ?
          </label>
          <input
            type="text"
            value={safeUserData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Votre prénom"
            autoComplete="given-name"
            className={`input-base ${errors.name ? 'border-error-500 focus:ring-error-500' : ''}`}
          />
          {errors.name && (
            <p className="flex items-center text-error-600 text-sm gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Question 2: Année de naissance */}
        <div className="space-y-3">
          <label className="flex items-center text-lg font-medium text-gray-700 gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Quelle est ton année de naissance ?
          </label>
          <select
            value={safeUserData.birthYear}
            onChange={(e) => handleInputChange('birthYear', parseInt(e.target.value))}
            className={`input-base ${errors.birthYear ? 'border-error-500 focus:ring-error-500' : ''}`}
          >
            {birthYearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.birthYear && (
            <p className="flex items-center text-error-600 text-sm gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.birthYear}
            </p>
          )}
        </div>

        {/* Question 3: Profession */}
        <div className="space-y-3">
          <label className="flex items-center text-lg font-medium text-gray-700 gap-2">
            <Briefcase className="w-5 h-5 text-primary-600" />
            Quelle est ton activité principale ?
          </label>
          <select
            value={safeUserData.profession}
            onChange={(e) => handleInputChange('profession', e.target.value)}
            className={`input-base ${errors.profession ? 'border-error-500 focus:ring-error-500' : ''}`}
          >
            {CSP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.profession && (
            <p className="flex items-center text-error-600 text-sm gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.profession}
            </p>
          )}
        </div>

        {/* Séparateur moderne */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">
              Informations optionnelles (pour mieux te connaître)
            </span>
          </div>
        </div>

        {/* Question optionnelle: Genre */}
        <div className="space-y-3">
          <label className="flex items-center text-lg font-medium text-gray-700 gap-2">
            <User className="w-5 h-5 text-secondary-600" />
            Genre <span className="text-sm text-gray-500">(optionnel)</span>
          </label>
          <select
            value={safeUserData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="input-base border-gray-200 focus:border-secondary-500 focus:ring-secondary-500"
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Question optionnelle: Téléphone */}
        <div className="space-y-3">
          <label className="block text-lg font-medium text-gray-700">
            Numéro de téléphone <span className="text-sm text-gray-500">(optionnel)</span>
          </label>
          <input
            type="tel"
            value={safeUserData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="06 12 34 56 78"
            className="input-base border-gray-200 focus:border-secondary-500 focus:ring-secondary-500"
          />
        </div>

        {/* Question optionnelle: Pays */}
        <div className="space-y-3">
          <label className="flex items-center text-lg font-medium text-gray-700 gap-2">
            <Globe className="w-5 h-5 text-secondary-600" />
            Pays de résidence <span className="text-sm text-gray-500">(optionnel)</span>
          </label>
          <select
            value={safeUserData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="input-base border-gray-200 focus:border-secondary-500 focus:ring-secondary-500"
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
    <PageContainer title="Profil configuré avec succès !">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary-600">
              Enchanté <span className="text-gradient-primary">{userData.name}</span> !
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              L'équipe APPREND+ est heureuse de t'accueillir à bord de sa fusée à destination 
              de la femme 2.0 que tu aspires à devenir.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Maintenant tu peux renseigner tes résultats de la méthode "ACCEPTER"
            </p>
          </div>
          
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

        <div className="flex justify-center">
          <RocketAnimation animated={formState.saving} />
        </div>
      </div>

      <DataSummary userData={userData} />

      <NavigationButtons 
        onBack={onBack}
        onNext={handleContinue}
        disabled={formState.saving || formState.saved}
        loading={formState.saving}
        nextLabel={formState.saving ? 'Sauvegarde...' : formState.saved ? 'Redirection...' : 'Continuer vers le dashboard'}
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
        <ModernLayout title="Chargement" className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <div className="flex items-center justify-center min-h-[60vh]">
            <ModernCard variant="glass" className="text-center">
              <CardContent spacing="lg">
                <ModernProgress value={0} animated className="mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chargement de votre profil</h3>
                <p className="text-gray-600">Préparation de votre espace personnalisation...</p>
              </CardContent>
            </ModernCard>
          </div>
        </ModernLayout>
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

  return renderStep();
}