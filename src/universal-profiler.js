const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

class UniversalMemoryProfiler {
  constructor(options = {}) {
    this.options = {
      autoDetect: true,
      supportedLanguages: ['javascript', 'python', 'java', 'go', 'csharp', 'cpp', 'rust', 'php'],
      scanDepth: 3,
      ...options
    };
    
    this.detectedLanguages = new Map();
    this.profilers = new Map();
    this.isRunning = false;
  }

  async start() {
    console.log('🔍 Starting Universal Memory Profiler...');
    
    // Auto-detect languages in current directory
    if (this.options.autoDetect) {
      await this.detectLanguages();
    }
    
    // Initialize profilers for detected languages
    await this.initializeProfilers();
    
    this.isRunning = true;
    console.log(`✅ Profiling started for: ${Array.from(this.detectedLanguages.keys()).join(', ')}`);
  }

  async detectLanguages() {
    const detectionRules = {
      javascript: {
        files: ['package.json', '*.js', '*.ts', '*.jsx', '*.tsx'],
        processes: ['node', 'npm', 'yarn'],
        indicators: ['node_modules/', 'package-lock.json']
      },
      python: {
        files: ['*.py', 'requirements.txt', 'setup.py', 'pyproject.toml'],
        processes: ['python', 'python3', 'pip'],
        indicators: ['__pycache__/', '.pyc', 'venv/', '.venv/']
      },
      java: {
        files: ['*.java', '*.jar', '*.war', 'pom.xml', 'build.gradle'],
        processes: ['java', 'javac', 'gradle', 'maven'],
        indicators: ['target/', 'build/', '.class']
      },
      go: {
        files: ['*.go', 'go.mod', 'go.sum'],
        processes: ['go'],
        indicators: ['go.mod', 'vendor/']
      },
      csharp: {
        files: ['*.cs', '*.csproj', '*.sln'],
        processes: ['dotnet', 'msbuild'],
        indicators: ['bin/', 'obj/', '.dll', '.exe']
      },
      cpp: {
        files: ['*.cpp', '*.cc', '*.cxx', '*.h', '*.hpp', 'CMakeLists.txt', 'Makefile'],
        processes: ['gcc', 'g++', 'clang++', 'make'],
        indicators: ['*.o', '*.so', '*.a']
      },
      rust: {
        files: ['*.rs', 'Cargo.toml', 'Cargo.lock'],
        processes: ['cargo', 'rustc'],
        indicators: ['target/', 'Cargo.lock']
      },
      php: {
        files: ['*.php', 'composer.json', 'composer.lock'],
        processes: ['php', 'composer'],
        indicators: ['vendor/', '.php']
      }
    };

    console.log('🔎 Detecting languages...');
    
    for (const [lang, rules] of Object.entries(detectionRules)) {
      const confidence = await this._calculateLanguageConfidence(lang, rules);
      
      if (confidence > 0.3) { // 30% confidence threshold
        this.detectedLanguages.set(lang, {
          confidence: Math.round(confidence * 100),
          files: await this._findLanguageFiles(rules.files),
          processes: await this._findRunningProcesses(rules.processes)
        });
        
        console.log(`  ✓ ${lang}: ${Math.round(confidence * 100)}% confidence`);
      }
    }
  }

  async _calculateLanguageConfidence(lang, rules) {
    let score = 0;
    let maxScore = 0;

    // Check for files (40% weight)
    maxScore += 0.4;
    const foundFiles = await this._findLanguageFiles(rules.files);
    if (foundFiles.length > 0) {
      score += 0.4 * Math.min(foundFiles.length / 5, 1);
    }

    // Check for running processes (30% weight)
    maxScore += 0.3;
    const runningProcesses = await this._findRunningProcesses(rules.processes);
    if (runningProcesses.length > 0) {
      score += 0.3;
    }

    // Check for indicators (30% weight)
    maxScore += 0.3;
    const indicators = await this._findIndicators(rules.indicators);
    if (indicators.length > 0) {
      score += 0.3 * Math.min(indicators.length / 3, 1);
    }

    return score;
  }

