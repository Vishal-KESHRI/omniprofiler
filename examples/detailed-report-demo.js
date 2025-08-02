const { UniversalMemoryProfiler, LeakDetector } = require('../index');
const ReportGenerator = require('../src/report-generator');

async function demonstrateDetailedReporting() {
  console.log('🔍 Detailed Memory Report Demo');
  console.log('===============================\n');

  // Initialize components
  const universalProfiler = new UniversalMemoryProfiler();
  const leakDetector = new LeakDetector({
    checkInterval: 2000,
    onLeakDetected: (leak) => {
      console.log(`🚨 LEAK DETECTED: ${leak.type} (${leak.severity})`);
    }
  });
  
  const reportGenerator = new ReportGenerator({
    outputDir: './memory-reports',
    format: 'all', // Generate HTML, JSON, and console reports
    includeStackTraces: true
  });

  try {
    // Start profiling
    await universalProfiler.start();
    leakDetector.start();

    console.log('📊 Collecting memory data...\n');

    // Simulate memory usage and potential leaks
    await simulateMemoryPatterns();

    // Wait for leak detection
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n📋 Generating detailed reports...\n');

    // Generate comprehensive report
    const reports = await reportGenerator.generateDetailedReport(
      universalProfiler, 
      leakDetector
    );

    console.log('\n✅ Reports generated:');
    if (reports.html) {
      console.log(`📊 HTML Report: ${reports.html}`);
      console.log('   Open in browser to see visual analysis');
    }
    if (reports.json) {
      console.log(`📄 JSON Report: ${reports.json}`);
      console.log('   Machine-readable format for automation');
    }

    // Show how to access specific leak information
    console.log('\n🔍 LEAK ANALYSIS DETAILS:');
    const leakHistory = leakDetector.getLeakHistory();
    
    if (leakHistory.length > 0) {
      leakHistory.forEach((leak, index) => {
        console.log(`\nLeak #${index + 1}:`);
        console.log(`  📍 Location: ${getLeakLocation(leak)}`);
        console.log(`  📈 Growth Pattern: ${leak.type}`);
        console.log(`  ⚠️  Severity: ${leak.severity}`);
        console.log(`  📊 Growth Rate: ${leak.growthRate}KB/sec`);
        console.log(`  📏 Total Growth: ${leak.totalGrowth}MB`);
        console.log(`  🎯 Confidence: ${leak.confidence.toFixed(1)}%`);
        console.log(`  ⏱️  Duration: ${leak.duration}s`);
        console.log(`  💡 Recommended Actions:`);
        getSolutionsForLeak(leak).forEach(solution => {
          console.log(`     - ${solution}`);
        });
      });
    } else {
      console.log('  ✅ No memory leaks detected');
    }

    // Show memory usage by language
    console.log('\n🌍 MEMORY USAGE BY LANGUAGE:');
    const allStats = await universalProfiler.getAllMemoryStats();
    
    for (const [lang, data] of Object.entries(allStats.languages)) {
      if (data.error) {
        console.log(`  ${lang}: ❌ ${data.error}`);
        continue;
      }

      const memoryMB = getMemoryUsage(lang, data);
      const status = memoryMB > 100 ? '🔴 HIGH' : memoryMB > 50 ? '🟡 MEDIUM' : '🟢 LOW';
      
      console.log(`  ${lang}: ${status} (${Math.round(memoryMB)}MB)`);
      
      // Show specific metrics
      const details = getLanguageSpecificDetails(lang, data);
      Object.entries(details).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });

      // Show potential issues
      const issues = detectIssues(lang, data);
      if (issues.length > 0) {
        console.log(`    ⚠️  Issues:`);
        issues.forEach(issue => {
          console.log(`      - ${issue.message}`);
          console.log(`        Fix: ${issue.solution}`);
        });
      }
    }

    // Show trend analysis
    console.log('\n📈 MEMORY TRENDS:');
    const samples = leakDetector.getSamples();
    if (samples.length >= 5) {
      const trend = analyzeTrend(samples);
      console.log(`  Direction: ${trend.direction}`);
      console.log(`  Growth Rate: ${trend.growthRate}MB/min`);
      console.log(`  Prediction: ${trend.prediction}`);
    } else {
      console.log('  ⏳ Insufficient data for trend analysis');
    }

  } catch (error) {
    console.error('❌ Error during profiling:', error.message);
  } finally {
    // Cleanup
    universalProfiler.stop();
    leakDetector.stop();
  }
}

