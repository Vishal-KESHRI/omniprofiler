const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 
                 process.env.OMNIPROFILER_REPORT_DIR || 
                 process.env.MEMORY_PROFILER_REPORT_DIR || 
                 './reports',
      format: options.format || 
              process.env.OMNIPROFILER_REPORT_FORMAT || 
              'html', // html, json, console
      includeStackTraces: options.includeStackTraces !== false,
      ...options
    };
  }

  async generateDetailedReport(universalProfiler, leakDetector) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportData = await this._collectReportData(universalProfiler, leakDetector);
    
    // Generate different formats
    const reports = {};
    
    if (this.options.format === 'html' || this.options.format === 'all') {
      reports.html = await this._generateHTMLReport(reportData, timestamp);
    }
    
    if (this.options.format === 'json' || this.options.format === 'all') {
      reports.json = await this._generateJSONReport(reportData, timestamp);
    }
    
    // Only show console summary for 'all' format or when no specific format
    if (this.options.format === 'all' || this.options.format === 'console') {
      this._generateConsoleReport(reportData);
    }
    
    return reports;
  }

  async _collectReportData(universalProfiler, leakDetector) {
    const allStats = await universalProfiler.getAllMemoryStats();
    const leakHistory = leakDetector ? leakDetector.getLeakHistory() : [];
    const samples = leakDetector ? leakDetector.getSamples() : [];
    
    return {
      timestamp: new Date().toISOString(),
      summary: this._generateSummary(allStats, leakHistory),
      languages: this._analyzeLanguages(allStats.languages),
      leaks: this._analyzeLeaks(leakHistory),
      trends: this._analyzeTrends(samples),
      recommendations: this._generateRecommendations(allStats, leakHistory)
    };
  }

  _generateSummary(allStats, leakHistory) {
    const totalLanguages = Object.keys(allStats.languages).length;
    const activeLeaks = leakHistory.filter(leak => leak.severity === 'high').length;
    const totalMemoryMB = Object.values(allStats.languages)
      .reduce((sum, lang) => {
        if (lang.heapUsed) return sum + (lang.heapUsed / 1024 / 1024);
        if (lang.rss) return sum + (lang.rss / 1024 / 1024);
        return sum;
      }, 0);

    return {
      totalLanguages,
      activeLeaks,
      totalMemoryMB: Math.round(totalMemoryMB),
      status: activeLeaks > 0 ? 'CRITICAL' : totalMemoryMB > 500 ? 'WARNING' : 'HEALTHY'
    };
  }

  _analyzeLanguages(languages) {
    const analysis = {};
    
    for (const [lang, data] of Object.entries(languages)) {
      if (data.error) {
        analysis[lang] = { status: 'ERROR', error: data.error };
        continue;
      }

      const memoryMB = this._getMemoryUsage(lang, data);
      const status = memoryMB > 200 ? 'HIGH' : memoryMB > 100 ? 'MEDIUM' : 'LOW';
      
      analysis[lang] = {
        status,
        memoryMB: Math.round(memoryMB),
        details: this._getLanguageDetails(lang, data),
        issues: this._detectLanguageIssues(lang, data)
      };
    }
    
    return analysis;
  }

  _getMemoryUsage(lang, data) {
    switch (lang) {
      case 'javascript':
        return (data.heapUsed || 0) / 1024 / 1024;
      case 'python':
        return (data.rss || 0) / 1024 / 1024;
      case 'java':
        return (data.heapUsed || 0) / 1024 / 1024;
      case 'go':
        return (data.alloc || 0) / 1024 / 1024;
      default:
        return 0;
    }
  }

  _getLanguageDetails(lang, data) {
    switch (lang) {
      case 'javascript':
        return {
          heapUsed: `${Math.round((data.heapUsed || 0) / 1024 / 1024)}MB`,
          heapTotal: `${Math.round((data.heapTotal || 0) / 1024 / 1024)}MB`,
          rss: `${Math.round((data.rss || 0) / 1024 / 1024)}MB`,
          external: `${Math.round((data.external || 0) / 1024 / 1024)}MB`
        };
      case 'python':
        return {
          rss: `${Math.round((data.rss || 0) / 1024 / 1024)}MB`,
          vms: `${Math.round((data.vms || 0) / 1024 / 1024)}MB`,
          percent: `${(data.percent || 0).toFixed(1)}%`,
          objects: data.object_count || 0
        };
      case 'java':
        return {
          heapUsed: `${Math.round((data.heapUsed || 0) / 1024 / 1024)}MB`,
          heapMax: `${Math.round((data.heapMax || 0) / 1024 / 1024)}MB`,
          nonHeap: `${Math.round((data.nonHeapUsed || 0) / 1024 / 1024)}MB`,
          threads: data.threadCount || 0
        };
      case 'go':
        return {
          alloc: `${Math.round((data.alloc || 0) / 1024 / 1024)}MB`,
          sys: `${Math.round((data.sys || 0) / 1024 / 1024)}MB`,
          numGC: data.numGC || 0,
          goroutines: data.goroutines || 0
        };
      default:
        return data;
    }
  }

  _detectLanguageIssues(lang, data) {
    const issues = [];
    const memoryMB = this._getMemoryUsage(lang, data);
    
    if (memoryMB > 500) {
      issues.push({
        type: 'HIGH_MEMORY',
        severity: 'critical',
        message: `Memory usage (${Math.round(memoryMB)}MB) exceeds 500MB threshold`,
        recommendation: 'Consider memory optimization or increasing available memory'
      });
    }
    
    // Language-specific issues
    switch (lang) {
      case 'javascript':
        if (data.external > data.heapUsed) {
          issues.push({
            type: 'HIGH_EXTERNAL_MEMORY',
            severity: 'warning',
            message: 'External memory usage is higher than heap memory',
            recommendation: 'Check for large buffers or native modules'
          });
        }
        break;
        
      case 'python':
        if (data.object_count > 100000) {
          issues.push({
            type: 'HIGH_OBJECT_COUNT',
            severity: 'warning',
            message: `High object count: ${data.object_count}`,
            recommendation: 'Consider object pooling or cleanup'
          });
        }
        break;
        
      case 'go':
        if (data.numGC > 1000) {
          issues.push({
            type: 'FREQUENT_GC',
            severity: 'warning',
            message: `High GC frequency: ${data.numGC} collections`,
            recommendation: 'Optimize memory allocation patterns'
          });
        }
        break;
    }
    
    return issues;
  }

  _analyzeLeaks(leakHistory) {
    return leakHistory.map(leak => ({
      ...leak,
      location: this._identifyLeakLocation(leak),
      impact: this._assessLeakImpact(leak),
      solution: this._suggestLeakSolution(leak)
    }));
  }

  _identifyLeakLocation(leak) {
    // This would be enhanced with actual stack trace analysis
    return {
      file: 'unknown',
      line: 0,
      function: 'unknown',
      stackTrace: leak.stackTrace || []
    };
  }

  _assessLeakImpact(leak) {
    const impact = {
      severity: leak.severity,
      growthRate: `${leak.growthRate}KB/sec`,
      totalGrowth: `${leak.totalGrowth}MB`,
      timeToExhaustion: this._calculateTimeToExhaustion(leak)
    };
    
    return impact;
  }

  _calculateTimeToExhaustion(leak) {
    if (leak.growthRate <= 0) return 'N/A';
    
    const availableMemoryMB = 1000; // Assume 1GB available
    const hoursToExhaustion = availableMemoryMB / (leak.growthRate / 1024 * 3600);
    
    if (hoursToExhaustion < 1) return `${Math.round(hoursToExhaustion * 60)} minutes`;
    if (hoursToExhaustion < 24) return `${Math.round(hoursToExhaustion)} hours`;
    return `${Math.round(hoursToExhaustion / 24)} days`;
  }

  _suggestLeakSolution(leak) {
    const solutions = {
      consistent_growth: [
        'Check for unbounded caches or collections',
        'Verify event listeners are properly removed',
        'Look for circular references in object graphs'
      ],
      exponential_growth: [
        'Investigate recursive object creation',
        'Check for memory amplification in loops',
        'Review data structure growth patterns'
      ],
      sudden_spike: [
        'Analyze large object allocations',
        'Check file loading or data processing',
        'Review batch operation memory usage'
      ]
    };
    
    return solutions[leak.type] || ['General memory optimization needed'];
  }

  _analyzeTrends(samples) {
    if (samples.length < 10) return { status: 'insufficient_data' };
    
    const recent = samples.slice(-10);
    const growth = recent[9].heapUsedMB - recent[0].heapUsedMB;
    const trend = growth > 5 ? 'increasing' : growth < -5 ? 'decreasing' : 'stable';
    
    return {
      trend,
      growthMB: Math.round(growth),
      samples: recent.length,
      prediction: this._predictMemoryUsage(recent)
    };
  }

  _predictMemoryUsage(samples) {
    // Simple linear regression for prediction
    const n = samples.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    samples.forEach((sample, i) => {
      sumX += i;
      sumY += sample.heapUsedMB;
      sumXY += i * sample.heapUsedMB;
      sumXX += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next 10 samples
    const predictions = [];
    for (let i = n; i < n + 10; i++) {
      predictions.push(Math.round(slope * i + intercept));
    }
    
    return {
      slope: Math.round(slope * 100) / 100,
      nextValues: predictions
    };
  }

  _generateRecommendations(allStats, leakHistory) {
    const recommendations = [];
    
    // High-level recommendations
    const criticalLeaks = leakHistory.filter(leak => leak.severity === 'high');
    if (criticalLeaks.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Memory Leaks',
        message: `${criticalLeaks.length} critical memory leak(s) detected`,
        actions: [
          'Immediately investigate leak sources',
          'Consider restarting affected services',
          'Implement emergency memory limits'
        ]
      });
    }
    
    // Language-specific recommendations
    for (const [lang, data] of Object.entries(allStats.languages)) {
      const memoryMB = this._getMemoryUsage(lang, data);
      
      if (memoryMB > 200) {
        recommendations.push({
          priority: 'HIGH',
          category: `${lang} Optimization`,
          message: `High memory usage in ${lang}: ${Math.round(memoryMB)}MB`,
          actions: this._getLanguageOptimizations(lang)
        });
      }
    }
    
    return recommendations;
  }

  _getLanguageOptimizations(lang) {
    const optimizations = {
      javascript: [
        'Enable garbage collection with --expose-gc',
        'Use WeakMap/WeakSet for temporary references',
        'Implement object pooling for frequently created objects'
      ],
      python: [
        'Use __slots__ to reduce object memory overhead',
        'Implement proper cleanup in __del__ methods',
        'Consider using generators for large datasets'
      ],
      java: [
        'Tune JVM heap settings (-Xmx, -Xms)',
        'Use appropriate garbage collector (G1, ZGC)',
        'Implement proper connection pooling'
      ],
      go: [
        'Use sync.Pool for object reuse',
        'Optimize slice and map usage',
        'Consider runtime.GC() for manual collection'
      ]
    };
    
    return optimizations[lang] || ['Review memory allocation patterns'];
  }

  async _generateHTMLReport(reportData, timestamp) {
    const htmlContent = this._createHTMLTemplate(reportData, timestamp);
    
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
    
    const filename = path.join(this.options.outputDir, `memory-report-${timestamp}.html`);
    fs.writeFileSync(filename, htmlContent);
    
    console.log(`📊 HTML Report generated: ${filename}`);
    return filename;
  }

  _createHTMLTemplate(data, timestamp) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmniProfiler Report - ${timestamp}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
          --primary: #6366f1;
          --primary-dark: #4f46e5;
          --secondary: #8b5cf6;
          --accent: #06b6d4;
          --success: #10b981;
          --warning: #f59e0b;
          --danger: #ef4444;
          --dark: #0f172a;
          --darker: #020617;
          --light: #f8fafc;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --gray-900: #0f172a;
          --glass-bg: rgba(255, 255, 255, 0.05);
          --glass-border: rgba(255, 255, 255, 0.1);
          --neon-cyan: #00f5ff;
          --neon-purple: #bf00ff;
          --neon-green: #39ff14;
          --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --gradient-cyber: linear-gradient(135deg, #00f5ff 0%, #bf00ff 100%);
          --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
          --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--darker);
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
          min-height: 100vh;
          color: var(--light);
          line-height: 1.6;
          overflow-x: hidden;
        }
        
        .container {
          max-width: 1400px;
          margin: 20px auto;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid var(--glass-border);
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .header {
          background: linear-gradient(135deg, var(--dark) 0%, var(--gray-800) 100%);
          color: white;
          padding: 48px;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid var(--glass-border);
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(0, 245, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(191, 0, 255, 0.1) 0%, transparent 50%);
          opacity: 0.6;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 12px;
          background: var(--gradient-cyber);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(0, 245, 255, 0.3);
        }
        
        .header .subtitle {
          font-size: 1.2rem;
          opacity: 0.8;
          font-weight: 400;
          color: var(--gray-300);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 20px;
          border: 1px solid;
          backdrop-filter: blur(10px);
        }
        
        .status-critical {
          background: rgba(239, 68, 68, 0.2);
          border-color: var(--danger);
          color: #fca5a5;
          animation: pulse-glow 2s infinite;
        }
        
        .status-warning {
          background: rgba(245, 158, 11, 0.2);
          border-color: var(--warning);
          color: #fcd34d;
        }
        
        .status-healthy {
          background: rgba(16, 185, 129, 0.2);
          border-color: var(--success);
          color: #6ee7b7;
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
            transform: scale(1.02);
          }
        }
        
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          padding: 48px;
          background: rgba(15, 23, 42, 0.3);
          border-bottom: 1px solid var(--glass-border);
        }
        
        .summary-card {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 32px 24px;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .summary-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gradient-cyber);
        }
        
        .summary-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0, 245, 255, 0.2);
          border-color: rgba(0, 245, 255, 0.3);
        }
        
        .summary-card h3 {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 16px;
        }
        
        .summary-card .value {
          font-size: 3rem;
          font-weight: 700;
          background: var(--gradient-cyber);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 12px;
          text-shadow: 0 0 30px rgba(0, 245, 255, 0.3);
        }
        
        .summary-card .label {
          font-size: 0.9rem;
          color: var(--gray-300);
          font-weight: 400;
        }
        
        .section {
          padding: 48px;
          border-top: 1px solid var(--glass-border);
        }
        
        .section h2 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--light);
          margin-bottom: 32px;
          position: relative;
          padding-left: 24px;
        }
        
        .section h2::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 28px;
          background: var(--gradient-cyber);
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
        }
        
        .language-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 28px;
        }
        
        .language-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 28px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        
        .language-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gradient-cyber);
        }
        
        .language-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -12px rgba(0, 245, 255, 0.15);
          border-color: rgba(0, 245, 255, 0.3);
        }
        
        .language-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .language-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--light);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .status-indicator {
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border: 1px solid;
          backdrop-filter: blur(10px);
        }
        
        .status-low {
          background: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
          border-color: var(--success);
        }
        
        .status-medium {
          background: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
          border-color: var(--warning);
        }
        
        .status-high {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border-color: var(--danger);
        }
        
        .leak-item {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-left: 4px solid var(--danger);
          border-radius: 16px;
          padding: 24px;
          margin: 20px 0;
          backdrop-filter: blur(20px);
          color: var(--light);
        }
        
        .leak-critical {
          border-left-color: var(--danger);
          animation: danger-glow 2s infinite alternate;
        }
        
        @keyframes danger-glow {
          from { 
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.3);
          }
          to { 
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
            border-color: rgba(239, 68, 68, 0.6);
          }
        }
        
        .recommendation {
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-left: 4px solid var(--accent);
          border-radius: 16px;
          padding: 24px;
          margin: 20px 0;
          backdrop-filter: blur(20px);
          color: var(--light);
        }
        
        .code {
          background: rgba(2, 6, 23, 0.8);
          color: #e2e8f0;
          padding: 20px;
          border-radius: 16px;
          font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          border: 1px solid var(--glass-border);
          position: relative;
          overflow-x: auto;
          backdrop-filter: blur(10px);
        }
        
        .code::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gradient-cyber);
          opacity: 0.7;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 28px 0;
          background: var(--glass-bg);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
        }
        
        th, td {
          padding: 20px;
          text-align: left;
          border-bottom: 1px solid var(--glass-border);
        }
        
        th {
          background: rgba(15, 23, 42, 0.5);
          font-weight: 600;
          color: var(--light);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 1px;
        }
        
        td {
          color: var(--gray-300);
        }
        
        .metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          color: var(--neon-cyan);
          text-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
        }
        
        .progress-bar {
          width: 100%;
          height: 10px;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 8px;
          overflow: hidden;
          margin: 12px 0;
          border: 1px solid var(--glass-border);
        }
        
        .progress-fill {
          height: 100%;
          background: var(--gradient-cyber);
          border-radius: 8px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px rgba(0, 245, 255, 0.4);
        }
        
        .footer {
          background: var(--darker);
          color: var(--gray-300);
          padding: 32px 48px;
          text-align: center;
          font-size: 0.9rem;
          border-top: 1px solid var(--glass-border);
        }
        
        .footer a {
          color: var(--neon-cyan);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }
        
        .footer a:hover {
          color: var(--neon-purple);
          text-shadow: 0 0 10px rgba(191, 0, 255, 0.5);
        }
        
        @media (max-width: 768px) {
          .container {
            margin: 12px;
            border-radius: 20px;
          }
          
          .header {
            padding: 32px 24px;
          }
          
          .header h1 {
            font-size: 2.2rem;
          }
          
          .summary {
            grid-template-columns: 1fr;
            padding: 32px 24px;
            gap: 20px;
          }
          
          .section {
            padding: 32px 24px;
          }
          
          .language-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .summary-card {
            padding: 24px 20px;
          }
          
          .language-card {
            padding: 24px 20px;
          }
        }
        
        @media (max-width: 480px) {
          .header h1 {
            font-size: 1.8rem;
          }
          
          .summary-card .value {
            font-size: 2.2rem;
          }
          
          .section h2 {
            font-size: 1.6rem;
          }
        }
        
        .loading {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid rgba(0, 245, 255, 0.2);
          border-radius: 50%;
          border-top-color: var(--neon-cyan);
          animation: cyber-spin 1s ease-in-out infinite;
        }
        
        @keyframes cyber-spin {
          to { 
            transform: rotate(360deg);
            filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.5));
          }
        }
        
        .cyber-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: -1;
        }
    </style>
