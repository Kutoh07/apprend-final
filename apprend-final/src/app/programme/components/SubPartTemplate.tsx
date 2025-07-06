'use client';
import React, { useState } from 'react';
import { SubPart } from '../../../lib/types/programme';
import { programmeSupabaseService } from '../../../lib/programmeSupabaseService';

interface SubPartTemplateProps {
  userId: string;
  subPart: SubPart;
  onSaved?: () => void;
}

export default function SubPartTemplate({ userId, subPart, onSaved }: SubPartTemplateProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!value.trim()) return;
    setSaving(true);
    await programmeSupabaseService.addField(userId, subPart.id, value);
    setValue('');
    setSaving(false);
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full border rounded p-2"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={subPart.placeholder}
      />
      <button
        onClick={handleAdd}
        disabled={saving}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {saving ? 'Ajout…' : 'Ajouter'}
      </button>
    </div>
  );
}
