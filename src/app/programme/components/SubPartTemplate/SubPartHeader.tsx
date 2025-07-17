
// components/SubPartTemplate/SubPartHeader.tsx

import React from 'react';
import { SubPart } from '../../../../lib/types/programme';
import LiveProgressBar from '../LiveProgressBar';

interface SubPartHeaderProps {
  subPart: SubPart;
  currentCount: number;
  onProgressUpdate: (progress: number) => void;
}

export default function SubPartHeader({ 
  subPart, 
  currentCount, 
  onProgressUpdate 
}: SubPartHeaderProps) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{subPart.icon}</div>
        <h1 className={`text-3xl font-bold bg-gradient-to-r ${subPart.color} bg-clip-text text-transparent mb-4`}>
          {subPart.name}
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          {subPart.description}
        </p>
      </div>

      {/* Barre de progression en temps réel */}
      <LiveProgressBar
        subPart={subPart}
        currentCount={currentCount}
        onProgressUpdate={onProgressUpdate}
      />
    </div>
  );
}