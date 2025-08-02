import java.lang.management.*;
import java.util.*;
import java.util.concurrent.*;
import com.sun.management.GarbageCollectorMXBean;
import com.sun.management.MemoryPoolMXBean;
import javax.management.MBeanServer;
import javax.management.ObjectName;

/**
 * Java Memory Profiler Component
 * Provides comprehensive memory profiling for Java applications using JMX
 */
public class JavaMemoryProfiler {
    
    private final MemoryMXBean memoryBean;
    private final List<GarbageCollectorMXBean> gcBeans;
    private final List<MemoryPoolMXBean> poolBeans;
    private final ThreadMXBean threadBean;
    private final RuntimeMXBean runtimeBean;
    
    private boolean isRunning = false;
    private final List<MemorySnapshot> samples;
    private final int maxSamples;
    
    public JavaMemoryProfiler() {
        this(100);
    }
    
    public JavaMemoryProfiler(int maxSamples) {
        this.maxSamples = maxSamples;
        this.samples = new ArrayList<>();
        
        // Initialize MX Beans
        this.memoryBean = ManagementFactory.getMemoryMXBean();
        this.gcBeans = ManagementFactory.getGarbageCollectorMXBeans();
        this.poolBeans = ManagementFactory.getMemoryPoolMXBeans();
        this.threadBean = ManagementFactory.getThreadMXBean();
        this.runtimeBean = ManagementFactory.getRuntimeMXBean();
    }
    
    public void start() {
        this.isRunning = true;
        System.out.println("☕ Java Memory Profiler started");
    }
    
    public void stop() {
        this.isRunning = false;
        System.out.println("☕ Java Memory Profiler stopped");
    }
    
    public MemoryStats getMemoryStats() {
        try {
            MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
            MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();
            
            // Garbage collection statistics
            Map<String, GCStats> gcStats = new HashMap<>();
            for (GarbageCollectorMXBean gcBean : gcBeans) {
                gcStats.put(gcBean.getName(), new GCStats(
                    gcBean.getCollectionCount(),
                    gcBean.getCollectionTime()
                ));
            }
            
            // Memory pool statistics
            Map<String, PoolStats> poolStats = new HashMap<>();
            for (MemoryPoolMXBean poolBean : poolBeans) {
                MemoryUsage usage = poolBean.getUsage();
                if (usage != null) {
                    poolStats.put(poolBean.getName(), new PoolStats(
                        usage.getUsed(),
                        usage.getMax(),
                        usage.getCommitted()
                    ));
                }
            }
            
            MemoryStats stats = new MemoryStats(
                System.currentTimeMillis(),
                heapUsage.getUsed(),
                heapUsage.getMax(),
                heapUsage.getCommitted(),
                nonHeapUsage.getUsed(),
                nonHeapUsage.getMax(),
                threadBean.getThreadCount(),
                gcStats,
                poolStats
            );
            
            // Add to samples
            MemorySnapshot snapshot = new MemorySnapshot(stats);
            samples.add(snapshot);
            if (samples.size() > maxSamples) {
                samples.remove(0);
            }
            
            return stats;
            
        } catch (Exception e) {
            return new MemoryStats(System.currentTimeMillis(), e.getMessage());
        }
    }
    
    public LeakDetectionResult detectMemoryLeaks() {
        if (samples.size() < 5) {
            return new LeakDetectionResult("insufficient_data");
        }
        
        List<MemorySnapshot> recentSamples = samples.subList(
            Math.max(0, samples.size() - 5), samples.size()
        );
        
        MemorySnapshot first = recentSamples.get(0);
        MemorySnapshot last = recentSamples.get(recentSamples.size() - 1);
        
        long timeDiff = (last.stats.timestamp - first.stats.timestamp) / 1000; // seconds
        long memoryGrowth = last.stats.heapUsed - first.stats.heapUsed;
        
        double growthRate = timeDiff > 0 ? (double) memoryGrowth / timeDiff : 0; // bytes per second
        
        boolean isLeak = growthRate > 1024 * 1024; // 1MB/sec threshold
        double confidence = Math.min(Math.abs(growthRate) / (1024 * 1024) * 100, 100);
        
        return new LeakDetectionResult(
            isLeak,
            growthRate / 1024 / 1024, // MB per second
            memoryGrowth / 1024 / 1024, // MB total growth
            timeDiff,
            confidence
        );
    }
    
    public GCResult forceGC() {
        MemoryStats beforeStats = getMemoryStats();
        
        // Force garbage collection
        System.gc();
        
        // Wait a bit for GC to complete
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        MemoryStats afterStats = getMemoryStats();
        
        long freedBytes = beforeStats.heapUsed - afterStats.heapUsed;
        
        return new GCResult(
            freedBytes / 1024 / 1024, // MB freed
            beforeStats.heapUsed / 1024 / 1024, // Before MB
            afterStats.heapUsed / 1024 / 1024 // After MB
        );
    }
    
    public String toJson(Object obj) {
        // Simple JSON serialization (in real implementation, use Jackson or Gson)
        if (obj instanceof MemoryStats) {
            MemoryStats stats = (MemoryStats) obj;
            return String.format(
                "{\"timestamp\":%d,\"heapUsed\":%d,\"heapMax\":%d,\"heapCommitted\":%d," +
                "\"nonHeapUsed\":%d,\"threadCount\":%d,\"error\":\"%s\"}",
                stats.timestamp, stats.heapUsed, stats.heapMax, stats.heapCommitted,
                stats.nonHeapUsed, stats.threadCount, stats.error != null ? stats.error : ""
            );
        }
        return "{}";
    }
    
