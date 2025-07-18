'use client';
import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Chargement de ton espace...' }) => (
  <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);
