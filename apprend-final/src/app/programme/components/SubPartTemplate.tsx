'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { programmeSupabaseService } from '../../../lib/programmeSupabaseService';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG } from '../../../lib/types/programme';

interface SubPartTemplateProps {
  subPartId: number;
}

export default function SubPartTemplate({ subPartId }: SubPartTemplateProps) {
  const router = useRouter();
  const [programmeData, setProgrammeData] = useState<ProgrammeData | null>(null);
  const [currentSubPart, setCurrentSubPart] = useState<SubPart | null>(null);
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      try {
        // Récupérer l'utilisateur
        const user = localStorage.getItem('user');
        if (!user) {
          router.push('/auth');
          return;
        }

        const userData = JSON.parse(user);
        const userEmail = userData.email || userData.id;
        setUserId(userEmail);

        // Vérifier l'accès à cette sous-partie
        const canAccess = await programmeSupabaseService.canAccessSubPart(userEmail, subPartId);
        if (!canAccess) {
          router.push('/programme');
          return;
        }

        // Charger le programme
        const programme = await programmeSupabaseService.getProgramme(userEmail);
        if (programme) {
          setProgrammeData(programme);
          const subPart = programme.subParts.find(sp => sp.id === subPartId);
          setCurrentSubPart(subPart || null);
        }
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subPartId, router]);

  // Ajouter une nouvelle entrée
  const handleAddField = async () => {
    if (!newValue.trim() || !userId || !currentSubPart) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const newField = await programmeSupabaseService.addField(userId, subPartId, newValue);
      
      if (newField) {
        // Recharger les données
        const updatedProgramme = await programmeSupabaseService.getProgramme(userId);
        if (updatedProgramme) {
          setProgrammeData(updatedProgramme);
          const updatedSubPart = updatedProgramme.subParts.find(sp => sp.id === subPartId);
          setCurrentSubPart(updatedSubPart || null);
        }
        
        setNewValue('');
        setSuccess('Entrée ajoutée avec succès !');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une entrée
  const handleRemoveField = async (fieldId: string) => {
    if (!userId) return;
    
    setSaving(true);
    try {
      await programmeSupabaseService.removeField(userId, fieldId, subPartId);
      
      // Recharger les données
      const updatedProgramme = await programmeSupabaseService.getProgramme(userId);
      if (updatedProgramme) {
        setProgrammeData(updatedProgramme);
        const updatedSubPart = updatedProgramme.subParts.find(sp => sp.id === subPartId);
        setCurrentSubPart(updatedSubPart || null);
      }
      
      setSuccess('Entrée supprimée');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  // Navigation
  const handleBack = () => {
    router.push('/programme');
  };

  const handleNext = () => {
    if (programmeData && subPartId < programmeData.subParts.length) {
      const nextSubPart = SUBPARTS_CONFIG.find(config => config.id === subPartId + 1);
      if (nextSubPart) {
        router.push(`/programme/${nextSubPart.slug}`);
      }
    } else {
      router.push('/programme/conclusion');
    }
  };

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentSubPart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-red-600">Sous-partie non trouvée</p>
          <button onClick={handleBack} className="mt-4 text-purple-600 hover:underline">
            Retour au programme
          </button>
        </div>
      </div>
    );
  }

  const canAddMore = !currentSubPart.maxFields || currentSubPart.fields.length < currentSubPart.maxFields;
  const meetsMinimum = currentSubPart.fields.length >= (currentSubPart.minFields || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              Retour au programme
            </button>
            
            <div className="text-center">
              <div className={`text-6xl mb-2`}>{currentSubPart.icon}</div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r ${currentSubPart.color} bg-clip-text text-transparent`}>
                {currentSubPart.name}
              </h1>
            </div>
            
            <div className="w-24"></div> {/* Spacer pour centrer le titre */}
          </div>

          <p className="text-xl text-gray-700 text-center mb-6">
            {currentSubPart.description}
          </p>

          {/* Barre de progression */}
          <div className="bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${currentSubPart.color} transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${currentSubPart.progress}%` }}
            >
              {currentSubPart.progress > 0 && (
                <span className="text-white text-xs font-bold">{currentSubPart.progress}%</span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{currentSubPart.fields.length} / {currentSubPart.minFields || 1} minimum</span>
            <span>{currentSubPart.maxFields ? `Max: ${currentSubPart.maxFields}` : 'Illimité'}</span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Formulaire d'ajout */}
        {canAddMore && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Ajouter une nouvelle entrée</h3>
            <div className="flex gap-4">
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={currentSubPart.placeholder}
                className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
                disabled={saving}
              />
              <button
                onClick={handleAddField}
                disabled={!newValue.trim() || saving}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                  !newValue.trim() || saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600 text-white transform hover:scale-105'
                }`}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Plus size={20} />
                )}
                {saving ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {/* Liste des entrées existantes */}
        {currentSubPart.fields.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Tes entrées ({currentSubPart.fields.length})</h3>
            <div className="space-y-4">
              {currentSubPart.fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-800 whitespace-pre-wrap">{field.value}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Ajouté le {field.createdAt.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveField(field.id)}
                    disabled={saving}
                    className="ml-4 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Supprimer cette entrée"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
            Programme
          </button>

          {meetsMinimum && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all transform hover:scale-105"
            >
              {subPartId < 8 ? 'Suivant' : 'Terminer'}
              <Save size={20} />
            </button>
          )}
        </div>

        {!meetsMinimum && (
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Ajoutez au moins {(currentSubPart.minFields || 1) - currentSubPart.fields.length} entrée(s) pour continuer
            </p>
          </div>
        )}
      </div>
    </div>
  );
}