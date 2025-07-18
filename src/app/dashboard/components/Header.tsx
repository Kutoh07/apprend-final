'use client';
import React from 'react';
import { Home, Settings, LogOut } from 'lucide-react';
import type { ProgrammeData } from '../../../lib/types/programme';
import type { User } from '../types';

export interface HeaderProps {
  user: User;
  programmeData: ProgrammeData | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, programmeData, onNavigate, onLogout }) => (
  <div className="max-w-6xl mx-auto mb-8">
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-teal-600 mb-2">
            APPREND<span className="text-xl">+</span>
          </h1>
          <p className="text-gray-600">
            Bienvenue, <span className="font-semibold">{user.name}</span> !
          </p>
          {user.createdAt && (
            <p className="text-sm text-gray-500">
              Membre depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
            </p>
          )}
          {programmeData && (
            <p className="text-sm text-teal-600 font-medium">
              Programme : {programmeData.subParts.filter(sp => sp.completed).length}/8 parties complétées
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('/')}
            className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
            title="Accueil"
          >
            <Home size={24} />
          </button>
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Paramètres"
          >
            <Settings size={24} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>
    </div>
  </div>
);
