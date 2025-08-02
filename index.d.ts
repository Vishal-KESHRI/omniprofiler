// TypeScript definitions for smart-memory-profiler

export interface MemoryStats {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
}

export interface LeakInfo {
  id: number;
  timestamp: number;
  type: 'consistent_growth' | 'exponential_growth' | 'sudden_spike' | 'periodic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  growthRate: number;
  totalGrowth: number;
  duration: number;
  confidence: number;
  location?: {
    file: string;
    line: number;
    function: string;
    stackTrace: Array<{
      function: string;
      file: string;
      line: number;
    }>;
  };
}

export interface ProfilerOptions {
  enabled?: boolean;
  samplingRate?: number;
  maxSamples?: number;
  alertThreshold?: number;
  leakThreshold?: number;
  heapDumps?: boolean;
  detailedTracing?: boolean;
  checkInterval?: number;
  samplingInterval?: number;
  onLeak?: (leak: LeakInfo) => void;
  onAlert?: (type: string, stats: MemoryStats) => void;
}

export interface MonitorOptions {
  alertThreshold?: number;
  rapidGrowthThreshold?: number;
  checkInterval?: number;
  maxConsecutiveAlerts?: number;
  onAlert?: (type: 'HIGH_MEMORY' | 'RAPID_GROWTH', stats: MemoryStats) => void;
}

export interface LeakDetectorOptions {
  sampleWindow?: number;
  checkInterval?: number;
  leakThreshold?: number;
  consistentGrowthThreshold?: number;
  exponentialGrowthFactor?: number;
  suddenSpikeThreshold?: number;
  minConfidence?: number;
  rSquaredThreshold?: number;
  onLeakDetected?: (leak: LeakInfo) => void;
}

export interface UniversalProfilerOptions {
  autoDetect?: boolean;
  scanDepth?: number;
  supportedLanguages?: string[];
}

export interface ReportOptions {
  outputDir?: string;
  format?: 'html' | 'json' | 'console' | 'all';
  includeStackTraces?: boolean;
}

export interface LanguageStats {
  [language: string]: {
    timestamp: number;
    error?: string;
    [key: string]: any;
  };
}

export interface UniversalStats {
  timestamp: number;
  languages: LanguageStats;
}

export declare class MemoryProfiler {
  constructor(options?: ProfilerOptions);
  start(): void;
  stop(): void;
  enableProfiling(duration?: number): void;
  getStats(): MemoryStats | null;
  getSamples(): MemoryStats[];
  getConfig(): ProfilerOptions;
  takeSnapshot(): void;
  isEnabled(): boolean;
}

export declare class MemoryMonitor {
  constructor(options?: MonitorOptions);
  start(): void;
  stop(): void;
  getCurrentStats(): MemoryStats;
  getAlertHistory(): Array<{ type: string; stats: MemoryStats; timestamp: number }>;
  forceGC(): number;
  setThreshold(bytes: number): void;
  resetAlerts(): void;
}

export declare class LeakDetector {
  constructor(options?: LeakDetectorOptions);
  start(): void;
  stop(): void;
  getLeakHistory(): LeakInfo[];
  getSamples(): Array<{ timestamp: number; heapUsedMB: number; heapTotalMB: number }>;
  getAnalysis(): any;
  analyzeNow(): void;
  clearHistory(): void;
}

export declare class UniversalMemoryProfiler {
  constructor(options?: UniversalProfilerOptions);
  start(): Promise<void>;
  stop(): void;
  getAllMemoryStats(): Promise<UniversalStats>;
  generateReport(): Promise<UniversalStats>;
}

export declare class ReportGenerator {
  constructor(options?: ReportOptions);
  generateDetailedReport(
    universalProfiler: UniversalMemoryProfiler,
    leakDetector?: LeakDetector
  ): Promise<{ html?: string; json?: string }>;
}

// Factory functions
export declare function createProfiler(options?: ProfilerOptions): MemoryProfiler;
export declare function createMonitor(options?: MonitorOptions): MemoryMonitor;
export declare function createLeakDetector(options?: LeakDetectorOptions): LeakDetector;
export declare function createUniversalProfiler(options?: UniversalProfilerOptions): UniversalMemoryProfiler;
export declare function createReportGenerator(options?: ReportOptions): ReportGenerator;

// Utility functions
export declare function autoProfile(options?: UniversalProfilerOptions): Promise<UniversalMemoryProfiler>;
export declare function generateReport(
  universalProfiler: UniversalMemoryProfiler,
  leakDetector?: LeakDetector,
  options?: ReportOptions
): Promise<{ html?: string; json?: string }>;

// Default export
declare const smartMemoryProfiler: {
  MemoryProfiler: typeof MemoryProfiler;
  MemoryMonitor: typeof MemoryMonitor;
  LeakDetector: typeof LeakDetector;
  UniversalMemoryProfiler: typeof UniversalMemoryProfiler;
  ReportGenerator: typeof ReportGenerator;
  createProfiler: typeof createProfiler;
  createMonitor: typeof createMonitor;
  createLeakDetector: typeof createLeakDetector;
  createUniversalProfiler: typeof createUniversalProfiler;
  createReportGenerator: typeof createReportGenerator;
  autoProfile: typeof autoProfile;
  generateReport: typeof generateReport;
};

export default smartMemoryProfiler;