  async _findLanguageFiles(patterns) {
    const files = [];
    
    const scanDirectory = (dir, depth = 0) => {
      if (depth > this.options.scanDepth) return;
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDirectory(fullPath, depth + 1);
          } else if (stat.isFile()) {
            for (const pattern of patterns) {
              if (this._matchPattern(item, pattern)) {
                files.push(fullPath);
                break;
              }
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    scanDirectory(process.cwd());
    return files;
  }

  async _findRunningProcesses(processNames) {
    return new Promise((resolve) => {
      exec('ps aux', (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }
        
        const running = processNames.filter(name => 
          stdout.toLowerCase().includes(name.toLowerCase())
        );
        resolve(running);
      });
    });
  }

  async _findIndicators(indicators) {
    const found = [];
    
    const checkPath = (dir, depth = 0) => {
      if (depth > this.options.scanDepth) return;
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          
          for (const indicator of indicators) {
            if (this._matchPattern(item, indicator) || this._matchPattern(fullPath, indicator)) {
              found.push(fullPath);
            }
          }
          
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory() && !item.startsWith('.')) {
              checkPath(fullPath, depth + 1);
            }
          } catch (e) {
            // Ignore
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    checkPath(process.cwd());
    return found;
  }

  _matchPattern(filename, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern || filename.endsWith(pattern);
  }

  async initializeProfilers() {
    console.log('🚀 Initializing language-specific profilers...');
    
    for (const [lang, info] of this.detectedLanguages) {
      try {
        const profiler = await this._createLanguageProfiler(lang, info);
        this.profilers.set(lang, profiler);
        console.log(`  ✓ ${lang} profiler initialized`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to initialize ${lang} profiler:`, error.message);
      }
    }
  }

  async _createLanguageProfiler(language, info) {
    const profilerFactories = {
      javascript: () => this._createJavaScriptProfiler(info),
      python: () => this._createPythonProfiler(info),
      java: () => this._createJavaProfiler(info),
      go: () => this._createGoProfiler(info),
      csharp: () => this._createCSharpProfiler(info),
      cpp: () => this._createCppProfiler(info),
      rust: () => this._createRustProfiler(info),
      php: () => this._createPhpProfiler(info)
    };

    const factory = profilerFactories[language];
    if (!factory) {
      throw new Error(`Unsupported language: ${language}`);
    }

    return await factory();
  }

  _createJavaScriptProfiler(info) {
    return {
      language: 'javascript',
      type: 'native',
      profiler: require('./profiler'), // Use existing Node.js profiler
      
      async getMemoryStats() {
        const usage = process.memoryUsage();
        return {
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          rss: usage.rss,
          external: usage.external,
          timestamp: Date.now()
        };
      },
      
      async startProfiling() {
        const profiler = new (require('./profiler'))();
        profiler.start();
        return profiler;
      }
    };
  }

  _createPythonProfiler(info) {
    return {
      language: 'python',
      type: 'external',
      
      async getMemoryStats() {
        return new Promise((resolve, reject) => {
          const pythonScript = `
import psutil
import json
import sys

try:
    process = psutil.Process()
    memory_info = process.memory_info()
    
    stats = {
        'rss': memory_info.rss,
        'vms': memory_info.vms,
        'percent': process.memory_percent(),
        'timestamp': int(time.time() * 1000)
    }
    
    print(json.dumps(stats))
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;
          
          const python = spawn('python3', ['-c', pythonScript]);
          let output = '';
          let error = '';
          
          python.stdout.on('data', (data) => output += data);
          python.stderr.on('data', (data) => error += data);
          
          python.on('close', (code) => {
            if (code === 0) {
              try {
                resolve(JSON.parse(output));
              } catch (e) {
                reject(new Error('Failed to parse Python output'));
              }
            } else {
              reject(new Error(`Python profiler failed: ${error}`));
            }
          });
        });
      }
    };
  }

  _createJavaProfiler(info) {
    return {
      language: 'java',
      type: 'jmx',
      
      async getMemoryStats() {
        return new Promise((resolve, reject) => {
          const javaScript = `
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;

public class MemoryProfiler {
    public static void main(String[] args) {
        try {
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
            MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();
            
            System.out.println("{");
            System.out.println("  \\"heapUsed\\": " + heapUsage.getUsed() + ",");
            System.out.println("  \\"heapMax\\": " + heapUsage.getMax() + ",");
            System.out.println("  \\"nonHeapUsed\\": " + nonHeapUsage.getUsed() + ",");
            System.out.println("  \\"timestamp\\": " + System.currentTimeMillis());
            System.out.println("}");
        } catch (Exception e) {
            System.err.println("{\\"error\\": \\"" + e.getMessage() + "\\"}");
            System.exit(1);
        }
    }
}`;
          
          // This would need to compile and run Java code
          // For now, return mock data
          resolve({
            heapUsed: 0,
            heapMax: 0,
            nonHeapUsed: 0,
            timestamp: Date.now(),
            note: 'Java profiler requires JMX setup'
          });
        });
      }
    };
  }

  _createGoProfiler(info) {
    return {
      language: 'go',
      type: 'runtime',
      
      async getMemoryStats() {
        return new Promise((resolve, reject) => {
          const goScript = `
package main

import (
    "encoding/json"
    "fmt"
    "runtime"
    "time"
)

type MemStats struct {
    Alloc      uint64 \`json:"alloc"\`
    TotalAlloc uint64 \`json:"totalAlloc"\`
    Sys        uint64 \`json:"sys"\`
    NumGC      uint32 \`json:"numGC"\`
    Timestamp  int64  \`json:"timestamp"\`
}

func main() {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    
    stats := MemStats{
        Alloc:      m.Alloc,
        TotalAlloc: m.TotalAlloc,
        Sys:        m.Sys,
        NumGC:      m.NumGC,
        Timestamp:  time.Now().UnixMilli(),
    }
    
    jsonData, _ := json.Marshal(stats)
    fmt.Println(string(jsonData))
}`;
          
          // This would need to compile and run Go code
          resolve({
            alloc: 0,
            totalAlloc: 0,
            sys: 0,
            numGC: 0,
            timestamp: Date.now(),
            note: 'Go profiler requires runtime compilation'
          });
        });
      }
    };
  }