    // Data classes
    public static class MemoryStats {
        public final long timestamp;
        public final long heapUsed;
        public final long heapMax;
        public final long heapCommitted;
        public final long nonHeapUsed;
        public final long nonHeapMax;
        public final int threadCount;
        public final Map<String, GCStats> gcStats;
        public final Map<String, PoolStats> poolStats;
        public final String error;
        
        public MemoryStats(long timestamp, long heapUsed, long heapMax, long heapCommitted,
                          long nonHeapUsed, long nonHeapMax, int threadCount,
                          Map<String, GCStats> gcStats, Map<String, PoolStats> poolStats) {
            this.timestamp = timestamp;
            this.heapUsed = heapUsed;
            this.heapMax = heapMax;
            this.heapCommitted = heapCommitted;
            this.nonHeapUsed = nonHeapUsed;
            this.nonHeapMax = nonHeapMax;
            this.threadCount = threadCount;
            this.gcStats = gcStats;
            this.poolStats = poolStats;
            this.error = null;
        }
        
        public MemoryStats(long timestamp, String error) {
            this.timestamp = timestamp;
            this.error = error;
            this.heapUsed = this.heapMax = this.heapCommitted = 0;
            this.nonHeapUsed = this.nonHeapMax = 0;
            this.threadCount = 0;
            this.gcStats = new HashMap<>();
            this.poolStats = new HashMap<>();
        }
    }
    
    public static class GCStats {
        public final long collectionCount;
        public final long collectionTime;
        
        public GCStats(long collectionCount, long collectionTime) {
            this.collectionCount = collectionCount;
            this.collectionTime = collectionTime;
        }
    }
    
    public static class PoolStats {
        public final long used;
        public final long max;
        public final long committed;
        
        public PoolStats(long used, long max, long committed) {
            this.used = used;
            this.max = max;
            this.committed = committed;
        }
    }
    
    public static class MemorySnapshot {
        public final MemoryStats stats;
        
        public MemorySnapshot(MemoryStats stats) {
            this.stats = stats;
        }
    }
    
    public static class LeakDetectionResult {
        public final boolean isLeakDetected;
        public final double growthRateMBPerSec;
        public final double totalGrowthMB;
        public final long durationSeconds;
        public final double confidence;
        public final String status;
        
        public LeakDetectionResult(String status) {
            this.status = status;
            this.isLeakDetected = false;
            this.growthRateMBPerSec = 0;
            this.totalGrowthMB = 0;
            this.durationSeconds = 0;
            this.confidence = 0;
        }
        
        public LeakDetectionResult(boolean isLeakDetected, double growthRateMBPerSec,
                                 double totalGrowthMB, long durationSeconds, double confidence) {
            this.isLeakDetected = isLeakDetected;
            this.growthRateMBPerSec = growthRateMBPerSec;
            this.totalGrowthMB = totalGrowthMB;
            this.durationSeconds = durationSeconds;
            this.confidence = confidence;
            this.status = "analyzed";
        }
    }
    
    public static class GCResult {
        public final double memoryFreedMB;
        public final double beforeMB;
        public final double afterMB;
        
        public GCResult(double memoryFreedMB, double beforeMB, double afterMB) {
            this.memoryFreedMB = memoryFreedMB;
            this.beforeMB = beforeMB;
            this.afterMB = afterMB;
        }
    }
    
    // Main method for standalone usage
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java JavaMemoryProfiler <command>");
            System.out.println("Commands: stats, leaks, gc");
            System.exit(1);
        }
        
        String command = args[0];
        JavaMemoryProfiler profiler = new JavaMemoryProfiler();
        
        try {
            switch (command) {
                case "stats":
                    MemoryStats stats = profiler.getMemoryStats();
                    System.out.println(profiler.toJson(stats));
                    break;
                
                case "leaks":
                    // Take multiple samples for leak detection
                    for (int i = 0; i < 5; i++) {
                        profiler.getMemoryStats();
                        Thread.sleep(1000);
                    }
                    
                    LeakDetectionResult leaks = profiler.detectMemoryLeaks();
                    System.out.println(String.format(
                        "{\"isLeakDetected\":%b,\"growthRateMBPerSec\":%.2f," +
                        "\"totalGrowthMB\":%.2f,\"durationSeconds\":%d,\"confidence\":%.1f}",
                        leaks.isLeakDetected, leaks.growthRateMBPerSec,
                        leaks.totalGrowthMB, leaks.durationSeconds, leaks.confidence
                    ));
                    break;
                
                case "gc":
                    GCResult gcResult = profiler.forceGC();
                    System.out.println(String.format(
                        "{\"memoryFreedMB\":%.2f,\"beforeMB\":%.2f,\"afterMB\":%.2f}",
                        gcResult.memoryFreedMB, gcResult.beforeMB, gcResult.afterMB
                    ));
                    break;
                
                default:
                    System.err.println("Unknown command: " + command);
                    System.exit(1);
            }
        } catch (Exception e) {
            System.err.println("{\"error\":\"" + e.getMessage() + "\"}");
            System.exit(1);
        }
    }
}