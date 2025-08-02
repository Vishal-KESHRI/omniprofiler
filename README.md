# OmniProfiler

[![npm version](https://badge.fury.io/js/omniprofiler.svg)](https://badge.fury.io/js/omniprofiler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/omniprofiler.svg)](https://nodejs.org/)

**Universal Memory Profiler for Multi-Language Projects**

Intelligent, production-ready memory profiler that automatically detects and profiles **8+ programming languages** and **popular frameworks** including NestJS, Spring Boot, Django, FastAPI, React, Angular, and more. Zero-configuration setup with enterprise-level features.

## 🚀 Features

- 🌍 **Universal Language Support**: Auto-detects and profiles **8 programming languages**
- 🔍 **Environment-Aware**: Automatically adapts behavior for development, staging, and production
- 📊 **Real-time Monitoring**: Continuous memory usage tracking with customizable alerts
- 🚨 **Advanced Leak Detection**: AI-powered pattern recognition for 4 types of memory leaks
- 🎯 **Production-Safe**: Minimal overhead with intelligent triggered profiling
- 📈 **Statistical Analysis**: Trend analysis, growth rate calculation, and confidence scoring
- 🛠️ **Zero Configuration**: Works out-of-the-box with sensible defaults
- 🔧 **Highly Configurable**: Fine-tune every aspect for your specific needs
- 📱 **Integration Ready**: Built-in support for Express.js, monitoring services, and CI/CD
- 🤖 **Auto-Detection**: Automatically scans your project and detects all programming languages

### 🌐 Supported Languages

| Language | Auto-Detection | Memory Profiling | Leak Detection | GC Analysis |
|----------|----------------|------------------|----------------|--------------|
| **JavaScript/Node.js** | ✅ | ✅ Native | ✅ Advanced | ✅ V8 Engine |
| **TypeScript** | ✅ | ✅ Native + Types | ✅ Advanced | ✅ V8 Engine |
| **Python** | ✅ | ✅ psutil + tracemalloc | ✅ Statistical | ✅ gc module |
| **Java** | ✅ | ✅ JMX Beans | ✅ Heap Analysis | ✅ GC MXBeans |
| **Go** | ✅ | ✅ runtime.MemStats | ✅ Growth Analysis | ✅ debug.GCStats |
| **C#/.NET** | ✅ | ✅ GC Class | ✅ Generation Analysis | ✅ .NET GC |
| **C/C++** | ✅ | ✅ System Calls | ✅ RSS Monitoring | ❌ Manual |
| **Rust** | ✅ | 🔄 In Progress | 🔄 In Progress | 🔄 In Progress |
| **PHP** | ✅ | ✅ Built-in Functions | ✅ Basic | ❌ Manual |

## 📦 Installation

```bash
npm install omniprofiler
```

## 🏃‍♂️ Quick Start

### Basic Usage (5 lines of code)

```javascript
const { MemoryProfiler, MemoryMonitor, LeakDetector } = require('omniprofiler');

// Zero-config setup - automatically detects environment
const profiler = new MemoryProfiler();
const monitor = new MemoryMonitor();
const detector = new LeakDetector();

// Start all components
profiler.start();
monitor.start();
detector.start();

// That's it! The library is now monitoring your application
```

### 🌍 Universal Multi-Language Profiling

```javascript
const { UniversalMemoryProfiler, autoProfile } = require('omniprofiler');

// Auto-detect and profile ALL languages in your project
const universalProfiler = await autoProfile();

// Get comprehensive stats for all detected languages
const allStats = await universalProfiler.getAllMemoryStats();
console.log('All Languages:', allStats);

// Generate detailed report
await universalProfiler.generateReport();
```

**Supported Languages**: JavaScript, TypeScript, Python, Java, Go, C#, C++, Rust, PHP

### 🔷 TypeScript Support

```typescript
import { 
  MemoryProfiler, 
  LeakDetector, 
  autoProfile,
  LeakInfo,
  MemoryStats 
} from 'omniprofiler';

// Type-safe configuration
const profiler = new MemoryProfiler({
  enabled: true,
  onLeak: (leak: LeakInfo) => {
    console.log(`Leak: ${leak.type} (${leak.severity})`);
  }
});

// Strongly typed memory stats
const stats: MemoryStats | null = profiler.getStats();
if (stats) {
  console.log(`Memory: ${stats.heapUsed / 1024 / 1024}MB`);
}

// Auto-profiling with types
const universalProfiler = await autoProfile();
```

### 🚨 Advanced Leak Detection & Reporting

```javascript
const { generateReport, autoProfile, LeakDetector } = require('omniprofiler');

// Auto-detect leaks with detailed analysis
const profiler = await autoProfile();
const detector = new LeakDetector({
  onLeakDetected: (leak) => {
    console.log(`🔴 LEAK: ${leak.type} (${leak.severity})`);
    console.log(`📍 Location: ${leak.location}`);
    console.log(`⏰ Time to Critical: ${leak.timeToCritical}`);
  }
});

// Generate comprehensive reports
const reports = await generateReport(profiler, detector, {
  format: 'html',           // Visual dashboard
  outputDir: './reports',
  includeStackTraces: true  // Exact code locations
});

console.log(`📊 Visual Report: ${reports.html}`);
```

### Get Instant Insights

```javascript
// View current memory statistics
console.log('Memory Stats:', profiler.getStats());
console.log('Current Usage:', monitor.getCurrentStats());
console.log('Detected Leaks:', detector.getLeakHistory());
```

## 🏗️ Core Components

### 0. UniversalMemoryProfiler - The Universal Brain 🌍

Automatically detects and profiles **all programming languages** in your project:

```javascript
const { UniversalMemoryProfiler } = require('smart-memory-profiler');

const universalProfiler = new UniversalMemoryProfiler({
  autoDetect: true,                    // Auto-detect languages
  scanDepth: 3,                       // Directory scan depth
  supportedLanguages: [               // Languages to detect
    'javascript', 'python', 'java', 'go', 
    'csharp', 'cpp', 'rust', 'php'
  ]
});

// Start universal profiling
await universalProfiler.start();

// Get stats for ALL detected languages
const allStats = await universalProfiler.getAllMemoryStats();

// Generate comprehensive report
await universalProfiler.generateReport();
```

**Language Detection Features:**
- 🔍 **File Pattern Matching**: Detects by file extensions and config files
- 📊 **Process Detection**: Identifies running language processes
- 📁 **Project Structure Analysis**: Analyzes build files and dependencies
- 🎯 **Confidence Scoring**: Provides detection confidence percentage

### 1. MemoryProfiler - The Brain

Intelligent profiler that automatically adapts to your environment:

```javascript
const profiler = new MemoryProfiler({
  // Environment-specific settings (auto-detected)
  alertThreshold: 500 * 1024 * 1024,  // 500MB alert threshold
  maxSamples: 1000,                   // Keep last 1000 samples
  heapDumps: true,                    // Enable heap dumps (dev only)
  detailedTracing: true,              // Capture stack traces
  samplingRate: 1.0                   // 100% sampling in development
});

profiler.start();

// Production: Enable profiling on-demand
if (process.env.NODE_ENV === 'production') {
  profiler.enableProfiling(300000); // Enable for 5 minutes
}
```

**Environment Behavior:**
- **Development**: Full profiling, heap dumps, 100% sampling
- **Staging**: Reduced sampling (10%), no heap dumps
- **Production**: Standby mode, triggered profiling only

### 2. MemoryMonitor - The Guardian

Real-time monitoring with intelligent alerting:

```javascript
const monitor = new MemoryMonitor({
  alertThreshold: 400 * 1024 * 1024,     // 400MB threshold
  checkInterval: 30000,                  // Check every 30 seconds
  maxConsecutiveAlerts: 3,               // Prevent alert spam
  onAlert: (type, stats) => {
    console.error(`🚨 MEMORY ALERT: ${type}`);
    console.error(`Current Usage: ${stats.heapUsedMB}MB`);
    console.error(`RSS: ${stats.rssMB}MB`);
    
    // Integration examples:
    // sendToSlack(type, stats);
    // sendToDataDog(type, stats);
    // triggerPagerDuty(type, stats);
  }
});

monitor.start();

// Manual operations
monitor.forceGC();                    // Force garbage collection
const stats = monitor.getCurrentStats(); // Get current memory stats
```

**Alert Types:**
- `HIGH_MEMORY`: Memory usage exceeds threshold
- `RAPID_GROWTH`: Memory growing faster than 1MB/second

### 3. LeakDetector - The Detective

Advanced AI-powered leak detection with pattern recognition:

```javascript
const detector = new LeakDetector({
  sampleWindow: 20,                      // Analyze last 20 samples
  leakThreshold: 5 * 1024 * 1024,       // 5MB minimum leak size
  checkInterval: 60000,                  // Check every minute
  onLeakDetected: (leak) => {
    console.warn(`🔍 LEAK DETECTED: ${leak.type}`);
    console.warn(`Severity: ${leak.severity}`);
    console.warn(`Growth: ${leak.totalGrowth}MB over ${leak.duration}s`);
    console.warn(`Confidence: ${leak.confidence.toFixed(1)}%`);
    
    // Take action based on severity
    if (leak.severity === 'high') {
      // sendCriticalAlert(leak);
      // captureHeapDump();
    }
  }
});

detector.start();

// Analyze leak patterns
const leaks = detector.getLeakHistory();
const samples = detector.getSamples();
```

## 🧠 Leak Detection Patterns

The library uses advanced algorithms to detect 4 types of memory leaks:

### 1. Consistent Growth
```
Memory ↗️ Steady upward trend
Example: Unbounded cache, event listeners not removed
Confidence: Based on R-squared correlation
```

### 2. Exponential Growth
```
Memory 📈 Accelerating increase
Example: Recursive object creation, circular references
Confidence: Growth factor analysis
```

### 3. Sudden Spikes
```
Memory ⬆️ Large instant increases
Example: Large file loading, memory pool exhaustion
Confidence: Spike magnitude analysis
```

### 4. Periodic Leaks
```
Memory 〰️ Regular spike patterns
Example: Interval-based leaks, batch processing issues
Confidence: Pattern frequency analysis
```

## 🏭 Production Usage

### Express.js Integration

```javascript
const express = require('express');
const { MemoryProfiler, MemoryMonitor } = require('omniprofiler');

const app = express();

// Initialize with production-safe defaults
const profiler = new MemoryProfiler();
const monitor = new MemoryMonitor({
  onAlert: (type, stats) => {
    // Send to your monitoring service
    sendToDataDog({
      metric: 'memory.alert',
      value: stats.heapUsedMB,
      tags: [`type:${type}`, `env:${process.env.NODE_ENV}`]
    });
  }
});

// Start monitoring (profiler starts in standby for production)
profiler.start();
monitor.start();

// Admin endpoints for production control
app.post('/admin/profiling/enable', authenticateAdmin, (req, res) => {
  const duration = parseInt(req.body.duration) || 300000; // 5 min default
  
  profiler.enableProfiling(duration);
  
  res.json({
    message: 'Profiling enabled',
    duration: duration / 1000,
    expiresAt: new Date(Date.now() + duration).toISOString()
  });
});

app.get('/admin/memory/stats', authenticateAdmin, (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    profiler: profiler.getStats(),
    monitor: monitor.getCurrentStats(),
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      version: process.version,
      platform: process.platform
    }
  });
});

app.post('/admin/memory/gc', authenticateAdmin, (req, res) => {
  const freed = monitor.forceGC();
  res.json({
    message: 'Garbage collection triggered',
    freedMB: freed,
    timestamp: new Date().toISOString()
  });
});

// Health check with memory status
app.get('/health', (req, res) => {
  const stats = monitor.getCurrentStats();
  const isHealthy = stats.heapUsed < 500; // 500MB threshold
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    memory: stats,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  profiler.stop();
  monitor.stop();
  process.exit(0);
});
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

# Enable garbage collection access
ENV NODE_OPTIONS="--expose-gc --max-old-space-size=2048"

# Your app setup
COPY . .
RUN npm install

CMD ["node", "app.js"]
```

### Kubernetes Health Checks

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## ⚙️ Advanced Configuration System

### 🎛️ Configuration Categories

The library provides **enterprise-level configurability** across **10 major categories**:

1. **Core Settings** - Basic profiler behavior
2. **Universal Profiler** - Multi-language detection
3. **Memory Profiler** - Environment-specific profiling
4. **Leak Detector** - Advanced leak detection algorithms
5. **Monitor** - Real-time monitoring settings
6. **Integrations** - Third-party service connections
7. **Performance** - Resource usage controls
8. **Security** - Data privacy and access control
9. **Reporting** - Report generation and retention
10. **Advanced** - Experimental features and plugins

### 🔧 Configuration Sources (Priority Order)

1. **Environment Variables** (Highest priority)
2. **Config Files** (.memory-profiler.json, memory-profiler.config.js)
3. **package.json** "memoryProfiler" section
4. **Default Values** (Lowest priority)

### 📁 Configuration File Examples

#### memory-profiler.config.js
```javascript
module.exports = {
  core: {
    enabled: true,
    logLevel: 'info',
    maxMemoryMB: 1024
  },
  profiler: {
    development: {
      samplingRate: 1.0,
      heapDumps: true,
      alertThreshold: 100 * 1024 * 1024
    },
    production: {
      samplingRate: 0.01,
      heapDumps: false,
      alertThreshold: 500 * 1024 * 1024,
      triggerDuration: 300000
    }
  },
  leakDetector: {
    algorithms: {
      consistentGrowth: { enabled: true, rSquaredThreshold: 0.7 },
      exponentialGrowth: { enabled: true, growthFactor: 1.5 },
      suddenSpike: { enabled: true, threshold: 10 * 1024 * 1024 }
    },
    actions: {
      onLeak: 'alert',
      captureHeapDump: true
    }
  },
  integrations: {
    slack: {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      onLeak: true,
      onAlert: true
    },
    datadog: {
      enabled: process.env.NODE_ENV === 'production',
      apiKey: process.env.DATADOG_API_KEY,
      prefix: 'memory_profiler'
    }
  },
  performance: {
    maxCpuUsage: 0.15,
    maxMemoryOverhead: 50 * 1024 * 1024,
    adaptiveThrottling: true,
    circuitBreaker: { enabled: true, failureThreshold: 5 }
  },
  security: {
    sanitizeStackTraces: true,
    maskSensitiveData: true,
    adminEndpoints: {
      enabled: false,
      authentication: 'bearer'
    }
  }
};
```

#### package.json Integration
```json
{
  "name": "my-app",
  "memoryProfiler": {
    "core": {
      "enabled": true,
      "logLevel": "info"
    },
    "monitor": {
      "alertThreshold": 400000000,
      "autoGC": false
    },
    "reporting": {
      "enabled": true,
      "formats": ["html", "json"],
      "outputDir": "./reports"
    },
    "integrations": {
      "slack": {
        "enabled": true
      }
    }
  }
}
```

#### Environment Variables
```bash
# Core Settings
export OMNIPROFILER_ENABLED=true
export OMNIPROFILER_LOG_LEVEL=debug
export OMNIPROFILER_MAX_MEMORY_MB=2048

# Profiler Settings
export OMNIPROFILER_SAMPLING_RATE=0.5
export OMNIPROFILER_ALERT_THRESHOLD=500000000
export OMNIPROFILER_HEAP_DUMPS=true

# Report Settings (NEW)
export OMNIPROFILER_REPORT_DIR="/var/log/omniprofiler"
export OMNIPROFILER_REPORT_FORMAT="html,json,console"
export OMNIPROFILER_REPORT_ENABLED=true

# Integration Settings
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
export DATADOG_API_KEY=your-datadog-api-key
export NEWRELIC_LICENSE_KEY=your-newrelic-key

# Security Settings
export OMNIPROFILER_ADMIN_TOKEN=your-secure-token
export OMNIPROFILER_SANITIZE_TRACES=true

# Legacy Support (still works)
export MEMORY_PROFILER_REPORT_DIR="/legacy/path"
```

### Environment-Based Configuration

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Enabled** | ✅ Always | ✅ Always | 🔄 Triggered |
| **Sampling Rate** | 100% | 10% | 1% |
| **Heap Dumps** | ✅ Yes | ❌ No | ❌ No |
| **Stack Traces** | ✅ Detailed | ✅ Basic | ❌ None |
| **Check Interval** | 5s | 30s | 60s |
| **Max Samples** | 1000 | 500 | 100 |
| **Alert Threshold** | 100MB | 200MB | 500MB |
| **Auto-GC** | ❌ No | ❌ No | ✅ Optional |
| **Admin Endpoints** | ✅ Yes | ✅ Yes | 🔒 Secured |

### 🎛️ Detailed Configuration Options

#### 1. Core Settings
```javascript
core: {
  enabled: true,                    // Enable/disable profiler
  autoStart: true,                  // Auto-start on import
  environment: 'development',       // Auto-detected from NODE_ENV
  logLevel: 'info',                // silent, error, warn, info, debug, verbose
  maxMemoryMB: 1024,               // Global memory limit
  gracefulShutdown: true           // Clean shutdown on SIGTERM
}
```

#### 2. Universal Profiler
```javascript
universal: {
  autoDetect: true,                // Auto-detect languages
  scanDepth: 3,                    // Directory scan depth
  scanTimeout: 30000,              // Scan timeout (ms)
  supportedLanguages: [            // Languages to detect
    'javascript', 'typescript', 'python', 'java', 'go', 'csharp', 'cpp', 'rust', 'php'
  ],
  languageWeights: {               // Detection priority weights
    javascript: 1.0, typescript: 1.0, python: 0.9, java: 0.8
  },
  confidenceThreshold: 0.3,        // Minimum confidence to detect
  excludePatterns: [               // Patterns to ignore
    'node_modules/**', '.git/**', 'dist/**', 'build/**'
  ]
}
```

#### 3. Advanced Leak Detection
```javascript
leakDetector: {
  sampleWindow: 20,                // Samples to analyze
  checkInterval: 60000,            // Check frequency (ms)
  leakThreshold: 5 * 1024 * 1024,  // 5MB minimum leak size
  minConfidence: 70,               // Minimum confidence %
  
  algorithms: {
    consistentGrowth: {
      enabled: true,
      threshold: 100 * 1024,       // 100KB per sample
      rSquaredThreshold: 0.7,      // Statistical correlation
      minSamples: 10
    },
    exponentialGrowth: {
      enabled: true,
      growthFactor: 1.5,           // 50% growth factor
      minSamples: 5
    },
    suddenSpike: {
      enabled: true,
      threshold: 10 * 1024 * 1024, // 10MB sudden increase
      timeWindow: 5000             // 5 second window
    },
    periodicLeak: {
      enabled: true,
      minSpikes: 3,                // Minimum spikes to detect
      maxInterval: 300000          // 5 minute max interval
    }
  },
  
  actions: {
    onLeak: 'log',                 // log, alert, webhook, custom
    onCritical: 'alert',           // Action for critical leaks
    autoRestart: false,            // Auto-restart on critical leak
    captureHeapDump: false         // Capture heap dump on leak
  }
}
```

#### 4. Integration Settings
```javascript
integrations: {
  slack: {
    enabled: false,
    webhookUrl: null,              // Slack webhook URL
    channel: '#alerts',            // Target channel
    username: 'Memory Profiler',   // Bot username
    onLeak: true,                  // Send leak notifications
    onAlert: true                  // Send alert notifications
  },
  
  datadog: {
    enabled: false,
    apiKey: null,                  // DataDog API key
    host: 'localhost',             // StatsD host
    port: 8125,                    // StatsD port
    prefix: 'memory_profiler',     // Metric prefix
    tags: []                       // Additional tags
  },
  
  prometheus: {
    enabled: false,
    port: 9090,                    // Metrics server port
    endpoint: '/metrics',          // Metrics endpoint
    labels: {}                     // Additional labels
  },
  
  webhook: {
    enabled: false,
    url: null,                     // Webhook URL
    method: 'POST',                // HTTP method
    headers: {},                   // Custom headers
    timeout: 5000                  // Request timeout
  },
  
  email: {
    enabled: false,
    smtp: {
      host: null,
      port: 587,
      secure: false,
      auth: { user: null, pass: null }
    },
    from: null,                    // Sender email
    to: [],                        // Recipient emails
    subject: 'Memory Alert: {{type}}'  // Email subject template
  }
}
```

#### 5. Performance Controls
```javascript
performance: {
  maxCpuUsage: 0.15,               // 15% max CPU usage
  maxMemoryOverhead: 50 * 1024 * 1024,  // 50MB max overhead
  adaptiveThrottling: true,        // Auto-adjust based on load
  
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,           // Failures before opening
    timeout: 60000,                // Circuit open time
    resetTimeout: 300000           // Reset attempt time
  }
}
```

#### 6. Security Settings
```javascript
security: {
  sanitizeStackTraces: true,       // Remove sensitive paths
  excludePaths: ['/home/', '/Users/'],  // Paths to exclude
  maskSensitiveData: true,         // Mask PII in reports
  
  adminEndpoints: {
    enabled: false,                // Enable admin API
    path: '/admin/memory',         // Admin endpoint path
    authentication: 'bearer',      // none, basic, bearer, custom
    rateLimit: {
      windowMs: 15 * 60 * 1000,    // 15 minutes
      max: 10                      // Max requests per window
    }
  }
}
```

#### 7. Reporting Configuration
```javascript
reporting: {
  enabled: true,
  outputDir: './memory-reports',   // Report output directory
  formats: ['html', 'json'],       // Report formats
  autoGenerate: false,             // Auto-generate reports
  schedule: '0 */6 * * *',         // Cron schedule (every 6 hours)
  
  retention: {
    maxFiles: 50,                  // Max report files to keep
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days retention
  },
  
  templates: {
    html: 'default',               // HTML template
    email: 'minimal'               // Email template
  }
}
```

### 🔧 Runtime Configuration Management

```javascript
const ConfigManager = require('omniprofiler/config-manager');

// Initialize configuration manager
const config = new ConfigManager();

// Get configuration values
const samplingRate = config.get('profiler.development.samplingRate');
const alertThreshold = config.get('monitor.alertThreshold');

// Set configuration values at runtime
config.set('profiler.development.samplingRate', 0.5);
config.set('integrations.slack.enabled', true);

// Validate configuration
const errors = config.validate();
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
}

// Export configuration for backup
const exportedConfig = config.export();
fs.writeFileSync('backup-config.json', exportedConfig);
```

### 🚀 Configuration Usage Examples

#### Development Setup
```javascript
// memory-profiler.config.js
module.exports = {
  core: { logLevel: 'debug' },
  profiler: {
    development: {
      samplingRate: 1.0,
      heapDumps: true,
      detailedTracing: true
    }
  },
  leakDetector: {
    checkInterval: 10000,  // Check every 10 seconds
    algorithms: {
      consistentGrowth: { threshold: 50 * 1024 }  // 50KB threshold
    }
  }
};
```

#### Production Setup
```javascript
// memory-profiler.config.js
module.exports = {
  core: { logLevel: 'warn' },
  profiler: {
    production: {
      samplingRate: 0.01,
      triggerThreshold: 400 * 1024 * 1024,  // 400MB trigger
      triggerDuration: 300000                // 5 minutes
    }
  },
  integrations: {
    datadog: {
      enabled: true,
      apiKey: process.env.DATADOG_API_KEY,
      tags: ['service:my-app', 'env:production']
    },
    slack: {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      onLeak: true
    }
  },
  security: {
    adminEndpoints: {
      enabled: true,
      authentication: 'bearer'
    }
  }
};
```

#### Enterprise Setup with All Features
```javascript
// memory-profiler.config.js
module.exports = {
  core: {
    enabled: true,
    logLevel: 'info',
    maxMemoryMB: 2048
  },
  
  universal: {
    supportedLanguages: ['javascript', 'typescript', 'java', 'python'],
    languageWeights: { javascript: 1.0, typescript: 1.0, java: 0.9, python: 0.8 }
  },
  
  leakDetector: {
    algorithms: {
      consistentGrowth: { enabled: true, rSquaredThreshold: 0.8 },
      exponentialGrowth: { enabled: true, growthFactor: 1.3 },
      suddenSpike: { enabled: true, threshold: 20 * 1024 * 1024 }
    },
    actions: {
      onCritical: 'alert',
      captureHeapDump: true
    }
  },
  
  integrations: {
    datadog: {
      enabled: true,
      apiKey: process.env.DATADOG_API_KEY,
      prefix: 'myapp.memory'
    },
    prometheus: {
      enabled: true,
      port: 9090,
      labels: { service: 'my-app', version: '2.0.0' }
    },
    email: {
      enabled: true,
      smtp: {
        host: 'smtp.company.com',
        port: 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: 'alerts@company.com',
      to: ['devops@company.com', 'oncall@company.com']
    }
  },
  
  performance: {
    maxCpuUsage: 0.10,  // 10% max CPU
    adaptiveThrottling: true,
    circuitBreaker: { enabled: true, failureThreshold: 3 }
  },
  
  security: {
    sanitizeStackTraces: true,
    maskSensitiveData: true,
    adminEndpoints: {
      enabled: true,
      path: '/internal/memory',
      authentication: 'bearer',
      rateLimit: { max: 5, windowMs: 60000 }
    }
  },
  
  reporting: {
    enabled: true,
    formats: ['html', 'json'],
    schedule: '0 */4 * * *',  // Every 4 hours
    retention: { maxFiles: 100, maxAge: 14 * 24 * 60 * 60 * 1000 }  // 14 days
  }
};
```

### MemoryProfiler Options

```javascript
const profiler = new MemoryProfiler({
  // Core settings
  enabled: true,                        // Enable/disable profiling
  samplingRate: 1.0,                   // 0.0 to 1.0 (percentage of samples)
  maxSamples: 1000,                    // Maximum samples to keep in memory
  
  // Thresholds
  alertThreshold: 500 * 1024 * 1024,   // Memory threshold for alerts (bytes)
  leakThreshold: 5 * 1024 * 1024,      // Minimum leak size to detect (bytes)
  
  // Features
  heapDumps: true,                     // Enable heap dump generation
  detailedTracing: true,               // Capture stack traces
  
  // Intervals
  checkInterval: 30000,                // How often to check memory (ms)
  samplingInterval: 5000,              // How often to take samples (ms)
  
  // Callbacks
  onLeak: (leak) => { /* handle leak */ },
  onAlert: (type, stats) => { /* handle alert */ }
});
```

### MemoryMonitor Options

```javascript
const monitor = new MemoryMonitor({
  // Thresholds
  alertThreshold: 400 * 1024 * 1024,   // Memory alert threshold (bytes)
  rapidGrowthThreshold: 1024 * 1024,   // Rapid growth threshold (bytes/sec)
  
  // Timing
  checkInterval: 30000,                // Check frequency (ms)
  maxConsecutiveAlerts: 3,             // Prevent alert spam
  
  // Callbacks
  onAlert: (type, stats) => {
    // type: 'HIGH_MEMORY' | 'RAPID_GROWTH'
    // stats: { heapUsedMB, rssMB, timestamp, ... }
  }
});
```

### LeakDetector Options

```javascript
const detector = new LeakDetector({
  // Analysis window
  sampleWindow: 20,                    // Number of samples to analyze
  checkInterval: 60000,                // Analysis frequency (ms)
  
  // Detection thresholds
  leakThreshold: 5 * 1024 * 1024,      // Minimum leak size (bytes)
  consistentGrowthThreshold: 100 * 1024, // KB per sample for consistent growth
  exponentialGrowthFactor: 1.5,        // Growth factor for exponential detection
  suddenSpikeThreshold: 10 * 1024 * 1024, // Bytes for sudden spike detection
  
  // Confidence settings
  minConfidence: 70,                   // Minimum confidence to report leak (%)
  rSquaredThreshold: 0.7,              // R-squared threshold for trend analysis
  
  // Callbacks
  onLeakDetected: (leak) => {
    // leak: { type, severity, confidence, growthRate, totalGrowth, duration }
  }
});
```

## 📊 API Reference

### MemoryProfiler Methods

```javascript
// Lifecycle
profiler.start()                      // Start profiling
profiler.stop()                       // Stop profiling
profiler.enableProfiling(duration)    // Enable for specific duration (production)

// Data retrieval
profiler.getStats()                   // Get comprehensive statistics
profiler.getSamples()                 // Get raw memory samples
profiler.getConfig()                  // Get current configuration

// Utilities
profiler.takeSnapshot()               // Force memory snapshot
profiler.isEnabled()                  // Check if profiling is active
```

### MemoryMonitor Methods

```javascript
// Lifecycle
monitor.start()                       // Start monitoring
monitor.stop()                        // Stop monitoring

// Data retrieval
monitor.getCurrentStats()             // Get current memory statistics
monitor.getAlertHistory()             // Get alert history

// Operations
monitor.forceGC()                     // Force garbage collection
monitor.setThreshold(bytes)           // Update alert threshold
monitor.resetAlerts()                 // Clear alert counters
```

### LeakDetector Methods

```javascript
// Lifecycle
detector.start()                      // Start leak detection
detector.stop()                       // Stop leak detection

// Data retrieval
detector.getLeakHistory()             // Get detected leaks
detector.getSamples()                 // Get memory samples
detector.getAnalysis()                // Get latest analysis results

// Operations
detector.analyzeNow()                 // Force immediate analysis
detector.clearHistory()               // Clear leak history
```

## 🔧 Advanced Usage

### Custom Alert Handlers

```javascript
// Slack integration
const sendToSlack = async (type, stats) => {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  const message = {
    text: `🚨 Memory Alert: ${type}`,
    attachments: [{
      color: type === 'HIGH_MEMORY' ? 'danger' : 'warning',
      fields: [
        { title: 'Heap Used', value: `${stats.heapUsedMB}MB`, short: true },
        { title: 'RSS', value: `${stats.rssMB}MB`, short: true },
        { title: 'Environment', value: process.env.NODE_ENV, short: true },
        { title: 'Server', value: require('os').hostname(), short: true }
      ]
    }]
  };
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
};

// DataDog integration
const sendToDataDog = (metric) => {
  const StatsD = require('node-statsd');
  const client = new StatsD();
  
  client.gauge(metric.metric, metric.value, metric.tags);
};

// PagerDuty integration
const triggerPagerDuty = async (type, stats) => {
  const incident = {
    routing_key: process.env.PAGERDUTY_ROUTING_KEY,
    event_action: 'trigger',
    payload: {
      summary: `Memory Alert: ${type}`,
      severity: 'critical',
      source: require('os').hostname(),
      custom_details: stats
    }
  };
  
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incident)
  });
};
```

### Memory Leak Simulation (for testing)

```javascript
// Create different types of leaks for testing
class LeakSimulator {
  static consistentLeak() {
    const data = [];
    setInterval(() => {
      data.push(new Array(1000).fill('leak'));
    }, 1000);
  }
  
  static exponentialLeak() {
    let size = 100;
    const data = [];
    setInterval(() => {
      data.push(new Array(size).fill('leak'));
      size *= 1.1; // Exponential growth
    }, 1000);
  }
  
  static circularReference() {
    const objects = [];
    setInterval(() => {
      const obj1 = { data: new Array(1000).fill('data') };
      const obj2 = { data: new Array(1000).fill('data') };
      obj1.ref = obj2;
      obj2.ref = obj1;
      objects.push(obj1, obj2);
    }, 1000);
  }
}

// Use in development/testing
if (process.env.NODE_ENV === 'development') {
  // LeakSimulator.consistentLeak();
}
```

### CI/CD Integration

```yaml
# .github/workflows/memory-test.yml
name: Memory Leak Tests

on: [push, pull_request]

jobs:
  memory-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test
      
      # Memory leak test
      - name: Run memory leak detection
        run: |
          timeout 60s node --expose-gc test/memory-leak-test.js
          if [ $? -eq 124 ]; then
            echo "Memory test completed successfully"
          else
            echo "Memory test failed"
            exit 1
          fi
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
node test/profiler.test.js
```

### Run Examples

```bash
# Basic usage example
npm run example

# With garbage collection
node --expose-gc examples/basic-usage.js

# Production example (requires express)
npm install express
node examples/production-usage.js
```

### Memory Leak Testing

```bash
# Test with intentional leaks
node --expose-gc test/leak-simulation.js

# Monitor during load testing
node --expose-gc examples/load-test.js
```

## 🚨 Troubleshooting

### Common Issues

**1. "GC not available" message**
```bash
# Solution: Start with --expose-gc flag
node --expose-gc your-app.js
```

**2. High memory usage not detected**
```javascript
// Check your threshold settings
const monitor = new MemoryMonitor({
  alertThreshold: 100 * 1024 * 1024 // Lower threshold for testing
});
```

**3. No leaks detected in development**
```javascript
// Leaks might be too small or short-lived
const detector = new LeakDetector({
  leakThreshold: 1024 * 1024, // Lower threshold (1MB)
  sampleWindow: 10            // Smaller window
});
```

**4. Production profiling not working**
```javascript
// Ensure you're manually enabling it
profiler.enableProfiling(300000); // 5 minutes

// Or trigger via API
curl -X POST http://localhost:3000/admin/profiling/enable \
  -H "Content-Type: application/json" \
  -d '{"duration": 300000}'
```

### Debug Mode

```javascript
// Enable debug logging
process.env.DEBUG = 'smart-memory-profiler:*';

// Or set debug flag
const profiler = new MemoryProfiler({ debug: true });
```

### Performance Impact

| Environment | CPU Overhead | Memory Overhead | Recommended |
|-------------|--------------|-----------------|-------------|
| Development | 5-15% | 10-50MB | ✅ Always on |
| Staging | 2-5% | 5-20MB | ✅ Always on |
| Production | <1% | <5MB | ⚠️ Triggered only |

## 📈 Monitoring Integration

### DataDog

```javascript
const StatsD = require('node-statsd');
const client = new StatsD();

const monitor = new MemoryMonitor({
  onAlert: (type, stats) => {
    client.gauge('memory.heap_used', stats.heapUsedMB);
    client.gauge('memory.rss', stats.rssMB);
    client.increment('memory.alerts', 1, [`type:${type}`]);
  }
});
```

### New Relic

```javascript
const newrelic = require('newrelic');

const monitor = new MemoryMonitor({
  onAlert: (type, stats) => {
    newrelic.recordMetric('Custom/Memory/HeapUsed', stats.heapUsedMB);
    newrelic.recordMetric('Custom/Memory/RSS', stats.rssMB);
    newrelic.noticeError(new Error(`Memory Alert: ${type}`));
  }
});
```

### Prometheus

```javascript
const client = require('prom-client');

const heapUsedGauge = new client.Gauge({
  name: 'nodejs_heap_used_bytes',
  help: 'Heap used in bytes'
});

const monitor = new MemoryMonitor({
  onAlert: (type, stats) => {
    heapUsedGauge.set(stats.heapUsed);
  }
});
```

## 🔒 Security Considerations

### Admin Endpoint Security

```javascript
// Always authenticate admin endpoints
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Rate limiting
const rateLimit = require('express-rate-limit');
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/admin', adminLimiter, authenticateAdmin);
```

### Data Privacy

```javascript
// Sanitize sensitive data in stack traces
const profiler = new MemoryProfiler({
  sanitizeStackTrace: (trace) => {
    return trace.map(frame => ({
      ...frame,
      // Remove sensitive file paths
      file: frame.file.replace(/\/home\/[^/]+/, '/home/***')
    }));
  }
});
```

## 📚 Examples Repository

Complete examples available in the `/examples` directory:

- **`basic-usage.js`** - Simple setup and monitoring
- **`production-usage.js`** - Production Express.js integration
- **`leak-simulation.js`** - Different types of memory leaks
- **`monitoring-integration.js`** - DataDog, New Relic, Prometheus
- **`docker-example/`** - Docker and Kubernetes setup
- **`ci-cd-example/`** - GitHub Actions integration

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/your-org/omniprofiler.git
cd omniprofiler
npm install
npm test
```

### Running Tests

```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:memory      # Memory leak tests
npm run test:all         # All tests
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [Full API docs](https://docs.omniprofiler.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/omniprofiler/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/omniprofiler/discussions)
- 📧 **Email**: support@omniprofiler.com

## 🙏 Acknowledgments

- Node.js team for V8 profiling APIs
- Community contributors and testers
- Inspired by clinic.js and memwatch-next

---

**Made with ❤️ for the global developer community**

---

**OmniProfiler** - *Universal Memory Profiling for Modern Applications*