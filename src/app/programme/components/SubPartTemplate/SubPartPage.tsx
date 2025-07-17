// src/app/programme/components/SubPartTemplate/SubPartTemplate.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Zap } from 'lucide-react';
import { SUBPARTS_CONFIG } from '@/lib/types/programme';
import { useSubPartData } from '@/hooks/useSubPartData';
import ModuleNavigation from '../ModuleNavigation';
import SubPartHeader from './SubPartHeader';
import SubPartForm from './SubPartForm';
import SubPartFieldsList from './SubPartFieldsList';
import SubPartStatusMessage from './SubPartStatusMessage';
import SubPartEncouragement from './SubPartEncouragement';
import SubPartDebugPanel from './SubPartDebugPanel';

interface SubPartTemplateProps {
  subPartId: number;
}

const SubPartPage: React.FC<SubPartTemplateProps> = ({ subPartId }) => {
  const router = useRouter();
  
  const {
    programmeData,
    currentSubPart,
    userId,
    userEmail,
    loading,
    updating,
    canAccessNext,
    newValue,
    error,
    success,
    subPartConfig,
    canAddMore,
    meetsMinimum,
    handleAddField,
    handleUpdateField,
    handleDeleteField,
    handleSave,
    handleProgressUpdate,
    forceRefresh,
    setNewValue,
    clearError,
    clearSuccess,
    performanceStats,
    cacheStats
  } = useSubPartData(subPartId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Chargement ultra-rapide</h3>
          <p className="text-gray-600 mb-4">Optimisations: Cache + Batch + Parallele</p>
          {userEmail && (
            <p className="text-sm text-gray-500">Connecte: {userEmail}</p>
          )}
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>Cache hits: {cacheStats.hits}</div>
            <div>Derniere operation: {Math.round(performanceStats.lastOperationTime)}ms</div>
            <div>Total operations: {performanceStats.totalOperations}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSubPart || !subPartConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-bold text-red-600 mb-4">Module non trouve</h3>
          <p className="text-gray-600 mb-6">
            Le module avec l'ID {subPartId} n'existe pas ou n'est pas accessible.
          </p>
          <button 
            onClick={() => router.push('/programme')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retour au programme
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        
        <SubPartDebugPanel
          userId={userId}
          userEmail={userEmail}
          performanceStats={performanceStats}
          cacheStats={cacheStats}
          isUpdating={updating}
          onForceRefresh={async () => {
            await forceRefresh();
          }}
        />

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={() => router.push('/dashboard')}
                className="hover:text-purple-600 transition-colors"
              >
                Dashboard
              </button>
              <span>→</span>
              <button
                onClick={() => router.push('/programme')}
                className="hover:text-purple-600 transition-colors"
              >
                Programme
              </button>
              <span>→</span>
              <span className="text-purple-600 font-medium">{currentSubPart.name}</span>
            </div>
            
            <button
              onClick={() => router.push('/programme')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
            >
              <Home size={16} />
              <span>Retour Programme</span>
            </button>
          </div>
        </div>

        <ModuleNavigation
          currentSubPartId={subPartId}
          currentSubPart={currentSubPart}
          canAccessNext={meetsMinimum}
          isLoading={loading || updating}
        />

        <SubPartHeader
          subPart={currentSubPart}
          currentCount={currentSubPart.fields.length}
          onProgressUpdate={handleProgressUpdate}
        />

        <div className="mb-6">
          <SubPartStatusMessage
            error={error}
            success={success}
            onClearError={clearError}
            onClearSuccess={clearSuccess}
          />
        </div>

        <SubPartForm
          subPart={currentSubPart}
          newValue={newValue}
          onValueChange={setNewValue}
          onSubmit={async () => {
            await handleAddField();
          }}
          isUpdating={updating}
          canAddMore={canAddMore}
        />

        <SubPartFieldsList
          subPart={currentSubPart}
          onUpdate={async (fieldId: string, newValue: string) => {
            await handleUpdateField(fieldId, newValue);
          }}
          onDelete={async (fieldId: string) => {
            await handleDeleteField(fieldId);
          }}
          onSave={async () => {
            await handleSave();
          }}
          isUpdating={updating}
        />

        <SubPartEncouragement
          subPart={currentSubPart}
          meetsMinimum={meetsMinimum}
          canAddMore={canAddMore}
          canAccessNext={canAccessNext}
          subPartId={subPartId}
        />

        <div className="mt-8 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Module {subPartId} sur {SUBPARTS_CONFIG.length}</span>
              <span>•</span>
              <span>{currentSubPart.fields.length} entree(s)</span>
              <span>•</span>
              <span>{currentSubPart.progress}% complete</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Optimise pour la performance</span>
              <Zap size={14} className="text-green-500" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubPartPage;