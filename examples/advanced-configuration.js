const { MemoryProfiler, MemoryMonitor, LeakDetector, UniversalMemoryProfiler } = require('../index');
const ConfigManager = require('../src/config-manager');

// Demonstrate advanced configuration capabilities
async function demonstrateAdvancedConfiguration() {
  console.log('⚙️ Advanced Configuration Demo');
  console.log('==============================\n');

  // 1. Initialize configuration manager
  const config = new ConfigManager();
  
  console.log('📋 Available Configuration Options:');
  console.log('==================================');
  
  // Show all configuration categories
  const categories = [
    'Core Settings',
    'Universal Profiler', 
    'Memory Profiler (Environment-specific)',
    'Memory Monitor',
    'Leak Detector',
    'Reporting',
    'Integrations',
    'Performance',
    'Security',
    'Advanced Features'
  ];
  
  categories.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });

  console.log('\n🔧 Configuration Sources (Priority Order):');
  console.log('==========================================');
  console.log('1. Environment Variables (Highest)');
  console.log('2. Config Files (.memory-profiler.json, memory-profiler.config.js)');
  console.log('3. package.json "memoryProfiler" section');
  console.log('4. Default Values (Lowest)');

  // 2. Show current configuration
  console.log('\n📊 Current Configuration:');
  console.log('========================');
  
  const profilerConfig = config.getProfilerConfig();
  console.log(`Environment: ${profilerConfig.environment}`);
  console.log(`Profiler Enabled: ${profilerConfig.enabled}`);
  console.log(`Sampling Rate: ${profilerConfig.samplingRate}`);
  console.log(`Alert Threshold: ${Math.round(profilerConfig.alertThreshold / 1024 / 1024)}MB`);
  console.log(`Heap Dumps: ${profilerConfig.heapDumps}`);

  // 3. Demonstrate runtime configuration changes
  console.log('\n🔄 Runtime Configuration Changes:');
  console.log('=================================');
  
  // Change sampling rate
  config.set('profiler.development.samplingRate', 0.5);
  console.log('✅ Changed sampling rate to 50%');
  
  // Change alert threshold
  config.set('monitor.alertThreshold', 200 * 1024 * 1024);
  console.log('✅ Changed alert threshold to 200MB');
  
  // Enable Slack integration
  config.set('integrations.slack.enabled', true);
  config.set('integrations.slack.webhookUrl', 'https://hooks.slack.com/services/...');
  console.log('✅ Enabled Slack integration');

  // 4. Create components with custom configuration
  console.log('\n🚀 Creating Components with Custom Config:');
  console.log('==========================================');

  const customProfiler = new MemoryProfiler({
    ...config.getProfilerConfig(),
    onLeak: (leak) => {
      console.log(`🔴 Custom Profiler - Leak: ${leak.type} (${leak.severity})`);
      
      // Custom leak handling based on configuration
      const slackConfig = config.get('integrations.slack');
      if (slackConfig.enabled && slackConfig.onLeak) {
        console.log('📤 Would send Slack notification');
      }
    },
    onAlert: (type, stats) => {
      console.log(`⚠️ Custom Profiler - Alert: ${type}`);
      
      // Custom alert handling
      const emailConfig = config.get('integrations.email');
      if (emailConfig.enabled) {
        console.log('📧 Would send email alert');
      }
    }
  });

  const customMonitor = new MemoryMonitor({
    ...config.getMonitorConfig(),
    onAlert: (type, stats) => {
      console.log(`🔔 Custom Monitor - ${type}: ${Math.round(stats.heapUsedMB)}MB`);
      
      // Auto-GC based on configuration
      const autoGC = config.get('monitor.autoGC');
      if (autoGC && type === 'HIGH_MEMORY') {
        console.log('🗑️ Auto-triggering garbage collection');
      }
    }
  });

  const customDetector = new LeakDetector({
    ...config.getLeakDetectorConfig(),
    onLeakDetected: (leak) => {
      console.log(`🔍 Custom Detector - ${leak.type}: ${leak.confidence.toFixed(1)}% confidence`);
      
      // Custom actions based on configuration
      const actions = config.get('leakDetector.actions');
      
      if (actions.onCritical === 'alert' && leak.severity === 'high') {
        console.log('🚨 Triggering critical alert');
      }
      
      if (actions.captureHeapDump && leak.severity === 'high') {
        console.log('📸 Would capture heap dump');
      }
    }
  });

  // 5. Show configuration validation
  console.log('\n✅ Configuration Validation:');
  console.log('============================');
  
  const validationErrors = config.validate();
  if (validationErrors.length === 0) {
    console.log('✅ All configuration values are valid');
  } else {
    console.log('❌ Configuration errors found:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
  }

  // 6. Demonstrate environment-specific configs
  console.log('\n🌍 Environment-Specific Configuration:');
  console.log('=====================================');
  
  const environments = ['development', 'staging', 'production'];
  environments.forEach(env => {
    const envConfig = config.get(`profiler.${env}`);
    console.log(`\n${env.toUpperCase()}:`);
    console.log(`  Enabled: ${envConfig.enabled}`);
    console.log(`  Sampling Rate: ${envConfig.samplingRate}`);
    console.log(`  Max Samples: ${envConfig.maxSamples}`);
    console.log(`  Heap Dumps: ${envConfig.heapDumps}`);
    console.log(`  Alert Threshold: ${Math.round(envConfig.alertThreshold / 1024 / 1024)}MB`);
  });

  // 7. Show integration configurations
  console.log('\n🔗 Available Integrations:');
  console.log('==========================');
  
  const integrations = config.get('integrations');
  Object.keys(integrations).forEach(integration => {
    const integrationConfig = integrations[integration];
    console.log(`${integration.toUpperCase()}: ${integrationConfig.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  });

  // 8. Advanced features
  console.log('\n🧪 Advanced Features:');
  console.log('====================');
  
  const advanced = config.get('advanced');
  console.log(`Custom Metrics: ${Object.keys(advanced.customMetrics).length} defined`);
  console.log(`Plugins: ${advanced.plugins.length} loaded`);
  console.log(`ML Leak Detection: ${advanced.experimental.mlLeakDetection ? '✅' : '❌'}`);
  console.log(`Predictive Analysis: ${advanced.experimental.predictiveAnalysis ? '✅' : '❌'}`);

  // 9. Performance settings
  console.log('\n⚡ Performance Configuration:');
  console.log('============================');
  
  const performance = config.get('performance');
  console.log(`Max CPU Usage: ${(performance.maxCpuUsage * 100).toFixed(1)}%`);
  console.log(`Max Memory Overhead: ${Math.round(performance.maxMemoryOverhead / 1024 / 1024)}MB`);
  console.log(`Adaptive Throttling: ${performance.adaptiveThrottling ? '✅' : '❌'}`);
  console.log(`Circuit Breaker: ${performance.circuitBreaker.enabled ? '✅' : '❌'}`);

  // 10. Security settings
  console.log('\n🔒 Security Configuration:');
  console.log('=========================');
  
  const security = config.get('security');
  console.log(`Sanitize Stack Traces: ${security.sanitizeStackTraces ? '✅' : '❌'}`);
  console.log(`Mask Sensitive Data: ${security.maskSensitiveData ? '✅' : '❌'}`);
  console.log(`Admin Endpoints: ${security.adminEndpoints.enabled ? '✅' : '❌'}`);
  console.log(`Excluded Paths: ${security.excludePaths.length} patterns`);

  // Start components
  console.log('\n🚀 Starting Components with Custom Configuration:');
  console.log('=================================================');
  
  customProfiler.start();
  customMonitor.start();
  customDetector.start();
  
  console.log('✅ All components started with custom configuration');

  // Simulate some activity
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Stop components
  customProfiler.stop();
  customMonitor.stop();
  customDetector.stop();
  
  console.log('🛑 All components stopped');

  // 11. Export configuration
  console.log('\n📤 Configuration Export:');
  console.log('========================');
  console.log('Configuration can be exported as JSON for backup or sharing');
  
  // Show sample of exported config (truncated)
  const exportedConfig = JSON.parse(config.export());
  console.log('Sample exported configuration:');
  console.log(JSON.stringify({
    core: exportedConfig.core,
    profiler: { development: exportedConfig.profiler.development }
  }, null, 2));
}

// Example configuration file content
function showExampleConfigFiles() {
  console.log('\n📁 Example Configuration Files:');
  console.log('===============================');

  console.log('\n1. memory-profiler.config.js:');
  console.log('```javascript');
  console.log(`module.exports = {
  core: {
    enabled: true,
    logLevel: 'info'
  },
  profiler: {
    development: {
      samplingRate: 1.0,
      heapDumps: true
    },
    production: {
      samplingRate: 0.01,
      heapDumps: false
    }
  },
  integrations: {
    slack: {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      onLeak: true
    },
    datadog: {
      enabled: process.env.NODE_ENV === 'production',
      apiKey: process.env.DATADOG_API_KEY
    }
  }
};`);
  console.log('```');

  console.log('\n2. package.json section:');
  console.log('```json');
  console.log(`{
  "memoryProfiler": {
    "core": {
      "enabled": true
    },
    "monitor": {
      "alertThreshold": 400000000
    },
    "reporting": {
      "enabled": true,
      "formats": ["html", "json"]
    }
  }
}`);
  console.log('```');

  console.log('\n3. Environment Variables:');
  console.log('```bash');
  console.log(`export MEMORY_PROFILER_ENABLED=true
export MEMORY_PROFILER_LOG_LEVEL=debug
export MEMORY_PROFILER_SAMPLING_RATE=0.5
export MEMORY_PROFILER_ALERT_THRESHOLD=500000000
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
export DATADOG_API_KEY=your-api-key`);
  console.log('```');
}

// Run the demo
demonstrateAdvancedConfiguration()
  .then(() => {
    showExampleConfigFiles();
    console.log('\n✅ Advanced configuration demo completed!');
  })
  .catch(console.error);