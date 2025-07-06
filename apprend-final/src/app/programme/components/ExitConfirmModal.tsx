// app/programme/components/ExitConfirmModal.tsx

import { AlertCircle } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onSaveAndExit?: () => void;
}

export function ExitConfirmModal({ isOpen, onConfirm, onCancel, onSaveAndExit }: ExitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-orange-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800">Modifications non sauvegardées</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Tu as des modifications non sauvegardées. Veux-tu vraiment quitter ?
        </p>
        <div className="flex gap-3">
          {onSaveAndExit && (
            <button
              onClick={onSaveAndExit}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors"
            >
              Sauvegarder et quitter
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors"
          >
            Quitter sans sauvegarder
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}