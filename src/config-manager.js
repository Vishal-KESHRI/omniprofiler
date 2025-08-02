const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.defaultConfig = this._getDefaultConfig();
    this.userConfig = {};
    this.finalConfig = {};
    this._loadConfigurations();
  }

  _getDefaultConfig() {
    return {
      // Core Settings
      core: {
        enabled: true,
        autoStart: true,
        environment: process.env.NODE_ENV || 'development',
        logLevel: 'info', // 'silent', 'error', 'warn', 'info', 'debug', 'verbose'
        maxMemoryMB: 1024, // Global memory limit
        gracefulShutdown: true
      },

      // Universal Profiler
      universal: {
        autoDetect: true,
        scanDepth: 3,
        scanTimeout: 30000,
        supportedLanguages: [
          'javascript', 'typescript', 'python', 'java', 
          'go', 'csharp', 'cpp', 'rust', 'php'
        ],
        languageWeights: {
          javascript: 1.0,
          typescript: 1.0,
          python: 0.9,
          java: 0.8,
          go: 0.7,
          csharp: 0.6,
          cpp: 0.5,
          rust: 0.4,
          php: 0.3
        },
        confidenceThreshold: 0.3,
        excludePatterns: [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**',
          '*.log',
          '.env*'
        ]
      },

      // Memory Profiler
      profiler: {
        development: {
          enabled: true,
          samplingRate: 1.0,
          maxSamples: 1000,
          heapDumps: true,
          detailedTracing: true,
          stackTraceDepth: 10,
          samplingInterval: 5000,
          alertThreshold: 100 * 1024 * 1024, // 100MB
          captureOnLeak: true
        },
        staging: {
          enabled: true,
          samplingRate: 0.1,
          maxSamples: 500,
          heapDumps: false,
          detailedTracing: true,
          stackTraceDepth: 5,
          samplingInterval: 30000,
          alertThreshold: 200 * 1024 * 1024, // 200MB
          captureOnLeak: false
        },
        production: {
          enabled: false, // Triggered only
          samplingRate: 0.01,
          maxSamples: 100,
          heapDumps: false,
          detailedTracing: false,
          stackTraceDepth: 0,
          samplingInterval: 60000,
          alertThreshold: 500 * 1024 * 1024, // 500MB
          captureOnLeak: false,
          triggerThreshold: 400 * 1024 * 1024,
          triggerDuration: 300000 // 5 minutes
        }
      },

      // Memory Monitor
      monitor: {
        checkInterval: 30000,
        alertThreshold: 400 * 1024 * 1024,
        rapidGrowthThreshold: 1024 * 1024, // 1MB/sec
        maxConsecutiveAlerts: 3,
        alertCooldown: 60000,
        gcThreshold: 0.8, // Trigger GC at 80% memory
        autoGC: false,
        healthCheck: {
          enabled: true,
          endpoint: '/health/memory',
          interval: 60000
        }
      },

      // Leak Detector
      leakDetector: {
        sampleWindow: 20,
        checkInterval: 60000,
        leakThreshold: 5 * 1024 * 1024, // 5MB
        minConfidence: 70,
        algorithms: {
          consistentGrowth: {
            enabled: true,
            threshold: 100 * 1024, // 100KB per sample
            rSquaredThreshold: 0.7,
            minSamples: 10
          },
          exponentialGrowth: {
            enabled: true,
            growthFactor: 1.5,
            minSamples: 5
          },
          suddenSpike: {
            enabled: true,
            threshold: 10 * 1024 * 1024, // 10MB
            timeWindow: 5000 // 5 seconds
          },
          periodicLeak: {
            enabled: true,
            minSpikes: 3,
            maxInterval: 300000 // 5 minutes
          }
        },
        actions: {
          onLeak: 'log', // 'log', 'alert', 'webhook', 'custom'
          onCritical: 'alert',
          autoRestart: false,
          captureHeapDump: false
        }
      },

      // Reporting
      reporting: {
        enabled: true,
        outputDir: process.env.OMNIPROFILER_REPORT_DIR || process.env.MEMORY_PROFILER_REPORT_DIR || './omniprofiler-reports',
        formats: ['html', 'json'],
        autoGenerate: false,
        schedule: null, // '0 */6 * * *' for every 6 hours
        retention: {
          maxFiles: 50,
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        },
        templates: {
          html: 'default',
          email: 'minimal'
        }
      },

      // Integrations
      integrations: {
        slack: {
          enabled: false,
          webhookUrl: null,
          channel: '#alerts',
          username: 'Memory Profiler',
          onLeak: true,
          onAlert: true
        },
        datadog: {
          enabled: false,
          apiKey: null,
          host: 'localhost',
          port: 8125,
          prefix: 'memory_profiler',
          tags: []
        },
        newrelic: {
          enabled: false,
          licenseKey: null,
          appName: 'Memory Profiler'
        },
        prometheus: {
          enabled: false,
          port: 9090,
          endpoint: '/metrics',
          labels: {}
        },
        webhook: {
          enabled: false,
          url: null,
          method: 'POST',
          headers: {},
          timeout: 5000
        },
        email: {
          enabled: false,
          smtp: {
            host: null,
            port: 587,
            secure: false,
            auth: { user: null, pass: null }
          },
          from: null,
          to: [],
          subject: 'Memory Alert: {{type}}'
        }
      },

      // Performance
      performance: {
        maxCpuUsage: 0.15, // 15% max CPU usage
        maxMemoryOverhead: 50 * 1024 * 1024, // 50MB max overhead
        adaptiveThrottling: true,
        circuitBreaker: {
          enabled: true,
          failureThreshold: 5,
          timeout: 60000,
          resetTimeout: 300000
        }
      },

      // Security
      security: {
        sanitizeStackTraces: true,
        excludePaths: ['/home/', '/Users/'],
        maskSensitiveData: true,
        adminEndpoints: {
          enabled: false,
          path: '/admin/memory',
          authentication: 'bearer', // 'none', 'basic', 'bearer', 'custom'
          rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10
          }
        }
      },

      // Advanced
      advanced: {
        customMetrics: {},
        plugins: [],
        hooks: {
          beforeStart: null,
          afterStart: null,
          beforeStop: null,
          afterStop: null,
          onLeak: null,
          onAlert: null
        },
        experimental: {
          mlLeakDetection: false,
          predictiveAnalysis: false,
          crossLanguageCorrelation: false
        }
      }
    };
  }

  _loadConfigurations() {
    // 1. Load from package.json
    this._loadFromPackageJson();
    
    // 2. Load from config files
    this._loadFromConfigFiles();
    
    // 3. Load from environment variables
    this._loadFromEnvironment();
    
    // 4. Merge all configurations
    this._mergeConfigurations();
  }

  _loadFromPackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (packageJson.memoryProfiler) {
          this.userConfig.package = packageJson.memoryProfiler;
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  _loadFromConfigFiles() {
    const configFiles = [
      'memory-profiler.config.js',
      'memory-profiler.config.json',
      '.memory-profiler.json',
      '.memory-profilerrc'
    ];

    for (const configFile of configFiles) {
      try {
        const configPath = path.join(process.cwd(), configFile);
        if (fs.existsSync(configPath)) {
          if (configFile.endsWith('.js')) {
            delete require.cache[require.resolve(configPath)];
            this.userConfig.file = require(configPath);
          } else {
            this.userConfig.file = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          }
          break;
        }
      } catch (error) {
        console.warn(`Failed to load config file ${configFile}:`, error.message);
      }
    }
  }

  _loadFromEnvironment() {
    const envConfig = {};
    
    // Core settings
    if (process.env.MEMORY_PROFILER_ENABLED) {
      envConfig.core = { enabled: process.env.MEMORY_PROFILER_ENABLED === 'true' };
    }
    
    if (process.env.MEMORY_PROFILER_LOG_LEVEL) {
      envConfig.core = { ...envConfig.core, logLevel: process.env.MEMORY_PROFILER_LOG_LEVEL };
    }

    // Profiler settings
    if (process.env.MEMORY_PROFILER_SAMPLING_RATE) {
      envConfig.profiler = {
        [this.defaultConfig.core.environment]: {
          samplingRate: parseFloat(process.env.MEMORY_PROFILER_SAMPLING_RATE)
        }
      };
    }

    // Monitor settings
    if (process.env.MEMORY_PROFILER_ALERT_THRESHOLD) {
      envConfig.monitor = {
        alertThreshold: parseInt(process.env.MEMORY_PROFILER_ALERT_THRESHOLD)
      };
    }

    // Reporting settings
    if (process.env.OMNIPROFILER_REPORT_DIR || process.env.MEMORY_PROFILER_REPORT_DIR) {
      envConfig.reporting = {
        outputDir: process.env.OMNIPROFILER_REPORT_DIR || process.env.MEMORY_PROFILER_REPORT_DIR
      };
    }
    
    if (process.env.OMNIPROFILER_REPORT_FORMAT) {
      envConfig.reporting = {
        ...envConfig.reporting,
        formats: process.env.OMNIPROFILER_REPORT_FORMAT.split(',')
      };
    }
    
    if (process.env.OMNIPROFILER_REPORT_ENABLED) {
      envConfig.reporting = {
        ...envConfig.reporting,
        enabled: process.env.OMNIPROFILER_REPORT_ENABLED === 'true'
      };
    }

    // Integration settings
    if (process.env.SLACK_WEBHOOK_URL) {
      envConfig.integrations = {
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        }
      };
    }

    if (process.env.DATADOG_API_KEY) {
      envConfig.integrations = {
        ...envConfig.integrations,
        datadog: {
          enabled: true,
          apiKey: process.env.DATADOG_API_KEY
        }
      };
    }

    this.userConfig.env = envConfig;
  }

  _mergeConfigurations() {
    this.finalConfig = this._deepMerge(
      this.defaultConfig,
      this.userConfig.package || {},
      this.userConfig.file || {},
      this.userConfig.env || {}
    );
  }

  _deepMerge(...objects) {
    const result = {};
    
    for (const obj of objects) {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          result[key] = this._deepMerge(result[key] || {}, obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
    }
    
    return result;
  }

  get(path) {
    return this._getNestedValue(this.finalConfig, path);
  }

  set(path, value) {
    this._setNestedValue(this.finalConfig, path, value);
  }

  getProfilerConfig() {
    const env = this.finalConfig.core.environment;
    return {
      ...this.finalConfig.profiler[env],
      ...this.finalConfig.core
    };
  }

  getMonitorConfig() {
    return {
      ...this.finalConfig.monitor,
      ...this.finalConfig.core
    };
  }

  getLeakDetectorConfig() {
    return {
      ...this.finalConfig.leakDetector,
      ...this.finalConfig.core
    };
  }

  getUniversalConfig() {
    return {
      ...this.finalConfig.universal,
      ...this.finalConfig.core
    };
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  _setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  validate() {
    const errors = [];
    
    // Validate core settings
    if (typeof this.finalConfig.core.enabled !== 'boolean') {
      errors.push('core.enabled must be a boolean');
    }

    // Validate thresholds
    const alertThreshold = this.get('monitor.alertThreshold');
    if (alertThreshold && (alertThreshold < 0 || alertThreshold > 8 * 1024 * 1024 * 1024)) {
      errors.push('monitor.alertThreshold must be between 0 and 8GB');
    }

    // Validate sampling rate
    const samplingRate = this.get(`profiler.${this.finalConfig.core.environment}.samplingRate`);
    if (samplingRate && (samplingRate < 0 || samplingRate > 1)) {
      errors.push('profiler.samplingRate must be between 0 and 1');
    }

    return errors;
  }

  export() {
    return JSON.stringify(this.finalConfig, null, 2);
  }

  reset() {
    this.finalConfig = { ...this.defaultConfig };
  }
}

module.exports = ConfigManager;