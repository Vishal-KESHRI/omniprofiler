class MemoryMonitor {
  constructor(options = {}) {
    this.alertThreshold = options.alertThreshold || 500 * 1024 * 1024; // 500MB
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.onAlert = options.onAlert || this._defaultAlertHandler;
    this.isRunning = false;
    this.consecutiveHighMemory = 0;
    this.maxConsecutiveAlerts = options.maxConsecutiveAlerts || 3;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this._checkMemory();
    }, this.checkInterval);
    
    console.log('Memory monitor started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.intervalId);
    console.log('Memory monitor stopped');
  }

  _checkMemory() {
    const usage = process.memoryUsage();
    const stats = {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      rssMB: Math.round(usage.rss / 1024 / 1024)
    };

    if (usage.heapUsed > this.alertThreshold) {
      this.consecutiveHighMemory++;
      
      if (this.consecutiveHighMemory >= this.maxConsecutiveAlerts) {
        this.onAlert('HIGH_MEMORY', stats);
        this.consecutiveHighMemory = 0; // Reset to avoid spam
      }
    } else {
      this.consecutiveHighMemory = 0;
    }

    // Check for rapid growth
    if (this.lastStats) {
      const timeDiff = stats.timestamp - this.lastStats.timestamp;
      const memoryDiff = stats.heapUsed - this.lastStats.heapUsed;
      const growthRate = memoryDiff / timeDiff * 1000; // bytes per second
      
      if (growthRate > 1024 * 1024) { // 1MB/sec growth
        this.onAlert('RAPID_GROWTH', { ...stats, growthRate });
      }
    }

    this.lastStats = stats;
  }

  _defaultAlertHandler(type, stats) {
    switch (type) {
      case 'HIGH_MEMORY':
        console.warn(`🚨 HIGH MEMORY USAGE: ${stats.heapUsedMB}MB (RSS: ${stats.rssMB}MB)`);
        break;
      case 'RAPID_GROWTH':
        console.warn(`📈 RAPID MEMORY GROWTH: ${Math.round(stats.growthRate / 1024)}KB/sec`);
        break;
    }
  }

  getCurrentStats() {
    const usage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      uptime: Math.round(process.uptime())
    };
  }

  // Force garbage collection if available
  forceGC() {
    if (global.gc) {
      console.log('Forcing garbage collection...');
      const before = process.memoryUsage().heapUsed;
      global.gc();
      const after = process.memoryUsage().heapUsed;
      const freed = Math.round((before - after) / 1024 / 1024);
      console.log(`GC freed ${freed}MB`);
      return freed;
    } else {
      console.log('GC not available. Start with --expose-gc flag');
      return 0;
    }
  }
}

module.exports = MemoryMonitor;