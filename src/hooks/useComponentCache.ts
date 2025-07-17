// hooks/useComponentCache.ts

import { useCallback, useRef } from 'react';

// 🔥 Types pour le cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// 🔥 Hook pour le cache intelligent
export function useComponentCache<T>(
  name: string,
  ttl: number = 15000, // 15 secondes par défaut
  maxSize: number = 50
) {
  const cacheRef = useRef(new Map<string, CacheItem<T>>());
  const statsRef = useRef<CacheStats>({ hits: 0, misses: 0, size: 0, hitRate: 0 });

  const updateHitRate = useCallback(() => {
    const total = statsRef.current.hits + statsRef.current.misses;
    statsRef.current.hitRate = total > 0 ? (statsRef.current.hits / total) * 100 : 0;
  }, []);

  const evictLeastUsed = useCallback(() => {
    let leastUsedKey = '';
    let leastUsedCount = Infinity;

    cacheRef.current.forEach((value, key) => {
      if (value.accessCount < leastUsedCount) {
        leastUsedCount = value.accessCount;
        leastUsedKey = key;
      }
    });

    if (leastUsedKey) {
      cacheRef.current.delete(leastUsedKey);
      console.log(`🗑️ Cache EVICT (LRU) pour ${name}:${leastUsedKey}`);
    }
  }, [name]);

  const get = useCallback((key: string): T | null => {
    const item = cacheRef.current.get(key);
    
    if (!item || Date.now() - item.timestamp > ttl) {
      statsRef.current.misses++;
      updateHitRate();
      return null;
    }

    item.accessCount++;
    statsRef.current.hits++;
    updateHitRate();
    
    console.log(`🎯 Cache HIT pour ${name}:${key}`);
    return item.data;
  }, [name, ttl, updateHitRate]);

  const set = useCallback((key: string, data: T): void => {
    // Nettoyage si le cache est plein
    if (cacheRef.current.size >= maxSize) {
      evictLeastUsed();
    }

    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    });

    statsRef.current.size = cacheRef.current.size;
    console.log(`💾 Cache SET pour ${name}:${key}`);
  }, [name, maxSize, evictLeastUsed]);

  const invalidate = useCallback((key: string): void => {
    if (cacheRef.current.delete(key)) {
      statsRef.current.size = cacheRef.current.size;
      console.log(`🗑️ Cache INVALIDATE pour ${name}:${key}`);
    }
  }, [name]);

  const clear = useCallback((): void => {
    cacheRef.current.clear();
    statsRef.current = { hits: 0, misses: 0, size: 0, hitRate: 0 };
    console.log(`🧹 Cache CLEAR pour ${name}`);
  }, [name]);

  const getStats = useCallback((): CacheStats => {
    return { ...statsRef.current };
  }, []);

  return {
    get,
    set,
    invalidate,
    clear,
    getStats
  };
}
