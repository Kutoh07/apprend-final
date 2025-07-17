
// components/SubPartTemplate/SubPartDebugPanel.tsx

import React from 'react';
import { Zap, RefreshCw } from 'lucide-react';

interface PerformanceStats {
  lastOperationTime: number;
  totalOperations: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

interface SubPartDebugPanelProps {
  userId: string | null;
  userEmail: string | null;
  performanceStats: PerformanceStats;
  cacheStats: CacheStats;
  isUpdating: boolean;
  onForceRefresh: () => void;
}

const SubPartDebugPanel: React.FC<SubPartDebugPanelProps> = ({
  userId,
  userEmail,
  performanceStats,
  cacheStats,
  isUpdating,
  onForceRefresh
}) => {
  // Ne s'affiche qu'en développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Panel de debug principal 
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-700 mb-2">🔧 Debug & Performance</h4>
        <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
          <div>
            <div><strong>Performance:</strong> {Math.round(performanceStats.lastOperationTime)}ms</div>
            <div><strong>Cache hits:</strong> {cacheStats.hits}</div>
            <div><strong>Cache hit rate:</strong> {cacheStats.hitRate.toFixed(1)}%</div>
          </div>
          <div>
            <div><strong>User ID:</strong> {userId?.substring(0, 8)}...</div>
            <div><strong>Email:</strong> {userEmail}</div>
            <div><strong>Total ops:</strong> {performanceStats.totalOperations}</div>
          </div>
        </div>
      </div>*/}

      {/* Indicateur de performance en temps réel 
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="text-green-500 mr-2" size={16} />
            <span className="text-green-800 font-medium">
              Mode ultra-performance activé
            </span>
            <span className="ml-2 text-sm text-green-600">
              ({Math.round(performanceStats.lastOperationTime)}ms dernière opération)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600">
              Cache: {cacheStats.hitRate.toFixed(0)}%
            </span>
            <button 
              onClick={onForceRefresh}
              disabled={isUpdating}
              className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm disabled:opacity-50 px-2 py-1 rounded border border-green-300 hover:bg-green-100 transition-colors"
            >
              <RefreshCw size={12} className={isUpdating ? 'animate-spin' : ''} />
              {isUpdating ? 'Refresh...' : 'Force Refresh'}
            </button>
          </div>
        </div>
      </div> */}

      {/* Statistiques détaillées 
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-bold text-gray-700 mb-3">📊 Statistiques de performance en temps réel</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg">
            <div className="font-semibold text-gray-600">Cache</div>
            <div className="text-lg font-bold text-blue-600">
              {cacheStats.hitRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Hit rate</div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="font-semibold text-gray-600">Dernière op.</div>
            <div className="text-lg font-bold text-green-600">
              {Math.round(performanceStats.lastOperationTime)}ms
            </div>
            <div className="text-xs text-gray-500">Temps d'exécution</div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="font-semibold text-gray-600">Total ops</div>
            <div className="text-lg font-bold text-purple-600">
              {performanceStats.totalOperations}
            </div>
            <div className="text-xs text-gray-500">Depuis le chargement</div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="font-semibold text-gray-600">Optimisations</div>
            <div className="text-sm font-bold text-orange-600">5/5</div>
            <div className="text-xs text-gray-500">Actives</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          <strong>Optimisations actives :</strong> Cache intelligent • Debounce/Throttle • Batch processing • Requêtes parallèles • Calculs en mémoire
        </div>
      </div> */}

      {/* Informations sur la correction appliquée */}
    </div>
  );
};

export default SubPartDebugPanel;