// Helper functions for detailed analysis
function getLeakLocation(leak) {
  if (leak.stackTrace && leak.stackTrace.length > 0) {
    const frame = leak.stackTrace[0];
    return `${frame.file}:${frame.line} in ${frame.function}()`;
  }
  return 'Location not available (enable stack traces)';
}

function getSolutionsForLeak(leak) {
  const solutions = {
    consistent_growth: [
      'Check for unbounded arrays or objects',
      'Verify event listeners are removed',
      'Look for closure memory retention',
      'Review cache implementations'
    ],
    exponential_growth: [
      'Investigate recursive object creation',
      'Check for memory amplification loops',
      'Review data structure growth',
      'Analyze algorithmic complexity'
    ],
    sudden_spike: [
      'Profile large object allocations',
      'Check file/data loading operations',
      'Review batch processing logic',
      'Analyze third-party library usage'
    ],
    periodic: [
      'Check interval-based operations',
      'Review batch job memory usage',
      'Analyze periodic data processing',
      'Check for incomplete cleanup cycles'
    ]
  };
  
  return solutions[leak.type] || ['Perform general memory optimization'];
}

function getMemoryUsage(lang, data) {
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

function getLanguageSpecificDetails(lang, data) {
  switch (lang) {
    case 'javascript':
      return {
        'Heap Used': `${Math.round((data.heapUsed || 0) / 1024 / 1024)}MB`,
        'Heap Total': `${Math.round((data.heapTotal || 0) / 1024 / 1024)}MB`,
        'RSS': `${Math.round((data.rss || 0) / 1024 / 1024)}MB`,
        'External': `${Math.round((data.external || 0) / 1024 / 1024)}MB`
      };
    case 'python':
      return {
        'RSS': `${Math.round((data.rss || 0) / 1024 / 1024)}MB`,
        'VMS': `${Math.round((data.vms || 0) / 1024 / 1024)}MB`,
        'Memory %': `${(data.percent || 0).toFixed(1)}%`,
        'Objects': data.object_count || 0
      };
    default:
      return { 'Status': 'Basic monitoring' };
  }
}

function detectIssues(lang, data) {
  const issues = [];
  const memoryMB = getMemoryUsage(lang, data);
  
  if (memoryMB > 200) {
    issues.push({
      message: `High memory usage: ${Math.round(memoryMB)}MB`,
      solution: 'Consider memory optimization or scaling'
    });
  }
  
  // Language-specific issue detection
  switch (lang) {
    case 'javascript':
      if (data.external > data.heapUsed) {
        issues.push({
          message: 'External memory exceeds heap memory',
          solution: 'Check for large buffers or native modules'
        });
      }
      break;
    case 'python':
      if (data.object_count > 50000) {
        issues.push({
          message: `High object count: ${data.object_count}`,
          solution: 'Implement object pooling or cleanup'
        });
      }
      break;
  }
  
  return issues;
}

function analyzeTrend(samples) {
  const recent = samples.slice(-5);
  const first = recent[0];
  const last = recent[recent.length - 1];
  
  const growthMB = last.heapUsedMB - first.heapUsedMB;
  const direction = growthMB > 2 ? 'INCREASING' : growthMB < -2 ? 'DECREASING' : 'STABLE';
  const growthRate = growthMB / (recent.length - 1); // MB per sample
  
  let prediction = 'Memory usage will remain stable';
  if (direction === 'INCREASING') {
    prediction = `Memory may reach ${Math.round(last.heapUsedMB + growthRate * 10)}MB in 10 samples`;
  } else if (direction === 'DECREASING') {
    prediction = 'Memory usage is improving';
  }
  
  return { direction, growthRate: growthRate.toFixed(2), prediction };
}

async function simulateMemoryPatterns() {
  console.log('🔄 Simulating different memory patterns...');
  
  // Simulate consistent growth (potential leak)
  global.memoryLeak = global.memoryLeak || [];
  
  for (let i = 0; i < 3; i++) {
    // Add objects that won't be garbage collected
    const data = new Array(10000).fill(0).map((_, idx) => ({
      id: Date.now() + idx,
      data: new Array(100).fill(`leak-data-${i}-${idx}`),
      timestamp: Date.now()
    }));
    
    global.memoryLeak.push(...data);
    
    console.log(`  📈 Added ${data.length} objects (total: ${global.memoryLeak.length})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Memory simulation complete');
}

// Run the demo
demonstrateDetailedReporting().catch(console.error);