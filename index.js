const MemoryProfiler = require('./src/profiler');
const MemoryMonitor = require('./src/monitor');
const LeakDetector = require('./src/leak-detector');
const UniversalMemoryProfiler = require('./src/universal-profiler');
const ReportGenerator = require('./src/report-generator');

module.exports = {
  // Core components
  MemoryProfiler,
  MemoryMonitor,
  LeakDetector,
  UniversalMemoryProfiler,
  ReportGenerator,
  
  // Quick start methods
  createProfiler: (options = {}) => new MemoryProfiler(options),
  createMonitor: (options = {}) => new MemoryMonitor(options),
  createLeakDetector: (options = {}) => new LeakDetector(options),
  createUniversalProfiler: (options = {}) => new UniversalMemoryProfiler(options),
  createReportGenerator: (options = {}) => new ReportGenerator(options),
  
  // Auto-detect and profile all languages
  autoProfile: async (options = {}) => {
    const profiler = new UniversalMemoryProfiler(options);
    await profiler.start();
    return profiler;
  },
  
  // Generate detailed report
  generateReport: async (universalProfiler, leakDetector, options = {}) => {
    const generator = new ReportGenerator(options);
    return await generator.generateDetailedReport(universalProfiler, leakDetector);
  }
};