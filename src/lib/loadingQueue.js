/**
 * Loading Queue System for Optimistic UI and Performance
 * Manages async operations with debouncing and parallel processing
 */

// Global loading state management
const loadingStates = new Map();
const debounceTimers = new Map();
const DEBOUNCE_DELAY = 500; // 500ms debounce

/**
 * Loading queue for managing multiple async operations
 */
class LoadingQueue {
  constructor() {
    this.queue = new Map();
    this.processing = new Set();
    this.results = new Map();
  }

  /**
   * Add operation to queue with debouncing
   */
  async addOperation(key, operation, options = {}) {
    const { debounce = true, priority = "normal" } = options;

    // Clear existing debounce timer
    if (debounce && debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
    }

    const executeOperation = async () => {
      try {
        // Mark as processing
        this.processing.add(key);
        loadingStates.set(key, { status: "loading", startTime: Date.now() });

        // Execute operation
        const result = await operation();
        
        // Store result
        this.results.set(key, {
          data: result,
          timestamp: Date.now(),
          status: "success"
        });

        loadingStates.set(key, { 
          status: "success", 
          duration: Date.now() - loadingStates.get(key).startTime 
        });

        return result;
      } catch (error) {
        // Store error
        this.results.set(key, {
          error,
          timestamp: Date.now(),
          status: "error"
        });

        loadingStates.set(key, { 
          status: "error", 
          error: error.message,
          duration: Date.now() - loadingStates.get(key).startTime 
        });

        throw error;
      } finally {
        // Remove from processing
        this.processing.delete(key);
        debounceTimers.delete(key);
      }
    };

    if (debounce) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(async () => {
          try {
            const result = await executeOperation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, DEBOUNCE_DELAY);

        debounceTimers.set(key, timer);
      });
    } else {
      return executeOperation();
    }
  }

  /**
   * Check if operation is in progress
   */
  isProcessing(key) {
    return this.processing.has(key);
  }

  /**
   * Get cached result
   */
  getResult(key) {
    return this.results.get(key);
  }

  /**
   * Get loading state
   */
  getLoadingState(key) {
    return loadingStates.get(key);
  }

  /**
   * Clear operation from queue
   */
  clear(key) {
    this.processing.delete(key);
    this.results.delete(key);
    loadingStates.delete(key);
    
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
      debounceTimers.delete(key);
    }
  }

  /**
   * Process multiple operations in parallel
   */
  async processParallel(operations) {
    const promises = operations.map(({ key, operation, options }) => 
      this.addOperation(key, operation, { ...options, debounce: false })
    );

    return Promise.allSettled(promises);
  }
}

// Global loading queue instance
export const globalLoadingQueue = new LoadingQueue();

/**
 * React hook for loading queue integration
 */
export function useLoadingQueue() {
  const [loadingStates, setLoadingStates] = useState(new Map());

  const addOperation = useCallback(async (key, operation, options = {}) => {
    try {
      // Update local state
      setLoadingStates(prev => new Map(prev.set(key, { status: "loading" })));
      
      const result = await globalLoadingQueue.addOperation(key, operation, options);
      
      // Update success state
      setLoadingStates(prev => new Map(prev.set(key, { status: "success" })));
      
      return result;
    } catch (error) {
      // Update error state
      setLoadingStates(prev => new Map(prev.set(key, { status: "error", error: error.message })));
      throw error;
    }
  }, []);

  const getLoadingState = useCallback((key) => {
    return loadingStates.get(key) || globalLoadingQueue.getLoadingState(key);
  }, [loadingStates]);

  const isLoading = useCallback((key) => {
    const state = getLoadingState(key);
    return state?.status === "loading";
  }, [getLoadingState]);

  const clearOperation = useCallback((key) => {
    globalLoadingQueue.clear(key);
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  return {
    addOperation,
    getLoadingState,
    isLoading,
    clearOperation,
    processParallel: globalLoadingQueue.processParallel.bind(globalLoadingQueue)
  };
}

/**
 * Optimistic UI helper for immediate feedback
 */
export function createOptimisticUpdate(key, optimisticData) {
  // Store optimistic data
  globalLoadingQueue.results.set(key, {
    data: optimisticData,
    timestamp: Date.now(),
    status: "optimistic"
  });

  loadingStates.set(key, { status: "optimistic" });
}

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  startTimer: (key) => {
    const startTime = Date.now();
    loadingStates.set(`timer_${key}`, { startTime });
    return startTime;
  },

  endTimer: (key) => {
    const timerState = loadingStates.get(`timer_${key}`);
    if (timerState) {
      const duration = Date.now() - timerState.startTime;
      console.log(`[Performance] ${key}: ${duration}ms`);
      loadingStates.delete(`timer_${key}`);
      return duration;
    }
    return 0;
  },

  logSlowOperations: (threshold = 5000) => {
    for (const [key, state] of loadingStates.entries()) {
      if (state.duration && state.duration > threshold) {
        console.warn(`[Performance] Slow operation detected: ${key} took ${state.duration}ms`);
      }
    }
  }
};

/**
 * Batch processing for multiple API calls
 */
export async function batchProcess(operations, batchSize = 3) {
  const results = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(op => globalLoadingQueue.addOperation(op.key, op.operation, op.options))
    );
    results.push(...batchResults);
  }
  
  return results;
}

export default globalLoadingQueue;