</head>
<body>
    <div class="cyber-grid"></div>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>🌌 OmniProfiler</h1>
                <p class="subtitle">Universal Memory Analysis Report</p>
                <div class="status-badge status-${data.summary.status.toLowerCase()}">
                    ${data.summary.status === 'CRITICAL' ? '🚨' : data.summary.status === 'WARNING' ? '⚠️' : '✅'}
                    ${data.summary.status}
                </div>
                <p style="margin-top: 16px; opacity: 0.8; font-size: 0.9rem;">
                    Generated: ${new Date(data.timestamp).toLocaleString()}
                </p>
            </div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Languages Detected</h3>
                <div class="value">${data.summary.totalLanguages}</div>
                <div class="label">Multi-language project</div>
            </div>
            <div class="summary-card">
                <h3>Active Leaks</h3>
                <div class="value">${data.summary.activeLeaks}</div>
                <div class="label">${data.summary.activeLeaks > 0 ? 'Requires attention' : 'All clear'}</div>
            </div>
            <div class="summary-card">
                <h3>Total Memory</h3>
                <div class="value">${data.summary.totalMemoryMB}</div>
                <div class="label">MB allocated</div>
            </div>
            <div class="summary-card">
                <h3>Health Score</h3>
                <div class="value">${data.summary.activeLeaks === 0 ? '100' : data.summary.activeLeaks < 3 ? '75' : '45'}</div>
                <div class="label">Overall system health</div>
            </div>
        </div>

        <div class="section">
            <h2>🌍 Language Analysis</h2>
            <div class="language-grid">
                ${Object.entries(data.languages).map(([lang, info]) => `
                    <div class="language-card">
                        <div class="language-header">
                            <span class="language-name">${lang.toUpperCase()}</span>
                            <span class="status-indicator status-${info.status.toLowerCase()}">${info.status}</span>
                        </div>
                        ${info.error ? `<p style="color: #e74c3c;">Error: ${info.error}</p>` : `
                            <p><strong>Memory Usage:</strong> <span class="metric-value">${info.memoryMB}MB</span></p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((info.memoryMB / 500) * 100, 100)}%"></div>
                            </div>
                            <div class="code">
                                ${Object.entries(info.details).map(([key, value]) => `<span style="color: #4facfe;">${key}:</span> <span style="color: #39ff14;">${value}</span>`).join('<br>')}
                            </div>
                            ${info.issues.length > 0 ? `
                                <h4 style="margin-top: 20px; color: var(--text-primary); font-size: 1.1rem;">Issues Found:</h4>
                                ${info.issues.map(issue => `
                                    <div class="leak-item leak-${issue.severity}">
                                        <strong style="color: #fa709a;">${issue.type}:</strong> ${issue.message}<br>
                                        <em style="color: #4facfe; margin-top: 8px; display: block;">💡 Recommendation: ${issue.recommendation}</em>
                                    </div>
                                `).join('')}
                            ` : '<div style="background: linear-gradient(135deg, rgba(57, 255, 20, 0.1) 0%, rgba(57, 255, 20, 0.05) 100%); padding: 16px; border-radius: 12px; border-left: 4px solid #39ff14; margin-top: 16px;"><p style="color: #2d5a2d; margin: 0;">✅ No issues detected - System running optimally</p></div>'}
                        `}
                    </div>
                `).join('')}
            </div>
        </div>

        ${data.leaks.length > 0 ? `
            <div class="section">
                <h2>🚨 Memory Leaks Detected</h2>
                ${data.leaks.map(leak => `
                    <div class="leak-item leak-${leak.severity}">
                        <h3>${leak.type.replace('_', ' ').toUpperCase()} - ${leak.severity.toUpperCase()}</h3>
                        <p><strong>Growth Rate:</strong> ${leak.impact.growthRate}</p>
                        <p><strong>Total Growth:</strong> ${leak.impact.totalGrowth}</p>
                        <p><strong>Time to Exhaustion:</strong> ${leak.impact.timeToExhaustion}</p>
                        <p><strong>Confidence:</strong> ${leak.confidence.toFixed(1)}%</p>
                        
                        <h4>Recommended Solutions:</h4>
                        <ul>
                            ${leak.solution.map(solution => `<li>${solution}</li>`).join('')}
                        </ul>
                        
                        ${leak.location.stackTrace.length > 0 ? `
                            <h4>Stack Trace:</h4>
                            <div class="code">
                                ${leak.location.stackTrace.map(frame => `${frame.function} (${frame.file}:${frame.line})`).join('<br>')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="section">
            <h2>📈 Memory Trends</h2>
            ${data.trends.status === 'insufficient_data' ? 
                '<p>Insufficient data for trend analysis. Continue monitoring to see trends.</p>' : `
                <p><strong>Trend:</strong> ${data.trends.trend} (${data.trends.growthMB}MB change)</p>
                <p><strong>Prediction:</strong> Next values: ${data.trends.prediction.nextValues.slice(0, 5).join(', ')}MB</p>
            `}
        </div>

        <div class="section">
            <h2>💡 Recommendations</h2>
            ${data.recommendations.map(rec => `
                <div class="recommendation">
                    <h3>${rec.priority}: ${rec.category}</h3>
                    <p>${rec.message}</p>
                    <h4>Actions:</h4>
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>Generated by <a href="https://github.com/your-org/omniprofiler" target="_blank">OmniProfiler</a> v2.0.0</p>
            <p style="margin-top: 8px; opacity: 0.7;">Universal Memory Profiling for Modern Applications</p>
        </div>
    </div>
    
    <script>
        // Add interactive features
        document.addEventListener('DOMContentLoaded', function() {
            // Animate progress bars with stagger effect
            const progressBars = document.querySelectorAll('.progress-fill');
            progressBars.forEach((bar, index) => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                    bar.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                }, 300 + (index * 150));
            });
            
            // Enhanced card hover effects
            const cards = document.querySelectorAll('.summary-card, .language-card');
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                    this.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                });
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                });
            });
            
            // Enhanced copy functionality with visual feedback
            const codeBlocks = document.querySelectorAll('.code');
            codeBlocks.forEach(block => {
                block.style.cursor = 'pointer';
                block.title = '🔗 Click to copy';
                block.addEventListener('click', function() {
                    const text = this.textContent.trim();
                    navigator.clipboard.writeText(text).then(() => {
                        this.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.6)';
                        setTimeout(() => {
                            this.style.boxShadow = '';
                        }, 1000);
                    });
                });
            });
            
            // Add intersection observer for fade-in animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });
            
            // Observe all cards
            document.querySelectorAll('.summary-card, .language-card').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        });
    </script>