  _createCSharpProfiler(info) {
    return {
      language: 'csharp',
      type: 'gc',
      
      async getMemoryStats() {
        return new Promise((resolve) => {
          // Mock C# profiler - would use .NET APIs
          resolve({
            totalMemory: 0,
            gen0Collections: 0,
            gen1Collections: 0,
            gen2Collections: 0,
            timestamp: Date.now(),
            note: 'C# profiler requires .NET runtime'
          });
        });
      }
    };
  }

  _createCppProfiler(info) {
    return {
      language: 'cpp',
      type: 'system',
      
      async getMemoryStats() {
        return new Promise((resolve, reject) => {
          // Use system calls to get memory info
          exec('cat /proc/self/status | grep -E "VmRSS|VmSize"', (error, stdout) => {
            if (error) {
              resolve({
                error: 'C++ profiler requires system access',
                timestamp: Date.now()
              });
              return;
            }
            
            const lines = stdout.split('\n');
            const stats = { timestamp: Date.now() };
            
            lines.forEach(line => {
              if (line.includes('VmRSS')) {
                stats.rss = parseInt(line.match(/\d+/)[0]) * 1024; // Convert KB to bytes
              }
              if (line.includes('VmSize')) {
                stats.vsize = parseInt(line.match(/\d+/)[0]) * 1024;
              }
            });
            
            resolve(stats);
          });
        });
      }
    };
  }

  _createRustProfiler(info) {
    return {
      language: 'rust',
      type: 'system',
      
      async getMemoryStats() {
        return new Promise((resolve) => {
          resolve({
            note: 'Rust profiler requires custom implementation',
            timestamp: Date.now()
          });
        });
      }
    };
  }

  _createPhpProfiler(info) {
    return {
      language: 'php',
      type: 'builtin',
      
      async getMemoryStats() {
        return new Promise((resolve, reject) => {
          const phpScript = `<?php
echo json_encode([
    'memory_usage' => memory_get_usage(true),
    'memory_peak' => memory_get_peak_usage(true),
    'timestamp' => time() * 1000
]);
?>`;
          
          const php = spawn('php', ['-r', phpScript]);
          let output = '';
          
          php.stdout.on('data', (data) => output += data);
          php.on('close', (code) => {
            if (code === 0) {
              try {
                resolve(JSON.parse(output));
              } catch (e) {
                reject(new Error('Failed to parse PHP output'));
              }
            } else {
              reject(new Error('PHP profiler failed'));
            }
          });
        });
      }
    };
  }

  async getAllMemoryStats() {
    const stats = {
      timestamp: Date.now(),
      languages: {}
    };

    for (const [lang, profiler] of this.profilers) {
      try {
        stats.languages[lang] = await profiler.getMemoryStats();
      } catch (error) {
        stats.languages[lang] = {
          error: error.message,
          timestamp: Date.now()
        };
      }
    }

    return stats;
  }

  async generateReport() {
    const stats = await this.getAllMemoryStats();
    
    console.log('\n📊 Universal Memory Profiler Report');
    console.log('=====================================');
    
    for (const [lang, data] of Object.entries(stats.languages)) {
      console.log(`\n🔹 ${lang.toUpperCase()}`);
      
      if (data.error) {
        console.log(`  ❌ Error: ${data.error}`);
        continue;
      }
      
      // Format memory values
      const formatBytes = (bytes) => {
        if (!bytes) return 'N/A';
        const mb = bytes / 1024 / 1024;
        return `${mb.toFixed(2)} MB`;
      };
      
      // Language-specific formatting
      switch (lang) {
        case 'javascript':
          console.log(`  Heap Used: ${formatBytes(data.heapUsed)}`);
          console.log(`  Heap Total: ${formatBytes(data.heapTotal)}`);
          console.log(`  RSS: ${formatBytes(data.rss)}`);
          break;
        case 'python':
          console.log(`  RSS: ${formatBytes(data.rss)}`);
          console.log(`  VMS: ${formatBytes(data.vms)}`);
          console.log(`  Memory %: ${data.percent?.toFixed(2)}%`);
          break;
        case 'java':
          console.log(`  Heap Used: ${formatBytes(data.heapUsed)}`);
          console.log(`  Heap Max: ${formatBytes(data.heapMax)}`);
          break;
        default:
          console.log(`  Data: ${JSON.stringify(data, null, 2)}`);
      }
    }
    
    return stats;
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Universal Memory Profiler stopped');
  }
}

module.exports = UniversalMemoryProfiler;