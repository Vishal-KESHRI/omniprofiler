class MemoryProfiler {
  constructor(options = {}) {
    this.env = process.env.NODE_ENV || 'development';
    this.config = this._getConfigForEnvironment(options);
    this.isEnabled = false;
    this.samples = [];
    this.allocations = new Map();
    this.startTime = Date.now();
  }

  _getConfigForEnvironment(userOptions) {
    const defaults = {
      development: {
        enabled: true,
        samplingRate: 1.0,
        maxSamples: 1000,
        heapDumps: true,
        detailedTracing: true,
        alertThreshold: 100 * 1024 * 1024 // 100MB
      },
      staging: {
        enabled: true,
        samplingRate: 0.1,
        maxSamples: 500,
        heapDumps: false,
        detailedTracing: true,
        alertThreshold: 200 * 1024 * 1024 // 200MB
      },
      production: {
        enabled: false,
        samplingRate: 0.01,
        maxSamples: 100,
        heapDumps: false,
        detailedTracing: false,
        alertThreshold: 500 * 1024 * 1024 // 500MB
      }
    };

    return { ...defaults[this.env], ...userOptions };
  }

  start() {
    if (!this.config.enabled && this.env === 'production') {
      console.log('Profiler in standby mode for production');
      this._startTriggeredProfiling();
      return;
    }

    this.isEnabled = true;
    this._startContinuousProfiling();
    console.log(`Memory profiler started in ${this.env} mode`);
  }

  stop() {
    this.isEnabled = false;
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
    }
    console.log('Memory profiler stopped');
  }

  _startContinuousProfiling() {
    const interval = this.env === 'development' ? 5000 : 30000;
    
    this.samplingInterval = setInterval(() => {
      if (Math.random() < this.config.samplingRate) {
        this._takeSample();
      }
    }, interval);
  }

  _startTriggeredProfiling() {
    const checkInterval = 60000; // Check every minute
    
    this.triggerInterval = setInterval(() => {
      const usage = process.memoryUsage();
      
      if (usage.heapUsed > this.config.alertThreshold) {
        console.warn('High memory usage detected, enabling profiling');
        this._enableTemporaryProfiling();
      }
    }, checkInterval);
  }

  _enableTemporaryProfiling() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this._startContinuousProfiling();
    
    // Auto-disable after 5 minutes
    setTimeout(() => {
      this.stop();
      this._startTriggeredProfiling();
    }, 300000);
  }

  _takeSample() {
    const usage = process.memoryUsage();
    const sample = {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      stackTrace: this.config.detailedTracing ? this._captureStackTrace() : null
    };

    this.samples.push(sample);
    
    // Keep only recent samples
    if (this.samples.length > this.config.maxSamples) {
      this.samples.shift();
    }

    this._checkForLeaks(sample);
  }

  _captureStackTrace() {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    
    const stack = new Error().stack;
    Error.prepareStackTrace = originalPrepareStackTrace;
    
    return stack.slice(2, 7).map(frame => ({
      function: frame.getFunctionName() || 'anonymous',
      file: frame.getFileName() || 'unknown',
      line: frame.getLineNumber() || 0
    }));
  }

  _checkForLeaks(sample) {
    if (this.samples.length < 10) return;

    const recent = this.samples.slice(-10);
    const growthRate = (recent[9].heapUsed - recent[0].heapUsed) / 9;
    
    if (growthRate > 1024 * 1024) { // 1MB per sample
      this._onLeakDetected(sample, growthRate);
    }
  }

  _onLeakDetected(sample, growthRate) {
    const leak = {
      timestamp: sample.timestamp,
      growthRate: Math.round(growthRate / 1024), // KB per sample
      heapUsed: Math.round(sample.heapUsed / 1024 / 1024), // MB
      stackTrace: sample.stackTrace
    };

    console.warn('Potential memory leak detected:', leak);
    
    if (this.config.heapDumps && this.env !== 'production') {
      this._takeHeapSnapshot();
    }
  }

  _takeHeapSnapshot() {
    try {
      const v8 = require('v8');
      const fs = require('fs');
      const filename = `heap-${Date.now()}.heapsnapshot`;
      
      const snapshot = v8.getHeapSnapshot();
      const fileStream = fs.createWriteStream(filename);
      snapshot.pipe(fileStream);
      
      console.log(`Heap snapshot saved: ${filename}`);
    } catch (error) {
      console.error('Failed to take heap snapshot:', error.message);
    }
  }

  getStats() {
    if (this.samples.length === 0) return null;

    const latest = this.samples[this.samples.length - 1];
    const oldest = this.samples[0];
    const duration = latest.timestamp - oldest.timestamp;
    
    return {
      currentMemory: {
        heapUsed: Math.round(latest.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(latest.heapTotal / 1024 / 1024), // MB
        rss: Math.round(latest.rss / 1024 / 1024) // MB
      },
      growth: {
        heapGrowth: Math.round((latest.heapUsed - oldest.heapUsed) / 1024 / 1024), // MB
        duration: Math.round(duration / 1000), // seconds
        rate: Math.round((latest.heapUsed - oldest.heapUsed) / duration * 1000 / 1024) // KB/sec
      },
      samples: this.samples.length,
      environment: this.env
    };
  }

  // Manual trigger for production
  enableProfiling(duration = 300000) {
    if (this.env !== 'production') {
      console.log('Manual profiling only available in production');
      return;
    }

    console.log(`Enabling profiling for ${duration / 1000} seconds`);
    this.isEnabled = true;
    this._startContinuousProfiling();
    
    setTimeout(() => {
      this.stop();
      this._startTriggeredProfiling();
    }, duration);
  }
}

module.exports = MemoryProfiler;