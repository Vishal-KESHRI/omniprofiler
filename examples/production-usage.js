const express = require('express');
const { MemoryProfiler, MemoryMonitor } = require('../index');

// Production-ready setup
const app = express();
app.use(express.json());

// Initialize profiler for production
const profiler = new MemoryProfiler({
  // Production config will be auto-applied
  alertThreshold: 500 * 1024 * 1024 // 500MB
});

const monitor = new MemoryMonitor({
  alertThreshold: 400 * 1024 * 1024, // 400MB
  onAlert: (type, stats) => {
    // In production, send to monitoring service
    console.error(`PRODUCTION ALERT: ${type}`, {
      memory: stats.heapUsedMB,
      timestamp: new Date().toISOString(),
      pid: process.pid
    });
    
    // Could send to DataDog, New Relic, etc.
    // sendToMonitoringService({ type, stats });
  }
});

// Start monitoring (profiler starts in standby mode for production)
profiler.start();
monitor.start();

// API endpoints for manual control
app.post('/admin/profiling/enable', (req, res) => {
  const duration = req.body.duration || 300000; // 5 minutes default
  
  console.log(`Enabling profiling for ${duration / 1000} seconds`);
  profiler.enableProfiling(duration);
  
  res.json({ 
    message: 'Profiling enabled', 
    duration: duration / 1000,
    timestamp: new Date().toISOString()
  });
});

app.get('/admin/memory/stats', (req, res) => {
  const stats = {
    profiler: profiler.getStats(),
    monitor: monitor.getCurrentStats(),
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      version: process.version
    }
  };
  
  res.json(stats);
});

app.post('/admin/memory/gc', (req, res) => {
  const freed = monitor.forceGC();
  res.json({ 
    message: 'GC triggered', 
    freedMB: freed,
    timestamp: new Date().toISOString()
  });
});

// Sample API that might cause memory issues
const cache = new Map();

app.get('/api/data/:id', (req, res) => {
  const id = req.params.id;
  
  // Simulate caching that might leak
  if (!cache.has(id)) {
    const data = {
      id,
      data: new Array(1000).fill(`cached-data-${id}`),
      timestamp: Date.now()
    };
    cache.set(id, data);
  }
  
  res.json(cache.get(id));
});

// Cleanup endpoint
app.delete('/api/cache', (req, res) => {
  const size = cache.size;
  cache.clear();
  res.json({ message: `Cleared ${size} cache entries` });
});

// Health check
app.get('/health', (req, res) => {
  const stats = monitor.getCurrentStats();
  const isHealthy = stats.heapUsed < 500; // 500MB threshold
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    memory: stats,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  
  profiler.stop();
  monitor.stop();
  
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
  console.log('Memory profiler in standby mode');
  console.log('Available endpoints:');
  console.log('  POST /admin/profiling/enable - Enable profiling');
  console.log('  GET  /admin/memory/stats - Get memory stats');
  console.log('  POST /admin/memory/gc - Force garbage collection');
  console.log('  GET  /health - Health check');
});