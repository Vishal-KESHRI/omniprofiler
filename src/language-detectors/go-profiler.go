package main

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"runtime/debug"
	"time"
)

// GoMemoryProfiler provides comprehensive memory profiling for Go applications
type GoMemoryProfiler struct {
	isRunning  bool
	samples    []MemorySnapshot
	maxSamples int
}

// MemoryStats represents comprehensive memory statistics
type MemoryStats struct {
	Timestamp    int64  `json:"timestamp"`
	Alloc        uint64 `json:"alloc"`        // Currently allocated bytes
	TotalAlloc   uint64 `json:"totalAlloc"`   // Total allocated bytes
	Sys          uint64 `json:"sys"`          // System memory obtained
	Lookups      uint64 `json:"lookups"`      // Number of pointer lookups
	Mallocs      uint64 `json:"mallocs"`      // Number of mallocs
	Frees        uint64 `json:"frees"`        // Number of frees
	HeapAlloc    uint64 `json:"heapAlloc"`    // Heap allocated bytes
	HeapSys      uint64 `json:"heapSys"`      // Heap system bytes
	HeapIdle     uint64 `json:"heapIdle"`     // Heap idle bytes
	HeapInuse    uint64 `json:"heapInuse"`    // Heap in-use bytes
	HeapReleased uint64 `json:"heapReleased"` // Heap released bytes
	HeapObjects  uint64 `json:"heapObjects"`  // Number of heap objects
	StackInuse   uint64 `json:"stackInuse"`   // Stack in-use bytes
	StackSys     uint64 `json:"stackSys"`     // Stack system bytes
	MSpanInuse   uint64 `json:"mspanInuse"`   // MSpan in-use bytes
	MSpanSys     uint64 `json:"mspanSys"`     // MSpan system bytes
	MCacheInuse  uint64 `json:"mcacheInuse"`  // MCache in-use bytes
	MCacheSys    uint64 `json:"mcacheSys"`    // MCache system bytes
	BuckHashSys  uint64 `json:"buckHashSys"`  // Bucket hash system bytes
	GCSys        uint64 `json:"gcSys"`        // GC system bytes
	OtherSys     uint64 `json:"otherSys"`     // Other system bytes
	NextGC       uint64 `json:"nextGC"`       // Next GC target
	LastGC       uint64 `json:"lastGC"`       // Last GC time
	PauseTotalNs uint64 `json:"pauseTotalNs"` // Total GC pause time
	PauseNs      uint64 `json:"pauseNs"`      // Recent GC pause time
	PauseEnd     uint64 `json:"pauseEnd"`     // Recent GC pause end time
	NumGC        uint32 `json:"numGC"`        // Number of GC cycles
	NumForcedGC  uint32 `json:"numForcedGC"`  // Number of forced GC cycles
	GCCPUFraction float64 `json:"gcCPUFraction"` // GC CPU fraction
	EnableGC     bool   `json:"enableGC"`     // GC enabled
	DebugGC      bool   `json:"debugGC"`      // Debug GC enabled
	Goroutines   int    `json:"goroutines"`   // Number of goroutines
	Error        string `json:"error,omitempty"`
}

// MemorySnapshot represents a memory snapshot at a point in time
type MemorySnapshot struct {
	Stats MemoryStats `json:"stats"`
}

// LeakDetectionResult represents the result of memory leak detection
type LeakDetectionResult struct {
	IsLeakDetected     bool    `json:"isLeakDetected"`
	GrowthRateMBPerSec float64 `json:"growthRateMBPerSec"`
	TotalGrowthMB      float64 `json:"totalGrowthMB"`
	DurationSeconds    int64   `json:"durationSeconds"`
	Confidence         float64 `json:"confidence"`
	Status             string  `json:"status,omitempty"`
}

// GCResult represents the result of garbage collection
type GCResult struct {
	MemoryFreedMB float64 `json:"memoryFreedMB"`
	BeforeMB      float64 `json:"beforeMB"`
	AfterMB       float64 `json:"afterMB"`
	GCDuration    int64   `json:"gcDurationNs"`
}

// NewGoMemoryProfiler creates a new Go memory profiler
func NewGoMemoryProfiler(maxSamples int) *GoMemoryProfiler {
	if maxSamples <= 0 {
		maxSamples = 100
	}
	
	return &GoMemoryProfiler{
		isRunning:  false,
		samples:    make([]MemorySnapshot, 0, maxSamples),
		maxSamples: maxSamples,
	}
}

// Start begins memory profiling
func (p *GoMemoryProfiler) Start() {
	p.isRunning = true
	fmt.Println("🐹 Go Memory Profiler started")
}

// Stop ends memory profiling
func (p *GoMemoryProfiler) Stop() {
	p.isRunning = false
	fmt.Println("🐹 Go Memory Profiler stopped")
}

