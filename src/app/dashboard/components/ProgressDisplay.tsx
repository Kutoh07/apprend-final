'use client';
import React from 'react';
import type { User, ProgressMessage } from '../types';
import type { ProgrammeData } from '../../../lib/types/programme';

export interface ProgressDisplayProps {
  user: User;
  averageProgress: number;
  progressInfo: ProgressMessage;
  programmeData: ProgrammeData | null;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  user,
  averageProgress,
  progressInfo,
  programmeData
}) => (
  <div className="flex items-center">
    <div className={`rounded-3xl shadow-lg p-8 text-center border-2 ${progressInfo.bgColor} w-full`}>
      <div className="mb-6">
        <span className="text-6xl">{progressInfo.emoji}</span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Évolution de <span className="underline">{user.name}</span>
        </h2>

        <div className={`text-8xl font-bold mb-4 ${
          averageProgress >= 100 ? 'text-yellow-500' : 'text-gray-600'
        }`}>
          {averageProgress}%
        </div>

        <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold mb-6 ${
          averageProgress >= 100 ? 'bg-yellow-400 text-yellow-900' : 'bg-teal-100 text-teal-800'
        }`}>
          {progressInfo.range}
        </div>
      </div>

      <p className={`${progressInfo.textColor} text-xl leading-relaxed font-medium`}>
        {progressInfo.message}
      </p>

      {programmeData && (
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-bold text-gray-700">
              {programmeData.subParts.reduce((acc, sp) => acc + sp.fields.length, 0)}
            </p>
            <p className="text-gray-600">Entrées créées</p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="font-bold text-gray-700">
              {programmeData.subParts.filter(sp => sp.completed).length}/8
            </p>
            <p className="text-gray-600">Parties complétées</p>
          </div>
        </div>
      )}

      {averageProgress >= 100 && (
        <div className="mt-6 flex justify-center space-x-4">
          {['😊', '😄', '🎉'].map((emoji, index) => (
            <div
              key={index}
              className="text-6xl animate-bounce"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
