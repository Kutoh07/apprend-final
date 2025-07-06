'use client';
import React, { useState } from 'react';
import { ProgrammeData } from '../../../lib/types/programme';
import { programmeSupabaseService } from '../../../lib/programmeSupabaseService';

interface SaveButtonProps {
  programme: ProgrammeData;
}

export default function SaveButton({ programme }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleClick = async () => {
    setSaving(true);
    await programmeSupabaseService.saveProgramme(programme);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      className="px-4 py-2 bg-purple-500 text-white rounded-full disabled:opacity-50"
    >
      {saving ? 'Enregistrement…' : saved ? 'Enregistré !' : 'Sauvegarder'}
    </button>
  );
}
