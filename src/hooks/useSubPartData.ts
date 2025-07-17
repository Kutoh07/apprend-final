// hooks/useSubPartData.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { programmeSupabaseService } from '@/lib/programmeSupabaseService';
import { ModuleService } from '@/lib/moduleService';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG } from '@/lib/types/programme';
import { supabase } from '@/lib/supabase';
import { usePerformanceTracker } from './usePerformanceTracker';
import { useComponentCache } from './useComponentCache';

// 🔥 Types pour le hook
interface SubPartState {
  programmeData: ProgrammeData | null;
  currentSubPart: SubPart | null;
  userId: string | null;
  userEmail: string | null;
  loading: boolean;
  updating: boolean;
  canAccessNext: boolean;
}

interface UIState {
  newValue: string;
  error: string | null;
  success: string | null;
}

// 🔥 Utilitaires pour debounce et throttle
function debounce<T extends (...args: any[]) => Promise<void>>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

function throttle<T extends (...args: any[]) => Promise<void>>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// 🔥 Hook principal pour la gestion des données SubPart
export function useSubPartData(subPartId: number) {
  const router = useRouter();
  const { measurePerformance, getStats } = usePerformanceTracker();
  const cache = useComponentCache<any>('SubPartData', 15000, 50);

  // États
  const [state, setState] = useState<SubPartState>({
    programmeData: null,
    currentSubPart: null,
    userId: null,
    userEmail: null,
    loading: true,
    updating: false,
    canAccessNext: false
  });

  const [ui, setUI] = useState<UIState>({
    newValue: '',
    error: null,
    success: null
  });

  // Configuration du module
  const subPartConfig = useMemo(() => 
    SUBPARTS_CONFIG.find(config => config.id === subPartId),
    [subPartId]
  );

  // Données calculées
  const canAddMore = useMemo(() => 
    !state.currentSubPart?.maxFields || 
    (state.currentSubPart.fields.length < state.currentSubPart.maxFields),
    [state.currentSubPart?.fields.length, state.currentSubPart?.maxFields]
  );

  const meetsMinimum = useMemo(() => 
    state.currentSubPart ? 
    state.currentSubPart.fields.length >= (state.currentSubPart.minFields || 1) : false,
    [state.currentSubPart?.fields.length, state.currentSubPart?.minFields]
  );

  // 🔥 Fonction de chargement optimisée
  const loadData = useCallback(
    measurePerformance('useSubPartData.loadData', async () => {
      try {
        // Vérifier le cache
        const cacheKey = `user-${state.userId}-subpart-${subPartId}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData && state.userId) {
          setState(prev => ({ ...prev, ...cachedData, loading: false }));
          return;
        }

        // Authentification
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          router.push('/auth');
          return;
        }

        const supabaseUserId = session.user.id;
        const supabaseUserEmail = session.user.email || 'Email non disponible';

        // Vérification d'accès
        const canAccess = await ModuleService.canAccessModule(supabaseUserId, subPartId);
        if (!canAccess) {
          router.push('/programme');
          return;
        }

        // Chargement parallèle
        const [programme, nextCanAccess] = await Promise.all([
          programmeSupabaseService.getProgramme(supabaseUserId),
          ModuleService.canAccessModule(supabaseUserId, subPartId + 1)
        ]);

        if (programme) {
          const subPart = programme.subParts.find(sp => sp.id === subPartId);
          const newState = {
            programmeData: programme,
            currentSubPart: subPart || null,
            userId: supabaseUserId,
            userEmail: supabaseUserEmail,
            loading: false,
            updating: false,
            canAccessNext: nextCanAccess || (subPart?.progress || 0) >= 100
          };

          setState(newState);

          // Mise en cache
          cache.set(cacheKey, {
            programmeData: programme,
            currentSubPart: subPart,
            canAccessNext: nextCanAccess || (subPart?.progress || 0) >= 100
          });
        }

      } catch (err) {
        console.error('💥 Erreur loadData:', err);
        setUI(prev => ({ ...prev, error: 'Erreur lors du chargement des données' }));
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    }),
    [subPartId, state.userId, router, measurePerformance, cache]
  );

  // 🔥 Rechargement avec invalidation de cache
  const reloadData = useCallback(
    measurePerformance('useSubPartData.reloadData', async () => {
      if (!state.userId) return;

      try {
        const cacheKey = `user-${state.userId}-subpart-${subPartId}`;
        cache.invalidate(cacheKey);

        const [programme, nextCanAccess] = await Promise.all([
          programmeSupabaseService.getProgramme(state.userId),
          ModuleService.canAccessModule(state.userId, subPartId + 1)
        ]);

        if (programme) {
          const subPart = programme.subParts.find(sp => sp.id === subPartId);
          
          setState(prev => ({
            ...prev,
            programmeData: programme,
            currentSubPart: subPart || null,
            canAccessNext: nextCanAccess || (subPart?.progress || 0) >= 100
          }));

          cache.set(cacheKey, {
            programmeData: programme,
            currentSubPart: subPart,
            canAccessNext: nextCanAccess || (subPart?.progress || 0) >= 100
          });
        }
      } catch (err) {
        console.error('💥 Erreur reloadData:', err);
        setUI(prev => ({ ...prev, error: 'Erreur lors du rechargement' }));
      }
    }),
    [state.userId, subPartId, measurePerformance, cache]
  );

  // 🔥 Fonctions d'action optimisées
  const addFieldAction = useMemo(
    () => debounce(
      measurePerformance('useSubPartData.addField', async () => {
        if (!ui.newValue.trim() || !state.userId || !state.currentSubPart) return;

        setState(prev => ({ ...prev, updating: true }));
        setUI(prev => ({ ...prev, error: null, success: null }));

        const startTime = performance.now();

        try {
          await programmeSupabaseService.addField(state.userId!, subPartId, ui.newValue);
          await reloadData();
          
          const duration = performance.now() - startTime;
          
          setUI(prev => ({ 
            ...prev, 
            newValue: '',
            success: `✅ Entrée ajoutée en ${Math.round(duration)}ms ! Progressions recalculées.`
          }));
          
          setTimeout(() => setUI(prev => ({ ...prev, success: null })), 3000);
        } catch (err: any) {
          setUI(prev => ({ ...prev, error: err.message || 'Erreur lors de l\'ajout' }));
        } finally {
          setState(prev => ({ ...prev, updating: false }));
        }
      }),
      300
    ),
    [ui.newValue, state.userId, state.currentSubPart, subPartId, reloadData, measurePerformance]
  );

  const updateFieldAction = useMemo(
    () => throttle(
      measurePerformance('useSubPartData.updateField', async (fieldId: string, newValue: string) => {
        if (!state.userId) return;

        const startTime = performance.now();

        try {
          await programmeSupabaseService.updateField(state.userId!, fieldId, newValue);
          await reloadData();
          
          const duration = performance.now() - startTime;
          
          setUI(prev => ({ 
            ...prev, 
            success: `✅ Mise à jour en ${Math.round(duration)}ms ! Progressions recalculées.`
          }));
          
          setTimeout(() => setUI(prev => ({ ...prev, success: null })), 2000);
        } catch (err: any) {
          setUI(prev => ({ ...prev, error: err.message || 'Erreur lors de la mise à jour' }));
        }
      }),
      500
    ),
    [state.userId, reloadData, measurePerformance]
  );

  const deleteFieldAction = useMemo(
    () => measurePerformance('useSubPartData.deleteField', async (fieldId: string) => {
      if (!state.userId) return;

      setState(prev => ({ ...prev, updating: true }));
      const startTime = performance.now();

      try {
        await programmeSupabaseService.removeField(state.userId!, fieldId, subPartId);
        await reloadData();
        
        const duration = performance.now() - startTime;
        
        setUI(prev => ({ 
          ...prev, 
          success: `✅ Suppression en ${Math.round(duration)}ms ! Progressions recalculées.`
        }));
        
        setTimeout(() => setUI(prev => ({ ...prev, success: null })), 2000);
      } catch (err: any) {
        setUI(prev => ({ ...prev, error: err.message || 'Erreur lors de la suppression' }));
      } finally {
        setState(prev => ({ ...prev, updating: false }));
      }
    }),
    [state.userId, subPartId, reloadData, measurePerformance]
  );

  const saveAction = useMemo(
    () => measurePerformance('useSubPartData.save', async () => {
      if (!state.programmeData) return;

      setState(prev => ({ ...prev, updating: true }));
      const startTime = performance.now();

      try {
        await programmeSupabaseService.saveProgramme(state.programmeData);
        await reloadData();
        
        const duration = performance.now() - startTime;
        
        setUI(prev => ({ 
          ...prev, 
          success: `✅ Sauvegarde en ${Math.round(duration)}ms ! Progressions recalculées.`
        }));
        
        setTimeout(() => setUI(prev => ({ ...prev, success: null })), 2000);
      } catch (err: any) {
        setUI(prev => ({ ...prev, error: err.message || 'Erreur lors de la sauvegarde' }));
      } finally {
        setState(prev => ({ ...prev, updating: false }));
      }
    }),
    [state.programmeData, reloadData, measurePerformance]
  );

  // 🔥 Actions avec wrappers
  const handleAddField = useCallback(() => {
    addFieldAction();
  }, [addFieldAction]);

  const handleUpdateField = useCallback((fieldId: string, newValue: string) => {
    updateFieldAction(fieldId, newValue);
  }, [updateFieldAction]);

  const handleDeleteField = useCallback((fieldId: string) => {
    deleteFieldAction(fieldId);
  }, [deleteFieldAction]);

  const handleSave = useCallback(() => {
    saveAction();
  }, [saveAction]);

  const handleProgressUpdate = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      currentSubPart: prev.currentSubPart ? { ...prev.currentSubPart, progress } : null
    }));
  }, []);

  const forceRefresh = useCallback(async () => {
    if (!state.userId) return;
    
    setState(prev => ({ ...prev, updating: true }));
    
    try {
      cache.invalidate(`user-${state.userId}-subpart-${subPartId}`);
      await ModuleService.recalculateAllModulesProgress(state.userId);
      await reloadData();
      
      setUI(prev => ({ 
        ...prev, 
        success: '🔄 Refresh complet effectué ! Tous les caches invalidés.' 
      }));
      
      setTimeout(() => setUI(prev => ({ ...prev, success: null })), 2000);
    } catch (err: any) {
      setUI(prev => ({ ...prev, error: 'Erreur lors du refresh' }));
    } finally {
      setState(prev => ({ ...prev, updating: false }));
    }
  }, [state.userId, subPartId, cache, reloadData]);

  // Setters pour UI
  const setNewValue = useCallback((value: string) => {
    setUI(prev => ({ ...prev, newValue: value }));
  }, []);

  const clearError = useCallback(() => {
    setUI(prev => ({ ...prev, error: null }));
  }, []);

  const clearSuccess = useCallback(() => {
    setUI(prev => ({ ...prev, success: null }));
  }, []);

  // Effet de chargement initial
  useEffect(() => {
    loadData();
  }, [subPartId]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (state.userId) {
        cache.invalidate(`user-${state.userId}-subpart-${subPartId}`);
      }
    };
  }, [state.userId, subPartId, cache]);

  return {
    // État
    ...state,
    ...ui,
    
    // Données calculées
    subPartConfig,
    canAddMore,
    meetsMinimum,
    
    // Actions
    handleAddField,
    handleUpdateField,
    handleDeleteField,
    handleSave,
    handleProgressUpdate,
    forceRefresh,
    
    // Setters UI
    setNewValue,
    clearError,
    clearSuccess,
    
    // Performance
    performanceStats: getStats(),
    cacheStats: cache.getStats()
  };
}
