import { 
  MemoryProfiler, 
  MemoryMonitor, 
  LeakDetector, 
  UniversalMemoryProfiler,
  autoProfile,
  generateReport,
  LeakInfo,
  MemoryStats,
  ProfilerOptions,
  MonitorOptions,
  LeakDetectorOptions
} from '../index';

// TypeScript usage examples
async function demonstrateTypeScriptUsage(): Promise<void> {
  console.log('🔷 TypeScript Memory Profiler Demo');
  console.log('==================================\n');

  // 1. Strongly typed profiler configuration
  const profilerOptions: ProfilerOptions = {
    enabled: true,
    samplingRate: 1.0,
    maxSamples: 1000,
    alertThreshold: 500 * 1024 * 1024, // 500MB
    heapDumps: true,
    detailedTracing: true,
    onLeak: (leak: LeakInfo) => {
      console.log(`🚨 TypeScript Leak Detected: ${leak.type}`);
      console.log(`   Severity: ${leak.severity}`);
      console.log(`   Growth: ${leak.totalGrowth}MB`);
      console.log(`   Confidence: ${leak.confidence.toFixed(1)}%`);
    },
    onAlert: (type: string, stats: MemoryStats) => {
      console.log(`⚠️ Alert: ${type} - ${Math.round(stats.heapUsed / 1024 / 1024)}MB`);
    }
  };

  // 2. Type-safe monitor configuration
  const monitorOptions: MonitorOptions = {
    alertThreshold: 400 * 1024 * 1024,
    checkInterval: 30000,
    maxConsecutiveAlerts: 3,
    onAlert: (type: 'HIGH_MEMORY' | 'RAPID_GROWTH', stats: MemoryStats) => {
      const memoryMB = Math.round(stats.heapUsed / 1024 / 1024);
      console.log(`🔔 Monitor Alert: ${type} - ${memoryMB}MB`);
    }
  };

  // 3. Leak detector with type safety
  const leakDetectorOptions: LeakDetectorOptions = {
    sampleWindow: 20,
    leakThreshold: 5 * 1024 * 1024,
    checkInterval: 60000,
    onLeakDetected: (leak: LeakInfo) => {
      console.log(`🔍 Leak Analysis:`);
      console.log(`   Type: ${leak.type}`);
      console.log(`   Severity: ${leak.severity}`);
      
      if (leak.location) {
        console.log(`   Location: ${leak.location.file}:${leak.location.line}`);
        console.log(`   Function: ${leak.location.function}`);
      }
    }
  };

  // 4. Initialize components with type safety
  const profiler = new MemoryProfiler(profilerOptions);
  const monitor = new MemoryMonitor(monitorOptions);
  const detector = new LeakDetector(leakDetectorOptions);

  try {
    // 5. Start profiling with proper typing
    profiler.start();
    monitor.start();
    detector.start();

    console.log('✅ All components started with TypeScript type safety\n');

    // 6. Universal profiler with auto-detection
    const universalProfiler: UniversalMemoryProfiler = await autoProfile({
      autoDetect: true,
      scanDepth: 3,
      supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'go']
    });

    // 7. Get typed memory statistics
    const stats: MemoryStats | null = profiler.getStats();
    if (stats) {
      console.log('📊 Current Memory Stats (TypeScript):');
      console.log(`   Heap Used: ${Math.round(stats.heapUsed / 1024 / 1024)}MB`);
      console.log(`   Heap Total: ${Math.round(stats.heapTotal / 1024 / 1024)}MB`);
      console.log(`   RSS: ${Math.round(stats.rss / 1024 / 1024)}MB`);
      console.log(`   Timestamp: ${new Date(stats.timestamp).toISOString()}\n`);
    }

    // 8. Type-safe leak history access
    const leakHistory: LeakInfo[] = detector.getLeakHistory();
    console.log(`🔍 Leak History: ${leakHistory.length} leaks detected\n`);

    // 9. Generate typed reports
    const reports = await generateReport(universalProfiler, detector, {
      format: 'json',
      outputDir: './typescript-reports',
      includeStackTraces: true
    });

    console.log('📋 TypeScript Reports Generated:');
    if (reports.json) {
      console.log(`   JSON Report: ${reports.json}`);
    }

    // 10. Demonstrate type-safe method chaining
    const currentStats = monitor
      .getCurrentStats();
    
    console.log(`💾 Current Memory: ${Math.round(currentStats.heapUsed / 1024 / 1024)}MB`);

    // 11. Type-safe configuration access
    const config: ProfilerOptions = profiler.getConfig();
    console.log(`⚙️ Profiler Config: Sampling Rate ${config.samplingRate}, Max Samples ${config.maxSamples}`);

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ TypeScript Error: ${error.message}`);
    } else {
      console.error('❌ Unknown error occurred');
    }
  } finally {
    // 12. Clean shutdown with type safety
    profiler.stop();
    monitor.stop();
    detector.stop();
    console.log('\n🛑 All components stopped safely');
  }
}

// Advanced TypeScript patterns
class TypeSafeMemoryManager {
  private profiler: MemoryProfiler;
  private monitor: MemoryMonitor;
  private detector: LeakDetector;

  constructor() {
    this.profiler = new MemoryProfiler({
      enabled: true,
      onLeak: this.handleLeak.bind(this),
      onAlert: this.handleAlert.bind(this)
    });

    this.monitor = new MemoryMonitor({
      onAlert: this.handleMonitorAlert.bind(this)
    });

    this.detector = new LeakDetector({
      onLeakDetected: this.handleLeakDetection.bind(this)
    });
  }

  private handleLeak(leak: LeakInfo): void {
    console.log(`🔴 Class Method - Leak: ${leak.type} (${leak.severity})`);
  }

  private handleAlert(type: string, stats: MemoryStats): void {
    console.log(`⚠️ Class Method - Alert: ${type}`);
  }

  private handleMonitorAlert(type: 'HIGH_MEMORY' | 'RAPID_GROWTH', stats: MemoryStats): void {
    console.log(`🔔 Class Method - Monitor: ${type}`);
  }

  private handleLeakDetection(leak: LeakInfo): void {
    console.log(`🔍 Class Method - Detection: ${leak.type}`);
  }

  public async start(): Promise<void> {
    this.profiler.start();
    this.monitor.start();
    this.detector.start();
  }

  public stop(): void {
    this.profiler.stop();
    this.monitor.stop();
    this.detector.stop();
  }

  public getMemoryReport(): {
    stats: MemoryStats | null;
    leaks: LeakInfo[];
    isHealthy: boolean;
  } {
    const stats = this.profiler.getStats();
    const leaks = this.detector.getLeakHistory();
    const isHealthy = stats ? stats.heapUsed < 500 * 1024 * 1024 : false;

    return { stats, leaks, isHealthy };
  }
}

// Generic type-safe wrapper
interface MemoryProfilerConfig<T = any> {
  profiler: ProfilerOptions;
  monitor: MonitorOptions;
  detector: LeakDetectorOptions;
  customData?: T;
}

function createTypeSafeProfiler<T>(config: MemoryProfilerConfig<T>): {
  profiler: MemoryProfiler;
  monitor: MemoryMonitor;
  detector: LeakDetector;
  customData?: T;
} {
  return {
    profiler: new MemoryProfiler(config.profiler),
    monitor: new MemoryMonitor(config.monitor),
    detector: new LeakDetector(config.detector),
    customData: config.customData
  };
}

// Usage example with custom types
interface CustomAppConfig {
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

const typeSafeSetup = createTypeSafeProfiler<CustomAppConfig>({
  profiler: { enabled: true, samplingRate: 1.0 },
  monitor: { alertThreshold: 400 * 1024 * 1024 },
  detector: { sampleWindow: 20 },
  customData: {
    appName: 'TypeScript Memory Profiler Demo',
    version: '2.0.0',
    environment: 'development'
  }
});

// Run the demo
if (require.main === module) {
  demonstrateTypeScriptUsage()
    .then(() => {
      console.log('✅ TypeScript demo completed successfully');
      
      // Demonstrate class-based approach
      const manager = new TypeSafeMemoryManager();
      return manager.start();
    })
    .catch((error: Error) => {
      console.error('❌ TypeScript demo failed:', error.message);
      process.exit(1);
    });
}