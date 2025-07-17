// components/SubPartTemplate/SubPartStatusMessage.tsx

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SubPartStatusMessageProps {
  error: string | null;
  success: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
}

const SubPartStatusMessage: React.FC<SubPartStatusMessageProps> = ({
  error,
  success,
  onClearError,
  onClearSuccess
}) => {
  return (
    <div className="space-y-4">
      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span className="flex-1">{error}</span>
          <button 
            onClick={onClearError}
            className="ml-auto text-red-500 hover:text-red-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Message de succès */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          <span className="flex-1">{success}</span>
          <button 
            onClick={onClearSuccess}
            className="ml-auto text-green-500 hover:text-green-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default SubPartStatusMessage;