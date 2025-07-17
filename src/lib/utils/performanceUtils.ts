// src/lib/utils/performanceUtils.ts - PERFORMANCE MONITORING & OPTIMIZATION

import React from 'react';

/**
 * 🚀 Utilitaires de performance et monitoring
 * Applique les principes DRY et de réutilisabilité
 */

// 🔥 Types pour le monitoring
interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// 🔥 Singleton pour le monitoring de performance
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Limite pour éviter la surcharge mémoire

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 🎯 Décorateur pour mesurer automatiquement les performances
   */
  static measurePerformance<T extends (...args: any[]) => Promise<any>>(
    operation: string,
    fn: T
  ): T {
    return (async (...args: Parameters<T>) => {
      const startTime = performance.now();
      
      try {
        const result = await fn(...args);
        const duration = performance.now() - startTime;
        
        PerformanceMonitor.getInstance().recordMetric({
          operation,
          duration,
          timestamp: Date.now(),
          metadata: { success: true, argsCount: args.length }
        });

        // Alerte si trop lent
        if (duration > 200) {
          console.warn(`⚠️ Opération lente détectée: ${operation} (${Math.round(duration)}ms)`);
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        PerformanceMonitor.getInstance().recordMetric({
          operation,
          duration,
          timestamp: Date.now(),
          metadata: { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        });

        throw error;
      }
    }) as T;
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Nettoyer les anciennes métriques
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getAverageTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  getSlowOperations(threshold: number = 200): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  generateReport(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: number;
    operationStats: Record<string, { count: number; avgDuration: number }>;
  } {
    const totalOperations = this.metrics.length;
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0;
    const slowOperations = this.getSlowOperations().length;

    // Statistiques par opération
    const operationStats: Record<string, { count: number; avgDuration: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!operationStats[metric.operation]) {
        operationStats[metric.operation] = { count: 0, avgDuration: 0 };
      }
      operationStats[metric.operation].count++;
    });

    Object.keys(operationStats).forEach(operation => {
      operationStats[operation].avgDuration = this.getAverageTime(operation);
    });

    return {
      totalOperations,
      averageDuration,
      slowOperations,
      operationStats
    };
  }
}

// 🔥 Cache intelligent avec métriques
export class IntelligentCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; accessCount: number }>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  
  constructor(
    private readonly name: string,
    private readonly ttl: number = 10000, // 10 secondes par défaut
    private readonly maxSize: number = 100
  ) {}

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item || Date.now() - item.timestamp > this.ttl) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    item.accessCount++;
    this.stats.hits++;
    this.updateHitRate();
    
    console.log(`🎯 Cache HIT pour ${this.name}:${key}`);
    return item.data;
  }

  set(key: string, data: T): void {
    // Nettoyage si le cache est plein
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    });

    this.stats.size = this.cache.size;
    console.log(`💾 Cache SET pour ${this.name}:${key}`);
  }

  invalidate(key: string): void {
    if (this.cache.delete(key)) {
      this.stats.size = this.cache.size;
      console.log(`🗑️ Cache INVALIDATE pour ${this.name}:${key}`);
    }
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
    console.log(`🧹 Cache CLEAR pour ${this.name}`);
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedCount = Infinity;

    this.cache.forEach((value, key) => {
      if (value.accessCount < leastUsedCount) {
        leastUsedCount = value.accessCount;
        leastUsedKey = key;
      }
    });

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      console.log(`🗑️ Cache EVICT (LRU) pour ${this.name}:${leastUsedKey}`);
    }
  }
}

// 🔥 Debounce pour éviter les appels trop fréquents
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

// 🔥 Throttle pour limiter la fréquence d'exécution
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 🔥 Batch processor pour optimiser les opérations multiples
export class BatchProcessor<T> {
  private batch: T[] = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly processFn: (items: T[]) => Promise<void>,
    private readonly batchSize: number = 10,
    private readonly maxWait: number = 1000
  ) {}

  add(item: T): void {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.processBatch(), this.maxWait);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batch.length === 0) return;

    const itemsToProcess = [...this.batch];
    this.batch = [];
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    try {
      await this.processFn(itemsToProcess);
      console.log(`📦 Batch processed: ${itemsToProcess.length} items`);
    } catch (error) {
      console.error('💥 Batch processing error:', error);
      // Optionnel: remettre les éléments dans la queue
    }
  }

  async flush(): Promise<void> {
    await this.processBatch();
  }
}

// 🔥 Hook React pour monitoring des performances
export function usePerformanceMonitoring(componentName: string) {
  const startTime = React.useRef<number>(performance.now());
  
  React.useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    
    PerformanceMonitor.getInstance().recordMetric({
      operation: `React.${componentName}.render`,
      duration: renderTime,
      timestamp: Date.now(),
      metadata: { type: 'component-render' }
    });

    return () => {
      const unmountTime = performance.now() - startTime.current;
      PerformanceMonitor.getInstance().recordMetric({
        operation: `React.${componentName}.lifecycle`,
        duration: unmountTime,
        timestamp: Date.now(),
        metadata: { type: 'component-lifecycle' }
      });
    };
  }, [componentName]);
}

// 🔥 Gestionnaire d'erreurs avec retry intelligent
export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          console.error(`💥 Operation failed after ${maxRetries + 1} attempts:`, lastError);
          throw lastError;
        }

        const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// 🔥 Export des instances globales
export const performanceMonitor = PerformanceMonitor.getInstance();

// 🔥 Configuration pour le développement
if (process.env.NODE_ENV === 'development') {
  // Rapport de performance toutes les 30 secondes
  setInterval(() => {
    const report = performanceMonitor.generateReport();
    if (report.totalOperations > 0) {
      console.group('📊 Performance Report');
      console.log('Total operations:', report.totalOperations);
      console.log('Average duration:', Math.round(report.averageDuration), 'ms');
      console.log('Slow operations:', report.slowOperations);
      console.log('Operation stats:', report.operationStats);
      console.groupEnd();
    }
  }, 30000);
}