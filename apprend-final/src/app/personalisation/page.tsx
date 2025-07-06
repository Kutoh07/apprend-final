'use client';
import React, { useState } from 'react';
import WelcomeStep from '../../components/personalisation/WelcomeStep';
import PersonalInfoStep from '../../components/personalisation/PersonalInfoStep';
import SuccessStep from '../../components/personalisation/SuccessStep';

export interface UserData {
  name: string;
  birthYear: number;
  profession: string;
  gender?: string;
  phone?: string;
  country?: string;
}

export default function PersonalisationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    birthYear: new Date().getFullYear(),
    profession: ''
  });

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