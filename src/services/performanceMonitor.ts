// Performance monitoring service for drug detection system
export interface PerformanceMetrics {
  processingTime: number;
  modelLoadTime: number;
  memoryUsage: number;
  accuracy: number;
  throughput: number;
  errorRate: number;
}

export interface AnalysisEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  imageSize: number;
  processingTime: number;
  modelStatus: {
    mobilenet: boolean;
    cocoSsd: boolean;
    tesseract: boolean;
  };
  result: {
    success: boolean;
    confidence: number;
    status: string;
    method: string;
  };
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  models: {
    mobilenet: boolean;
    cocoSsd: boolean;
    tesseract: boolean;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    averageProcessingTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  uptime: number;
}

class PerformanceMonitor {
  private events: AnalysisEvent[] = [];
  private startTime: Date = new Date();
  private maxEvents: number = 1000; // Keep last 1000 events
  
  // Performance tracking
  private processingTimes: number[] = [];
  private errorCount: number = 0;
  private totalRequests: number = 0;
  
  // Memory tracking
  private memorySnapshots: Array<{ timestamp: Date; usage: number }> = [];

  /**
   * Record an analysis event
   */
  recordEvent(event: Omit<AnalysisEvent, 'id' | 'timestamp'>): void {
    const analysisEvent: AnalysisEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.events.push(analysisEvent);
    this.totalRequests++;
    
    // Track processing time
    this.processingTimes.push(event.processingTime);
    
    // Track errors
    if (!event.result.success || event.errors?.length) {
      this.errorCount++;
    }
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Keep only recent processing times
    if (this.processingTimes.length > 100) {
      this.processingTimes = this.processingTimes.slice(-100);
    }
    
    // Log event for monitoring
    this.logEvent(analysisEvent);
  }

  /**
   * Record memory usage snapshot
   */
  recordMemoryUsage(usage: number): void {
    this.memorySnapshots.push({
      timestamp: new Date(),
      usage
    });
    
    // Keep only recent snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100);
    }
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();
    
    // Calculate average processing time
    const averageProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
      : 0;
    
    // Calculate requests per minute (last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp > fiveMinutesAgo);
    const requestsPerMinute = recentEvents.length / 5;
    
    // Calculate error rate
    const errorRate = this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0;
    
    // Get latest memory usage
    const latestMemory = this.memorySnapshots.length > 0 
      ? this.memorySnapshots[this.memorySnapshots.length - 1].usage 
      : 0;
    
    return {
      models: {
        mobilenet: this.getModelStatus('mobilenet'),
        cocoSsd: this.getModelStatus('cocoSsd'),
        tesseract: this.getModelStatus('tesseract')
      },
      memory: {
        used: latestMemory,
        total: this.getTotalMemory(),
        percentage: this.getTotalMemory() > 0 ? (latestMemory / this.getTotalMemory()) * 100 : 0
      },
      performance: {
        averageProcessingTime,
        requestsPerMinute,
        errorRate
      },
      uptime
    };
  }

  /**
   * Get performance metrics for a time range
   */
  getMetrics(startTime: Date, endTime: Date): PerformanceMetrics {
    const eventsInRange = this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
    
    if (eventsInRange.length === 0) {
      return {
        processingTime: 0,
        modelLoadTime: 0,
        memoryUsage: 0,
        accuracy: 0,
        throughput: 0,
        errorRate: 0
      };
    }
    
    const processingTimes = eventsInRange.map(e => e.processingTime);
    const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    
    const successfulEvents = eventsInRange.filter(e => e.result.success);
    const accuracy = eventsInRange.length > 0 ? successfulEvents.length / eventsInRange.length : 0;
    
    const timeRangeMs = endTime.getTime() - startTime.getTime();
    const throughput = timeRangeMs > 0 ? (eventsInRange.length / timeRangeMs) * 1000 : 0;
    
    const errors = eventsInRange.filter(e => !e.result.success || e.errors?.length);
    const errorRate = eventsInRange.length > 0 ? errors.length / eventsInRange.length : 0;
    
    // Get average memory usage for the time range
    const memorySnapshotsInRange = this.memorySnapshots.filter(snapshot => 
      snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );
    const averageMemoryUsage = memorySnapshotsInRange.length > 0
      ? memorySnapshotsInRange.reduce((sum, snapshot) => sum + snapshot.usage, 0) / memorySnapshotsInRange.length
      : 0;
    
    return {
      processingTime: averageProcessingTime,
      modelLoadTime: 0, // Not currently tracked
      memoryUsage: averageMemoryUsage,
      accuracy,
      throughput,
      errorRate
    };
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents(limit: number = 10): AnalysisEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Get error events for debugging
   */
  getErrorEvents(limit: number = 10): AnalysisEvent[] {
    return this.events
      .filter(event => !event.result.success || event.errors?.length)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear old events to free memory
   */
  clearOldEvents(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - maxAgeMs);
    this.events = this.events.filter(event => event.timestamp > cutoffTime);
    this.memorySnapshots = this.memorySnapshots.filter(snapshot => snapshot.timestamp > cutoffTime);
    
    console.log(`🧹 Cleared events older than ${maxAgeMs / (1000 * 60 * 60)} hours`);
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    events: AnalysisEvent[];
    metrics: PerformanceMetrics;
    health: SystemHealth;
    summary: {
      totalEvents: number;
      totalRequests: number;
      totalErrors: number;
      averageProcessingTime: number;
      uptime: number;
    };
  } {
    const health = this.getSystemHealth();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const metrics = this.getMetrics(oneHourAgo, now);
    
    return {
      events: this.events,
      metrics,
      health,
      summary: {
        totalEvents: this.events.length,
        totalRequests: this.totalRequests,
        totalErrors: this.errorCount,
        averageProcessingTime: metrics.processingTime,
        uptime: health.uptime
      }
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.events = [];
    this.processingTimes = [];
    this.memorySnapshots = [];
    this.errorCount = 0;
    this.totalRequests = 0;
    this.startTime = new Date();
    console.log('🔄 Performance monitor reset');
  }

  // Private helper methods
  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logEvent(event: AnalysisEvent): void {
    const logLevel = event.result.success ? 'info' : 'error';
    const message = `📊 Analysis Event: ${event.result.success ? 'SUCCESS' : 'FAILED'} | ` +
                   `Time: ${event.processingTime}ms | ` +
                   `Method: ${event.result.method} | ` +
                   `Confidence: ${(event.result.confidence * 100).toFixed(1)}%`;
    
    if (logLevel === 'error') {
      console.error(message);
      if (event.errors?.length) {
        console.error('Errors:', event.errors);
      }
    } else {
      console.log(message);
    }
  }

  private getModelStatus(modelName: string): boolean {
    // Check recent events to see if models are working
    const recentEvents = this.events.slice(-10);
    if (recentEvents.length === 0) return false;
    
    return recentEvents.some(event => event.modelStatus[modelName as keyof typeof event.modelStatus]);
  }

  private getTotalMemory(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapTotal;
    }
    return 0;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-cleanup old events every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.clearOldEvents();
  }, 60 * 60 * 1000); // 1 hour
}

export default PerformanceMonitor;











