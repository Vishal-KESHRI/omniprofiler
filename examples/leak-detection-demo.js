const { UniversalMemoryProfiler, LeakDetector, generateReport } = require('../index');

async function demonstrateLeakDetection() {
  console.log('🚨 Memory Leak Detection Demo');
  console.log('==============================\n');

  const universalProfiler = new UniversalMemoryProfiler();
  const leakDetector = new LeakDetector({
    checkInterval: 1000, // Check every second
    leakThreshold: 1024 * 1024, // 1MB threshold
    sampleWindow: 10,
    onLeakDetected: (leak) => {
      console.log(`\n🔴 LEAK DETECTED!`);
      console.log(`   Type: ${leak.type}`);
      console.log(`   Severity: ${leak.severity}`);
      console.log(`   Growth: ${leak.totalGrowth}MB in ${leak.duration}s`);
      console.log(`   Rate: ${leak.growthRate}KB/sec`);
      console.log(`   Confidence: ${leak.confidence.toFixed(1)}%`);
    }
  });

  try {
    await universalProfiler.start();
    leakDetector.start();

    console.log('🔄 Creating intentional memory leaks...\n');

    // Create different types of leaks
    await createConsistentLeak();
    await createSuddenSpike();
    await createExponentialLeak();

    // Wait for leak detection
    console.log('\n⏳ Waiting for leak detection analysis...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Generate detailed report
    console.log('\n📊 Generating detailed leak report...\n');
    
    const reports = await generateReport(universalProfiler, leakDetector, {
      format: 'all',
      outputDir: './leak-reports'
    });

    // Show detailed leak analysis
    const leakHistory = leakDetector.getLeakHistory();
    
    if (leakHistory.length > 0) {
      console.log('\n🔍 DETAILED LEAK ANALYSIS:');
      console.log('==========================');
      
      leakHistory.forEach((leak, index) => {
        console.log(`\n📍 LEAK #${index + 1}: ${leak.type.toUpperCase()}`);
        console.log(`   🚨 Severity: ${leak.severity.toUpperCase()}`);
        console.log(`   📈 Growth Pattern: ${getGrowthDescription(leak.type)}`);
        console.log(`   📊 Statistics:`);
        console.log(`      - Growth Rate: ${leak.growthRate}KB/sec`);
        console.log(`      - Total Growth: ${leak.totalGrowth}MB`);
        console.log(`      - Duration: ${leak.duration} seconds`);
        console.log(`      - Confidence: ${leak.confidence.toFixed(1)}%`);
        
        console.log(`   🎯 Root Cause Analysis:`);
        const causes = getRootCauses(leak.type);
        causes.forEach(cause => console.log(`      - ${cause}`));
        
        console.log(`   💡 Immediate Actions:`);
        const actions = getImmediateActions(leak.type, leak.severity);
        actions.forEach(action => console.log(`      - ${action}`));
        
        console.log(`   🔧 Long-term Solutions:`);
        const solutions = getLongTermSolutions(leak.type);
        solutions.forEach(solution => console.log(`      - ${solution}`));
        
        console.log(`   ⏰ Time to Critical:`);
        console.log(`      - ${calculateTimeToCritical(leak)}`);
      });
      
      // Show code locations (simulated)
      console.log('\n📂 SUSPECTED CODE LOCATIONS:');
      console.log('============================');
      leakHistory.forEach((leak, index) => {
        console.log(`\nLeak #${index + 1} likely sources:`);
        const locations = getLeakLocations(leak.type);
        locations.forEach(location => {
          console.log(`   📄 ${location.file}:${location.line}`);
          console.log(`      Function: ${location.function}`);
          console.log(`      Issue: ${location.issue}`);
          console.log(`      Fix: ${location.fix}`);
        });
      });
      
    } else {
      console.log('✅ No memory leaks detected in this session');
    }

    // Show memory usage trends
    console.log('\n📈 MEMORY USAGE TRENDS:');
    console.log('=======================');
    const samples = leakDetector.getSamples();
    if (samples.length >= 5) {
      showMemoryTrends(samples);
    }

    console.log(`\n📋 Reports saved:`);
    if (reports.html) console.log(`   🌐 HTML: ${reports.html}`);
    if (reports.json) console.log(`   📄 JSON: ${reports.json}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    universalProfiler.stop();
    leakDetector.stop();
  }
}

// Simulate different types of memory leaks
async function createConsistentLeak() {
  console.log('🔄 Creating consistent memory leak...');
  
  global.consistentLeak = global.consistentLeak || [];
  
  for (let i = 0; i < 5; i++) {
    // Simulate unbounded cache growth
    const data = new Array(5000).fill(0).map((_, idx) => ({
      id: `consistent-${Date.now()}-${idx}`,
      payload: new Array(200).fill(`data-${i}-${idx}`),
      timestamp: Date.now(),
      metadata: {
        created: new Date(),
        type: 'consistent-leak',
        size: 200
      }
    }));
    
    global.consistentLeak.push(...data);
    console.log(`   Added ${data.length} objects (total: ${global.consistentLeak.length})`);
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

async function createSuddenSpike() {
  console.log('🔄 Creating sudden memory spike...');
  
  // Simulate large file loading or batch processing
  global.suddenSpike = new Array(20000).fill(0).map((_, idx) => ({
    id: `spike-${idx}`,
    largeData: new Array(1000).fill(`large-data-${idx}`),
    buffer: Buffer.alloc(1024), // 1KB buffer each
    timestamp: Date.now()
  }));
  
  console.log(`   Created sudden spike: ${global.suddenSpike.length} large objects`);
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function createExponentialLeak() {
  console.log('🔄 Creating exponential memory leak...');
  
  global.exponentialLeak = global.exponentialLeak || [];
  let size = 1000;
  
  for (let i = 0; i < 4; i++) {
    const data = new Array(size).fill(0).map((_, idx) => ({
      id: `exp-${i}-${idx}`,
      data: new Array(100).fill(`exponential-${i}-${idx}`),
      children: [] // Could create circular references
    }));
    
    global.exponentialLeak.push(...data);
    console.log(`   Added ${data.length} objects (total: ${global.exponentialLeak.length})`);
    
    size = Math.floor(size * 1.5); // Exponential growth
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Analysis helper functions
function getGrowthDescription(type) {
  const descriptions = {
    consistent_growth: 'Steady, linear memory increase over time',
    exponential_growth: 'Accelerating memory consumption pattern',
    sudden_spike: 'Large, instantaneous memory allocation',
    periodic: 'Regular, cyclical memory usage spikes'
  };
  return descriptions[type] || 'Unknown growth pattern';
}

function getRootCauses(type) {
  const causes = {
    consistent_growth: [
      'Unbounded cache or collection growth',
      'Event listeners not being removed',
      'Closure variables holding references',
      'Incomplete object cleanup in loops'
    ],
    exponential_growth: [
      'Recursive object creation without limits',
      'Nested data structures growing unchecked',
      'Memory amplification in algorithms',
      'Circular reference chains'
    ],
    sudden_spike: [
      'Large file or data loading operations',
      'Batch processing without memory limits',
      'Third-party library memory allocation',
      'Buffer or array pre-allocation'
    ]
  };
  return causes[type] || ['Unknown root cause'];
}

function getImmediateActions(type, severity) {
  const actions = {
    high: [
      '🚨 CRITICAL: Restart application if possible',
      '⚠️  Set memory limits to prevent crash',
      '📊 Enable detailed profiling immediately',
      '🔍 Capture heap dump for analysis'
    ],
    medium: [
      '⚡ Force garbage collection',
      '📈 Increase monitoring frequency',
      '🔧 Apply temporary memory limits',
      '📝 Log detailed allocation patterns'
    ],
    low: [
      '👀 Continue monitoring closely',
      '📊 Collect more data points',
      '🔍 Identify growth patterns',
      '📋 Plan optimization strategy'
    ]
  };
  return actions[severity] || actions.medium;
}

function getLongTermSolutions(type) {
  const solutions = {
    consistent_growth: [
      'Implement LRU cache with size limits',
      'Add proper event listener cleanup',
      'Use WeakMap/WeakSet for temporary references',
      'Implement object pooling patterns'
    ],
    exponential_growth: [
      'Add recursion depth limits',
      'Implement data structure size caps',
      'Optimize algorithmic complexity',
      'Break circular reference chains'
    ],
    sudden_spike: [
      'Implement streaming for large data',
      'Add batch size limits',
      'Use memory-mapped files',
      'Implement progressive loading'
    ]
  };
  return solutions[type] || ['Implement general memory optimization'];
}

function calculateTimeToCritical(leak) {
  if (leak.growthRate <= 0) return 'No immediate risk';
  
  const availableMemoryMB = 500; // Assume 500MB available
  const currentGrowthMBPerSec = leak.growthRate / 1024;
  const secondsToCritical = availableMemoryMB / currentGrowthMBPerSec;
  
  if (secondsToCritical < 60) {
    return `⚠️  CRITICAL: ${Math.round(secondsToCritical)} seconds`;
  } else if (secondsToCritical < 3600) {
    return `⚠️  HIGH: ${Math.round(secondsToCritical / 60)} minutes`;
  } else if (secondsToCritical < 86400) {
    return `⚠️  MEDIUM: ${Math.round(secondsToCritical / 3600)} hours`;
  } else {
    return `✅ LOW: ${Math.round(secondsToCritical / 86400)} days`;
  }
}

function getLeakLocations(type) {
  // Simulated code locations - in real implementation, this would use stack traces
  const locations = {
    consistent_growth: [
      {
        file: 'src/cache/memory-cache.js',
        line: 45,
        function: 'addToCache()',
        issue: 'Cache size not limited',
        fix: 'Add maxSize parameter and LRU eviction'
      },
      {
        file: 'src/events/event-manager.js',
        line: 78,
        function: 'addEventListener()',
        issue: 'Listeners not removed on cleanup',
        fix: 'Implement removeAllListeners() method'
      }
    ],
    exponential_growth: [
      {
        file: 'src/data/tree-builder.js',
        line: 123,
        function: 'buildTree()',
        issue: 'Recursive creation without depth limit',
        fix: 'Add maxDepth parameter and validation'
      }
    ],
    sudden_spike: [
      {
        file: 'src/io/file-loader.js',
        line: 67,
        function: 'loadLargeFile()',
        issue: 'Loading entire file into memory',
        fix: 'Implement streaming file reader'
      }
    ]
  };
  
  return locations[type] || [
    {
      file: 'unknown',
      line: 0,
      function: 'unknown',
      issue: 'Stack trace not available',
      fix: 'Enable detailed stack trace collection'
    }
  ];
}

function showMemoryTrends(samples) {
  const recent = samples.slice(-10);
  const first = recent[0];
  const last = recent[recent.length - 1];
  
  const growthMB = last.heapUsedMB - first.heapUsedMB;
  const timeSpan = recent.length - 1;
  const growthRate = growthMB / timeSpan;
  
  console.log(`   📊 Sample Count: ${recent.length}`);
  console.log(`   📈 Total Growth: ${growthMB.toFixed(2)}MB`);
  console.log(`   ⚡ Growth Rate: ${growthRate.toFixed(2)}MB per sample`);
  
  const trend = growthRate > 1 ? '📈 INCREASING' : 
                growthRate < -1 ? '📉 DECREASING' : '➡️  STABLE';
  console.log(`   🎯 Trend: ${trend}`);
  
  // Show recent values
  console.log(`   📋 Recent Values: ${recent.slice(-5).map(s => `${s.heapUsedMB}MB`).join(' → ')}`);
}

// Run the demo
demonstrateLeakDetection().catch(console.error);