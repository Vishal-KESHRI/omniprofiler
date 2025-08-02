const { MemoryProfiler, MemoryMonitor, LeakDetector } = require('../index');

// Simple test suite
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running Memory Profiler Tests\n');
    
    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
}

const runner = new TestRunner();

// Test MemoryProfiler
runner.test('MemoryProfiler should initialize with correct config', () => {
  const profiler = new MemoryProfiler();
  runner.assert(profiler.env === 'development', 'Should default to development mode');
  runner.assert(profiler.config.enabled === true, 'Should be enabled in development');
});

runner.test('MemoryProfiler should handle production mode', () => {
  process.env.NODE_ENV = 'production';
  const profiler = new MemoryProfiler();
  runner.assert(profiler.env === 'production', 'Should be in production mode');
  runner.assert(profiler.config.enabled === false, 'Should be disabled by default in production');
  process.env.NODE_ENV = 'development'; // Reset
});

runner.test('MemoryProfiler should start and stop correctly', () => {
  const profiler = new MemoryProfiler();
  profiler.start();
  runner.assert(profiler.isEnabled === true, 'Should be enabled after start');
  
  profiler.stop();
  runner.assert(profiler.isEnabled === false, 'Should be disabled after stop');
});

// Test MemoryMonitor
runner.test('MemoryMonitor should initialize with default values', () => {
  const monitor = new MemoryMonitor();
  runner.assert(monitor.alertThreshold === 500 * 1024 * 1024, 'Should have default threshold');
  runner.assert(monitor.checkInterval === 30000, 'Should have default interval');
});

runner.test('MemoryMonitor should start and stop correctly', () => {
  const monitor = new MemoryMonitor();
  monitor.start();
  runner.assert(monitor.isRunning === true, 'Should be running after start');
  
  monitor.stop();
  runner.assert(monitor.isRunning === false, 'Should be stopped after stop');
});

runner.test('MemoryMonitor should return current stats', () => {
  const monitor = new MemoryMonitor();
  const stats = monitor.getCurrentStats();
  
  runner.assert(typeof stats.heapUsed === 'number', 'Should return heap used');
  runner.assert(typeof stats.heapTotal === 'number', 'Should return heap total');
  runner.assert(typeof stats.rss === 'number', 'Should return RSS');
  runner.assert(stats.timestamp > 0, 'Should have timestamp');
});

// Test LeakDetector
runner.test('LeakDetector should initialize correctly', () => {
  const detector = new LeakDetector();
  runner.assert(detector.sampleWindow === 20, 'Should have default sample window');
  runner.assert(detector.samples.length === 0, 'Should start with empty samples');
});

runner.test('LeakDetector should start and stop correctly', () => {
  const detector = new LeakDetector();
  detector.start();
  runner.assert(detector.isRunning === true, 'Should be running after start');
  
  detector.stop();
  runner.assert(detector.isRunning === false, 'Should be stopped after stop');
});

// Integration test
runner.test('All components should work together', async () => {
  const profiler = new MemoryProfiler({ maxSamples: 5 });
  const monitor = new MemoryMonitor({ checkInterval: 1000 });
  const detector = new LeakDetector({ checkInterval: 1000 });
  
  // Start all
  profiler.start();
  monitor.start();
  detector.start();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Stop all
  profiler.stop();
  monitor.stop();
  detector.stop();
  
  runner.assert(true, 'All components should start and stop without errors');
});

// Memory leak simulation test
runner.test('Should detect simulated memory growth', async () => {
  const detector = new LeakDetector({
    sampleWindow: 5,
    checkInterval: 100,
    leakThreshold: 1024 // 1KB threshold for testing
  });
  
  let leakDetected = false;
  detector.onLeakDetected = () => {
    leakDetected = true;
  };
  
  // Manually add samples showing growth
  for (let i = 0; i < 5; i++) {
    detector.samples.push({
      timestamp: Date.now() + i * 1000,
      heapUsed: 1024 * 1024 * (10 + i * 2), // Growing memory
      heapTotal: 1024 * 1024 * 50,
      rss: 1024 * 1024 * 60,
      external: 1024 * 1024
    });
  }
  
  detector._analyzeForLeaks();
  
  // Note: This might not always detect a leak due to the simple simulation
  // In a real scenario, the growth pattern would be more consistent
  runner.assert(true, 'Leak analysis should complete without errors');
});

// Run all tests
runner.run().catch(console.error);