// GetMemoryStats retrieves comprehensive memory statistics
func (p *GoMemoryProfiler) GetMemoryStats() MemoryStats {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	// Get GC stats
	gcStats := debug.GCStats{}
	debug.ReadGCStats(&gcStats)
	
	stats := MemoryStats{
		Timestamp:     time.Now().UnixMilli(),
		Alloc:         m.Alloc,
		TotalAlloc:    m.TotalAlloc,
		Sys:           m.Sys,
		Lookups:       m.Lookups,
		Mallocs:       m.Mallocs,
		Frees:         m.Frees,
		HeapAlloc:     m.HeapAlloc,
		HeapSys:       m.HeapSys,
		HeapIdle:      m.HeapIdle,
		HeapInuse:     m.HeapInuse,
		HeapReleased:  m.HeapReleased,
		HeapObjects:   m.HeapObjects,
		StackInuse:    m.StackInuse,
		StackSys:      m.StackSys,
		MSpanInuse:    m.MSpanInuse,
		MSpanSys:      m.MSpanSys,
		MCacheInuse:   m.MCacheInuse,
		MCacheSys:     m.MCacheSys,
		BuckHashSys:   m.BuckHashSys,
		GCSys:         m.GCSys,
		OtherSys:      m.OtherSys,
		NextGC:        m.NextGC,
		LastGC:        m.LastGC,
		PauseTotalNs:  m.PauseTotalNs,
		NumGC:         m.NumGC,
		NumForcedGC:   m.NumForcedGC,
		GCCPUFraction: m.GCCPUFraction,
		EnableGC:      m.EnableGC,
		DebugGC:       m.DebugGC,
		Goroutines:    runtime.NumGoroutine(),
	}
	
	// Get recent pause time
	if len(m.PauseNs) > 0 {
		stats.PauseNs = m.PauseNs[(m.NumGC+255)%256]
	}
	if len(m.PauseEnd) > 0 {
		stats.PauseEnd = m.PauseEnd[(m.NumGC+255)%256]
	}
	
	// Add to samples
	snapshot := MemorySnapshot{Stats: stats}
	p.samples = append(p.samples, snapshot)
	if len(p.samples) > p.maxSamples {
		p.samples = p.samples[1:]
	}
	
	return stats
}

// DetectMemoryLeaks analyzes memory samples for potential leaks
func (p *GoMemoryProfiler) DetectMemoryLeaks() LeakDetectionResult {
	if len(p.samples) < 5 {
		return LeakDetectionResult{Status: "insufficient_data"}
	}
	
	// Get recent samples
	recentSamples := p.samples
	if len(p.samples) > 5 {
		recentSamples = p.samples[len(p.samples)-5:]
	}
	
	first := recentSamples[0].Stats
	last := recentSamples[len(recentSamples)-1].Stats
	
	timeDiff := (last.Timestamp - first.Timestamp) / 1000 // seconds
	memoryGrowth := int64(last.Alloc) - int64(first.Alloc)
	
	var growthRate float64
	if timeDiff > 0 {
		growthRate = float64(memoryGrowth) / float64(timeDiff) // bytes per second
	}
	
	isLeak := growthRate > 1024*1024 // 1MB/sec threshold
	confidence := min(abs(growthRate)/(1024*1024)*100, 100)
	
	return LeakDetectionResult{
		IsLeakDetected:     isLeak,
		GrowthRateMBPerSec: growthRate / 1024 / 1024,
		TotalGrowthMB:      float64(memoryGrowth) / 1024 / 1024,
		DurationSeconds:    timeDiff,
		Confidence:         confidence,
		Status:             "analyzed",
	}
}

// ForceGC forces garbage collection and returns statistics
func (p *GoMemoryProfiler) ForceGC() GCResult {
	beforeStats := p.GetMemoryStats()
	
	// Force garbage collection
	start := time.Now()
	runtime.GC()
	duration := time.Since(start)
	
	// Wait a bit for GC to complete
	time.Sleep(10 * time.Millisecond)
	
	afterStats := p.GetMemoryStats()
	
	freedBytes := int64(beforeStats.Alloc) - int64(afterStats.Alloc)
	
	return GCResult{
		MemoryFreedMB: float64(freedBytes) / 1024 / 1024,
		BeforeMB:      float64(beforeStats.Alloc) / 1024 / 1024,
		AfterMB:       float64(afterStats.Alloc) / 1024 / 1024,
		GCDuration:    duration.Nanoseconds(),
	}
}

// Helper functions
func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// Main function for standalone usage
func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run go-profiler.go <command>")
		fmt.Println("Commands: stats, leaks, gc")
		os.Exit(1)
	}
	
	command := os.Args[1]
	profiler := NewGoMemoryProfiler(100)
	
	switch command {
	case "stats":
		stats := profiler.GetMemoryStats()
		jsonData, err := json.MarshalIndent(stats, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, `{"error": "%s"}`, err.Error())
			os.Exit(1)
		}
		fmt.Println(string(jsonData))
		
	case "leaks":
		// Take multiple samples for leak detection
		for i := 0; i < 5; i++ {
			profiler.GetMemoryStats()
			time.Sleep(1 * time.Second)
		}
		
		leaks := profiler.DetectMemoryLeaks()
		jsonData, err := json.MarshalIndent(leaks, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, `{"error": "%s"}`, err.Error())
			os.Exit(1)
		}
		fmt.Println(string(jsonData))
		
	case "gc":
		gcResult := profiler.ForceGC()
		jsonData, err := json.MarshalIndent(gcResult, "", "  ")
		if err != nil {
			fmt.Fprintf(os.Stderr, `{"error": "%s"}`, err.Error())
			os.Exit(1)
		}
		fmt.Println(string(jsonData))
		
	default:
		fmt.Fprintf(os.Stderr, `{"error": "Unknown command: %s"}`, command)
		os.Exit(1)
	}
}