const { autoProfile, generateReport } = require('../index');

async function demonstrateEnvConfiguration() {
  console.log('🌍 Environment Configuration Demo');
  console.log('=================================\n');

  console.log('📋 Available Environment Variables:');
  console.log('===================================');
  
  // Core settings
  console.log('\n🔧 Core Settings:');
  console.log('  OMNIPROFILER_ENABLED=true|false');
  console.log('  OMNIPROFILER_LOG_LEVEL=silent|error|warn|info|debug|verbose');
  console.log('  OMNIPROFILER_MAX_MEMORY_MB=1024');
  
  // Profiler settings
  console.log('\n📊 Profiler Settings:');
  console.log('  OMNIPROFILER_SAMPLING_RATE=0.5');
  console.log('  OMNIPROFILER_ALERT_THRESHOLD=500000000');
  console.log('  OMNIPROFILER_HEAP_DUMPS=true|false');
  
  // Report settings
  console.log('\n📋 Report Settings:');
  console.log('  OMNIPROFILER_REPORT_DIR=/path/to/reports');
  console.log('  OMNIPROFILER_REPORT_FORMAT=html,json,console');
  console.log('  OMNIPROFILER_REPORT_ENABLED=true|false');
  
  // Integration settings
  console.log('\n🔗 Integration Settings:');
  console.log('  SLACK_WEBHOOK_URL=https://hooks.slack.com/...');
  console.log('  DATADOG_API_KEY=your-api-key');
  console.log('  NEWRELIC_LICENSE_KEY=your-license-key');
  
  // Security settings
  console.log('\n🔒 Security Settings:');
  console.log('  OMNIPROFILER_ADMIN_TOKEN=your-secure-token');
  console.log('  OMNIPROFILER_SANITIZE_TRACES=true|false');

  console.log('\n🎯 Current Environment Configuration:');
  console.log('====================================');
  
  // Show current env vars
  const envVars = {
    'Report Directory': process.env.OMNIPROFILER_REPORT_DIR || 'Default: ./omniprofiler-reports',
    'Report Format': process.env.OMNIPROFILER_REPORT_FORMAT || 'Default: html',
    'Report Enabled': process.env.OMNIPROFILER_REPORT_ENABLED || 'Default: true',
    'Profiler Enabled': process.env.OMNIPROFILER_ENABLED || 'Default: true',
    'Log Level': process.env.OMNIPROFILER_LOG_LEVEL || 'Default: info',
    'Sampling Rate': process.env.OMNIPROFILER_SAMPLING_RATE || 'Default: environment-based',
    'Alert Threshold': process.env.OMNIPROFILER_ALERT_THRESHOLD || 'Default: environment-based',
    'Slack Webhook': process.env.SLACK_WEBHOOK_URL ? '✅ Configured' : '❌ Not set',
    'DataDog API': process.env.DATADOG_API_KEY ? '✅ Configured' : '❌ Not set'
  };

  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  console.log('\n🚀 Testing Environment-Based Configuration:');
  console.log('===========================================');

  try {
    // Start profiling with env-based config
    const profiler = await autoProfile();
    
    // Generate report using environment configuration
    const reports = await generateReport(profiler, null, {
      // These will be overridden by environment variables if set
      outputDir: './default-reports',
      format: 'html'
    });

    console.log('\n✅ Report Generation Results:');
    if (reports.html) {
      console.log(`📊 HTML Report: ${reports.html}`);
    }
    if (reports.json) {
      console.log(`📄 JSON Report: ${reports.json}`);
    }

    // Show effective configuration
    const reportDir = process.env.OMNIPROFILER_REPORT_DIR || 
                     process.env.MEMORY_PROFILER_REPORT_DIR || 
                     './omniprofiler-reports';
    
    console.log(`\n📁 Effective Report Directory: ${reportDir}`);
    console.log(`📋 Report saved using environment configuration`);

    profiler.stop();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n💡 Usage Examples:');
  console.log('==================');
  
  console.log('\n1. Custom Report Directory:');
  console.log('```bash');
  console.log('export OMNIPROFILER_REPORT_DIR="/var/log/omniprofiler"');
  console.log('node your-app.js');
  console.log('```');
  
  console.log('\n2. Multiple Report Formats:');
  console.log('```bash');
  console.log('export OMNIPROFILER_REPORT_FORMAT="html,json,console"');
  console.log('node your-app.js');
  console.log('```');
  
  console.log('\n3. Production Configuration:');
  console.log('```bash');
  console.log('export NODE_ENV=production');
  console.log('export OMNIPROFILER_REPORT_DIR="/opt/app/reports"');
  console.log('export OMNIPROFILER_SAMPLING_RATE=0.01');
  console.log('export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."');
  console.log('export DATADOG_API_KEY="your-api-key"');
  console.log('node your-app.js');
  console.log('```');
  
  console.log('\n4. Docker Configuration:');
  console.log('```dockerfile');
  console.log('ENV OMNIPROFILER_REPORT_DIR=/app/reports');
  console.log('ENV OMNIPROFILER_REPORT_FORMAT=json');
  console.log('ENV OMNIPROFILER_LOG_LEVEL=warn');
  console.log('VOLUME ["/app/reports"]');
  console.log('```');
  
  console.log('\n5. Kubernetes ConfigMap:');
  console.log('```yaml');
  console.log('apiVersion: v1');
  console.log('kind: ConfigMap');
  console.log('metadata:');
  console.log('  name: omniprofiler-config');
  console.log('data:');
  console.log('  OMNIPROFILER_REPORT_DIR: "/var/omniprofiler/reports"');
  console.log('  OMNIPROFILER_REPORT_FORMAT: "json"');
  console.log('  OMNIPROFILER_LOG_LEVEL: "info"');
  console.log('```');
}

// Set some example environment variables for demo
process.env.OMNIPROFILER_REPORT_DIR = './env-configured-reports';
process.env.OMNIPROFILER_REPORT_FORMAT = 'html,json';
process.env.OMNIPROFILER_LOG_LEVEL = 'debug';

demonstrateEnvConfiguration().catch(console.error);