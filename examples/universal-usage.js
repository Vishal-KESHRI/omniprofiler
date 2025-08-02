const UniversalMemoryProfiler = require('../src/universal-profiler');

async function demonstrateUniversalProfiler() {
  console.log('🌍 Universal Memory Profiler Demo');
  console.log('==================================\n');

  // Create universal profiler
  const profiler = new UniversalMemoryProfiler({
    autoDetect: true,
    scanDepth: 2,
    supportedLanguages: ['javascript', 'python', 'java', 'go', 'csharp', 'cpp', 'rust', 'php']
  });

  try {
    // Start profiling - will auto-detect languages
    await profiler.start();

    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get comprehensive memory stats for all detected languages
    console.log('\n📊 Getting memory stats for all languages...\n');
    const stats = await profiler.getAllMemoryStats();

    // Generate detailed report
    await profiler.generateReport();

    // Show raw data
    console.log('\n📋 Raw Data:');
    console.log(JSON.stringify(stats, null, 2));

    // Demonstrate continuous monitoring
    console.log('\n🔄 Starting continuous monitoring (5 seconds)...\n');
    
    let monitorCount = 0;
    const monitorInterval = setInterval(async () => {
      monitorCount++;
      console.log(`📈 Monitor cycle ${monitorCount}:`);
      
      const currentStats = await profiler.getAllMemoryStats();
      
      // Show summary for each language
      for (const [lang, data] of Object.entries(currentStats.languages)) {
        if (!data.error) {
          const memoryInfo = getMemorySummary(lang, data);
          console.log(`  ${lang}: ${memoryInfo}`);
        }
      }
      
      if (monitorCount >= 3) {
        clearInterval(monitorInterval);
        console.log('\n✅ Monitoring complete!');
        profiler.stop();
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    profiler.stop();
  }
}

function getMemorySummary(language, data) {
  const formatMB = (bytes) => bytes ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : 'N/A';
  
  switch (language) {
    case 'javascript':
      return `Heap: ${formatMB(data.heapUsed)}, RSS: ${formatMB(data.rss)}`;
    case 'python':
      return `RSS: ${formatMB(data.rss)}, Memory: ${data.percent?.toFixed(1)}%`;
    case 'java':
      return `Heap: ${formatMB(data.heapUsed)}/${formatMB(data.heapMax)}`;
    case 'go':
      return `Alloc: ${formatMB(data.alloc)}, Sys: ${formatMB(data.sys)}`;
    case 'cpp':
      return `RSS: ${formatMB(data.rss)}, VSize: ${formatMB(data.vsize)}`;
    case 'php':
      return `Usage: ${formatMB(data.memory_usage)}, Peak: ${formatMB(data.memory_peak)}`;
    default:
      return data.note || 'Profiling active';
  }
}

// Create some sample files to test detection
async function createSampleFiles() {
  const fs = require('fs').promises;
  
  try {
    // Create sample Python file
    await fs.writeFile('sample.py', `
# Sample Python application
import time
import sys

def memory_intensive_function():
    data = [i * i for i in range(100000)]
    return len(data)

if __name__ == "__main__":
    result = memory_intensive_function()
    print(f"Processed {result} items")
`);

    // Create sample Go file
    await fs.writeFile('sample.go', `
package main

import (
    "fmt"
    "runtime"
)

func main() {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    fmt.Printf("Allocated memory: %d KB\\n", m.Alloc/1024)
}
`);

    // Create sample Java file
    await fs.writeFile('Sample.java', `
public class Sample {
    public static void main(String[] args) {
        Runtime runtime = Runtime.getRuntime();
        long memory = runtime.totalMemory() - runtime.freeMemory();
        System.out.println("Used memory: " + memory / 1024 / 1024 + " MB");
    }
}
`);

    console.log('📁 Created sample files for language detection');
  } catch (error) {
    console.log('⚠️  Could not create sample files:', error.message);
  }
}

// Run the demo
async function runDemo() {
  await createSampleFiles();
  await demonstrateUniversalProfiler();
  
  // Cleanup sample files
  const fs = require('fs').promises;
  try {
    await fs.unlink('sample.py');
    await fs.unlink('sample.go');
    await fs.unlink('Sample.java');
    console.log('🧹 Cleaned up sample files');
  } catch (error) {
    // Ignore cleanup errors
  }
}

runDemo().catch(console.error);