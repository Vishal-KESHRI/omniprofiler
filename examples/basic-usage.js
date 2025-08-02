const { MemoryProfiler, MemoryMonitor, LeakDetector } = require('../index');

// Example 1: Basic profiler usage
console.log('=== Memory Profiler Demo ===\n');

const profiler = new MemoryProfiler({
  alertThreshold: 50 * 1024 * 1024 // 50MB threshold
});

const monitor = new MemoryMonitor({
  alertThreshold: 100 * 1024 * 1024, // 100MB
  onAlert: (type, stats) => {
    console.log(`🚨 Alert: ${type} - Memory: ${stats.heapUsedMB}MB`);
  }
});

const leakDetector = new LeakDetector({
  onLeakDetected: (leak) => {
    console.log(`🔍 Leak detected: ${leak.type} (${leak.severity})`);
  }
});

// Start all components
profiler.start();
monitor.start();
leakDetector.start();

// Simulate memory usage patterns
function simulateMemoryUsage() {
  const data = [];
  
  // Create some objects to simulate memory usage
  for (let i = 0; i < 1000; i++) {
    data.push({
      id: i,
      data: new Array(1000).fill(`data-${i}`),
      timestamp: Date.now()
    });
  }
  
  // Keep references to simulate potential leaks
  global.simulatedData = global.simulatedData || [];
  global.simulatedData.push(...data);
  
  console.log(`Created ${data.length} objects, total: ${global.simulatedData.length}`);
}

// Simulate different memory patterns
let counter = 0;
const interval = setInterval(() => {
  counter++;
  
  if (counter <= 5) {
    simulateMemoryUsage();
  } else if (counter === 6) {
    // Show current stats
    console.log('\n=== Current Stats ===');
    console.log('Profiler:', profiler.getStats());
    console.log('Monitor:', monitor.getCurrentStats());
    console.log('Leak History:', leakDetector.getLeakHistory());
  } else if (counter === 7) {
    // Clean up and stop
    console.log('\n=== Cleanup ===');
    global.simulatedData = null; // Release memory
    
    if (global.gc) {
      monitor.forceGC();
    }
    
    profiler.stop();
    monitor.stop();
    leakDetector.stop();
    
    clearInterval(interval);
    console.log('Demo completed!');
  }
}, 3000);

// Handle process exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  profiler.stop();
  monitor.stop();
  leakDetector.stop();
  process.exit(0);
});

console.log('Demo running... Press Ctrl+C to stop');
console.log('Run with --expose-gc flag to enable garbage collection\n');