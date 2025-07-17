// Saisie de phrase utilisateur
// src/app/renaissance/components/PhraseInput.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PhraseInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  showCharCount?: boolean;
  showWordCount?: boolean;
  showSubmitShortcut?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'game' | 'minimal';
  className?: string;
}

export default function PhraseInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Tapez votre réponse ici...",
  disabled = false,
  autoFocus = true,
  maxLength = 500,
  minLength = 1,
  showCharCount = false,
  showWordCount = false,
  showSubmitShortcut = true,
  size = 'md',
  variant = 'default',
  className = ''
}: PhraseInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current && !disabled) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Gestion des raccourcis clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !disabled && value.trim().length >= minLength) {
      e.preventDefault();
      onSubmit();
    }
    
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  };

  // Classes de taille
  const sizeClasses = {
    sm: {
      textarea: 'min-h-[60px] p-3 text-sm',
      button: 'py-2 px-4 text-sm'
    },
    md: {
      textarea: 'min-h-[80px] p-4 text-base',
      button: 'py-3 px-6 text-base'
    },
    lg: {
      textarea: 'min-h-[100px] p-5 text-lg',
      button: 'py-4 px-8 text-lg'
    }
  };

  // Classes de variante
  const variantClasses = {
    default: {
      container: 'bg-white rounded-xl border-2 shadow-sm',
      textarea: 'border-gray-200 focus:border-purple-500',
      button: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    game: {
      container: 'bg-white rounded-2xl border-2 shadow-lg',
      textarea: 'border-purple-200 focus:border-purple-500',
      button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
    },
    minimal: {
      container: 'bg-gray-50 rounded-lg border',
      textarea: 'border-gray-300 focus:border-gray-500',
      button: 'bg-gray-600 hover:bg-gray-700 text-white'
    }
  };

  const classes = {
    size: sizeClasses[size],
    variant: variantClasses[variant]
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const canSubmit = value.trim().length >= minLength && !disabled;

  return (
    <div className={`w-full ${className}`}>
      <div className={`${classes.variant.container} transition-all duration-200 ${isFocused ? 'ring-2 ring-purple-200' : ''}`}>
        {/* Zone de saisie */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`
            w-full resize-none focus:outline-none transition-colors
            ${classes.size.textarea}
            ${classes.variant.textarea}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ fieldSizing: 'content' } as any}
        />

        {/* Footer avec infos et actions */}
        <div className="flex justify-between items-center p-3 border-t border-gray-100">
          {/* Compteurs et infos */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {showWordCount && (
              <span>{wordCount} mot{wordCount > 1 ? 's' : ''}</span>
            )}
            {showCharCount && (
              <span>{charCount}/{maxLength} caractères</span>
            )}
            {showSubmitShortcut && (
              <span className="hidden sm:inline">Ctrl+Entrée pour valider</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Bouton effacer */}
            {value && (
              <button
                onClick={() => onChange('')}
                disabled={disabled}
                className="text-gray-400 hover:text-gray-600 p-1 rounded disabled:opacity-50"
                title="Effacer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Bouton valider */}
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`
                ${classes.size.button}
                ${classes.variant.button}
                rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              `}
            >
              <span>✓</span>
              <span>Valider</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages d'aide */}
      {minLength > 1 && value.trim().length < minLength && value.length > 0 && (
        <div className="mt-2 text-xs text-orange-600">
          Minimum {minLength} caractère{minLength > 1 ? 's' : ''} requis
        </div>
      )}
    </div>
  );
}

// Composant spécialisé pour le jeu flash
interface FlashGameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  phraseNumber: number;
  totalPhrases: number;
  stage: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function FlashGameInput({
  value,
  onChange,
  onSubmit,
  phraseNumber,
  totalPhrases,
  stage,
  disabled = false,
  isLoading = false
}: FlashGameInputProps) {
  const getStageLabel = () => {
    switch (stage) {
      case 'discovery': return 'Découverte';
      case 'level1': return 'Niveau 1';
      case 'level2': return 'Niveau 2';
      case 'level3': return 'Niveau 3';
      default: return 'Entraînement';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-purple-600 mb-2">
          Retapez la phrase
        </h2>
        <p className="text-gray-600">
          Phrase {phraseNumber}/{totalPhrases} • {getStageLabel()}
        </p>
      </div>

      {/* Zone de saisie */}
      <PhraseInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder="Tapez la phrase que vous avez vue..."
        disabled={disabled || isLoading}
        variant="game"
        size="lg"
        maxLength={200}
        showCharCount={true}
        className="mb-4"
      />

      {/* Conseils */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-lg">
          <span>💡</span>
          <span>Prenez votre temps et tapez ce dont vous vous souvenez</span>
        </div>
      </div>
    </div>
  );
}

// Composant pour la saisie de phrases personnalisées
interface CustomPhraseInputProps {
  phrases: string[];
  onChange: (phrases: string[]) => void;
  minPhrases?: number;
  maxPhrases?: number;
  placeholder?: string;
  className?: string;
}

export function CustomPhraseInput({
  phrases,
  onChange,
  minPhrases = 3,
  maxPhrases = 10,
  placeholder = "Tapez votre phrase...",
  className = ''
}: CustomPhraseInputProps) {
  const addPhrase = () => {
    if (phrases.length < maxPhrases) {
      onChange([...phrases, '']);
    }
  };

  const removePhrase = (index: number) => {
    if (phrases.length > minPhrases) {
      onChange(phrases.filter((_, i) => i !== index));
    }
  };

  const updatePhrase = (index: number, value: string) => {
    const newPhrases = [...phrases];
    newPhrases[index] = value;
    onChange(newPhrases);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Vos phrases ({phrases.filter(p => p.trim()).length}/{maxPhrases})
        </h3>
        {phrases.length < maxPhrases && (
          <button
            onClick={addPhrase}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1"
          >
            <span>+</span>
            <span>Ajouter</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {phrases.map((phrase, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <PhraseInput
                value={phrase}
                onChange={(value) => updatePhrase(index, value)}
                onSubmit={() => {}}
                placeholder={`${placeholder} ${index + 1}`}
                size="sm"
                variant="minimal"
                maxLength={200}
                showCharCount={true}
                showSubmitShortcut={false}
              />
            </div>
            {phrases.length > minPhrases && (
              <button
                onClick={() => removePhrase(index)}
                className="flex-shrink-0 w-10 h-10 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {phrases.filter(p => p.trim()).length < minPhrases && (
        <div className="text-sm text-orange-600">
          Minimum {minPhrases} phrases requises
        </div>
      )}
    </div>
  );
}