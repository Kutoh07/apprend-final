// hooks/usePerformanceTracker.ts

import { useCallback, useRef } from 'react';

// 🔥 Types pour le monitoring
interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  lastOperationTime: number;
  totalOperations: number;
  averageTime: number;
  slowOperationsCount: number;
}

// 🔥 Hook pour tracker les performances
export function usePerformanceTracker() {
  const metricsRef = useRef<PerformanceMetric[]>([]);
  const statsRef = useRef<PerformanceStats>({
    lastOperationTime: 0,
    totalOperations: 0,
    averageTime: 0,
    slowOperationsCount: 0
  });

  const recordMetric = useCallback((metric: PerformanceMetric) => {
    metricsRef.current.push(metric);
    
    // Garder seulement les 100 dernières métriques
    if (metricsRef.current.length > 100) {
      metricsRef.current = metricsRef.current.slice(-100);
    }

    // Mettre à jour les stats
    const totalTime = metricsRef.current.reduce((sum, m) => sum + m.duration, 0);
    const slowOps = metricsRef.current.filter(m => m.duration > 200).length;

    statsRef.current = {
      lastOperationTime: metric.duration,
      totalOperations: metricsRef.current.length,
      averageTime: totalTime / metricsRef.current.length,
      slowOperationsCount: slowOps
    };

    // Log des opérations lentes
    if (metric.duration > 200) {
      console.warn(`⚠️ Opération lente: ${metric.operation} (${Math.round(metric.duration)}ms)`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${metric.operation}: ${Math.round(metric.duration)}ms`);
    }
  }, []);

  const measurePerformance = useCallback(<T extends (...args: any[]) => Promise<any>>(
    operation: string,
    fn: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      const startTime = performance.now();
      
      try {
        const result = await fn(...args);
        const duration = performance.now() - startTime;
        
        recordMetric({
          operation,
          duration,
          timestamp: Date.now(),
          success: true,
          metadata: { argsCount: args.length }
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        recordMetric({
          operation,
          duration,
          timestamp: Date.now(),
          success: false,
          metadata: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            argsCount: args.length 
          }
        });

        throw error;
      }
    }) as T;
  }, [recordMetric]);

  const getStats = useCallback((): PerformanceStats => {
    return { ...statsRef.current };
  }, []);

  const getAverageTime = useCallback((operation: string): number => {
    const operationMetrics = metricsRef.current.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }, []);

  const getSlowOperations = useCallback((threshold: number = 200): PerformanceMetric[] => {
    return metricsRef.current.filter(m => m.duration > threshold);
  }, []);

  return {
    measurePerformance,
    recordMetric,
    getStats,
    getAverageTime,
    getSlowOperations
  };
}
