// src/app/programme/components/EditableField.tsx
'use client';

import React, { useState } from 'react';
import { Edit3, Save, X, Trash2 } from 'lucide-react';
import { SubPartField } from '../../../lib/types/programme';

interface EditableFieldProps {
  field: SubPartField;
  index: number;
  onUpdate: (fieldId: string, newValue: string) => Promise<void>;
  onDelete: (fieldId: string) => Promise<void>;
  isUpdating: boolean;
}

export default function EditableField({ 
  field, 
  index, 
  onUpdate, 
  onDelete, 
  isUpdating 
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue.trim() === field.value.trim()) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onUpdate(field.id, editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setEditValue(field.value); // Restaurer la valeur originale
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(field.value);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      try {
        await onDelete(field.id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-purple-600">
          Entrée #{index + 1}
        </span>
        
        {!isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              disabled={isUpdating}
              className="p-1 text-blue-500 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
              title="Modifier"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="p-1 text-red-500 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
            disabled={saving}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              <X size={14} />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editValue.trim()}
              className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-800 whitespace-pre-wrap mb-2">{field.value}</p>
          <p className="text-xs text-gray-500">
            Ajouté le {field.createdAt.toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}
    </div>
  );
}