</body>
</html>`;
  }

  async _generateJSONReport(reportData, timestamp) {
    const filename = path.join(this.options.outputDir, `memory-report-${timestamp}.json`);
    
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
    
    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    console.log(`📄 JSON Report generated: ${filename}`);
    return filename;
  }

  _generateConsoleReport(data) {
    console.log('\n🔍 MEMORY PROFILER DETAILED REPORT');
    console.log('=====================================');
    
    // Summary
    console.log(`\n📊 SUMMARY`);
    console.log(`Status: ${data.summary.status}`);
    console.log(`Languages: ${data.summary.totalLanguages}`);
    console.log(`Active Leaks: ${data.summary.activeLeaks}`);
    console.log(`Total Memory: ${data.summary.totalMemoryMB}MB`);
    
    // Languages
    console.log(`\n🌍 LANGUAGE ANALYSIS`);
    for (const [lang, info] of Object.entries(data.languages)) {
      console.log(`\n${lang.toUpperCase()} - ${info.status}`);
      if (info.error) {
        console.log(`  ❌ Error: ${info.error}`);
      } else {
        console.log(`  Memory: ${info.memoryMB}MB`);
        Object.entries(info.details).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        
        if (info.issues.length > 0) {
          console.log(`  ⚠️  Issues:`);
          info.issues.forEach(issue => {
            console.log(`    - ${issue.type}: ${issue.message}`);
            console.log(`      Solution: ${issue.recommendation}`);
          });
        }
      }
    }
    
    // Leaks
    if (data.leaks.length > 0) {
      console.log(`\n🚨 MEMORY LEAKS DETECTED`);
      data.leaks.forEach((leak, i) => {
        console.log(`\nLeak #${i + 1}: ${leak.type} (${leak.severity})`);
        console.log(`  Growth: ${leak.impact.growthRate} → ${leak.impact.totalGrowth}`);
        console.log(`  Time to exhaustion: ${leak.impact.timeToExhaustion}`);
        console.log(`  Confidence: ${leak.confidence.toFixed(1)}%`);
        console.log(`  Solutions:`);
        leak.solution.forEach(solution => {
          console.log(`    - ${solution}`);
        });
      });
    }
    
    // Recommendations
    if (data.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS`);
      data.recommendations.forEach(rec => {
        console.log(`\n${rec.priority}: ${rec.category}`);
        console.log(`  ${rec.message}`);
        console.log(`  Actions:`);
        rec.actions.forEach(action => {
          console.log(`    - ${action}`);
        });
      });
    }
  }
}

module.exports = ReportGenerator;