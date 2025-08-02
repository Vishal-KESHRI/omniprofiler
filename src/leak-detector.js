class LeakDetector {
  constructor(options = {}) {
    this.sampleWindow = options.sampleWindow || 20;
    this.leakThreshold = options.leakThreshold || 5 * 1024 * 1024; // 5MB growth
    this.checkInterval = options.checkInterval || 60000; // 1 minute
    this.samples = [];
    this.detectedLeaks = [];
    this.isRunning = false;
    this.onLeakDetected = options.onLeakDetected || this._defaultLeakHandler;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this._collectSample();
      this._analyzeForLeaks();
    }, this.checkInterval);
    
    console.log('Leak detector started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.intervalId);
    console.log('Leak detector stopped');
  }

  _collectSample() {
    const usage = process.memoryUsage();
    const sample = {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external
    };

    this.samples.push(sample);
    
    // Keep only recent samples
    if (this.samples.length > this.sampleWindow) {
      this.samples.shift();
    }
  }

  _analyzeForLeaks() {
    if (this.samples.length < this.sampleWindow) return;

    const analysis = this._performLeakAnalysis();
    
    if (analysis.isLeak) {
      const leak = {
        id: Date.now(),
        timestamp: Date.now(),
        type: analysis.type,
        severity: analysis.severity,
        growthRate: analysis.growthRate,
        totalGrowth: analysis.totalGrowth,
        duration: analysis.duration,
        confidence: analysis.confidence
      };

      this.detectedLeaks.push(leak);
      this.onLeakDetected(leak);
    }
  }

  _performLeakAnalysis() {
    const samples = this.samples;
    const first = samples[0];
    const last = samples[samples.length - 1];
    
    const totalGrowth = last.heapUsed - first.heapUsed;
    const duration = last.timestamp - first.timestamp;
    const growthRate = totalGrowth / duration * 1000; // bytes per second

    // Linear regression to detect consistent growth
    const trend = this._calculateTrend(samples);
    
    // Different leak patterns
    const patterns = {
      consistent: this._detectConsistentGrowth(samples, trend),
      exponential: this._detectExponentialGrowth(samples),
      periodic: this._detectPeriodicLeaks(samples),
      sudden: this._detectSuddenSpikes(samples)
    };

    let isLeak = false;
    let type = 'none';
    let severity = 'low';
    let confidence = 0;

    // Analyze patterns
    if (patterns.consistent.detected && totalGrowth > this.leakThreshold) {
      isLeak = true;
      type = 'consistent_growth';
      confidence = patterns.consistent.confidence;
      severity = totalGrowth > 50 * 1024 * 1024 ? 'high' : 'medium';
    } else if (patterns.exponential.detected) {
      isLeak = true;
      type = 'exponential_growth';
      confidence = patterns.exponential.confidence;
      severity = 'high';
    } else if (patterns.sudden.detected) {
      isLeak = true;
      type = 'sudden_spike';
      confidence = patterns.sudden.confidence;
      severity = 'medium';
    }

    return {
      isLeak,
      type,
      severity,
      confidence,
      growthRate: Math.round(growthRate / 1024), // KB/sec
      totalGrowth: Math.round(totalGrowth / 1024 / 1024), // MB
      duration: Math.round(duration / 1000) // seconds
    };
  }

  _calculateTrend(samples) {
    const n = samples.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    samples.forEach((sample, i) => {
      const x = i;
      const y = sample.heapUsed;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  _detectConsistentGrowth(samples, trend) {
    const threshold = 1024 * 100; // 100KB per sample minimum
    const isConsistent = trend.slope > threshold;
    
    // Calculate R-squared for confidence
    const avgY = samples.reduce((sum, s) => sum + s.heapUsed, 0) / samples.length;
    let ssRes = 0, ssTot = 0;
    
    samples.forEach((sample, i) => {
      const predicted = trend.slope * i + trend.intercept;
      ssRes += Math.pow(sample.heapUsed - predicted, 2);
      ssTot += Math.pow(sample.heapUsed - avgY, 2);
    });
    
    const rSquared = 1 - (ssRes / ssTot);
    
    return {
      detected: isConsistent && rSquared > 0.7,
      confidence: Math.min(rSquared * 100, 95)
    };
  }

  _detectExponentialGrowth(samples) {
    if (samples.length < 10) return { detected: false, confidence: 0 };
    
    const recent = samples.slice(-5);
    const earlier = samples.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.heapUsed, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, s) => sum + s.heapUsed, 0) / earlier.length;
    
    const growthFactor = recentAvg / earlierAvg;
    
    return {
      detected: growthFactor > 1.5, // 50% growth in recent samples
      confidence: Math.min((growthFactor - 1) * 100, 90)
    };
  }

  _detectPeriodicLeaks(samples) {
    // Simple periodic detection - look for regular spikes
    const spikes = [];
    
    for (let i = 1; i < samples.length - 1; i++) {
      const current = samples[i].heapUsed;
      const prev = samples[i - 1].heapUsed;
      const next = samples[i + 1].heapUsed;
      
      if (current > prev * 1.2 && current > next * 1.2) {
        spikes.push(i);
      }
    }
    
    return {
      detected: spikes.length > 3,
      confidence: Math.min(spikes.length * 20, 80)
    };
  }

  _detectSuddenSpikes(samples) {
    const last = samples[samples.length - 1];
    const secondLast = samples[samples.length - 2];
    
    if (!secondLast) return { detected: false, confidence: 0 };
    
    const suddenIncrease = last.heapUsed - secondLast.heapUsed;
    const isSudden = suddenIncrease > 10 * 1024 * 1024; // 10MB sudden increase
    
    return {
      detected: isSudden,
      confidence: isSudden ? 75 : 0
    };
  }

  _defaultLeakHandler(leak) {
    const emoji = leak.severity === 'high' ? '🔴' : leak.severity === 'medium' ? '🟡' : '🟢';
    
    console.warn(`${emoji} MEMORY LEAK DETECTED:`);
    console.warn(`  Type: ${leak.type}`);
    console.warn(`  Severity: ${leak.severity}`);
    console.warn(`  Growth: ${leak.totalGrowth}MB over ${leak.duration}s`);
    console.warn(`  Rate: ${leak.growthRate}KB/sec`);
    console.warn(`  Confidence: ${leak.confidence.toFixed(1)}%`);
  }

  getLeakHistory() {
    return this.detectedLeaks.map(leak => ({
      ...leak,
      timeAgo: Math.round((Date.now() - leak.timestamp) / 1000 / 60) // minutes ago
    }));
  }

  getSamples() {
    return this.samples.map(sample => ({
      timestamp: sample.timestamp,
      heapUsedMB: Math.round(sample.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(sample.heapTotal / 1024 / 1024)
    }));
  }
}

module.exports = LeakDetector;