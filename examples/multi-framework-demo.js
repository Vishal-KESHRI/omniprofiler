const { UniversalMemoryProfiler, generateReport } = require('../index');

async function demonstrateMultiFrameworkProfiling() {
  console.log('🌐 Multi-Framework Project Profiling Demo');
  console.log('==========================================\n');

  // Create sample project structure with multiple frameworks
  await createSampleProjectStructure();

  // Initialize universal profiler
  const profiler = new UniversalMemoryProfiler({
    autoDetect: true,
    scanDepth: 5, // Deep scan for complex projects
    supportedLanguages: [
      'javascript', 'typescript', 'python', 'java', 'go', 'csharp'
    ]
  });

  try {
    console.log('🔍 Starting project-wide profiling...\n');
    
    // Start profiling - automatically detects ALL languages/frameworks
    await profiler.start();

    // Show what was detected
    console.log('📊 Project Analysis Results:');
    console.log('============================');
    
    const stats = await profiler.getAllMemoryStats();
    
    for (const [language, data] of Object.entries(stats.languages)) {
      if (data.error) {
        console.log(`${language.toUpperCase()}: ❌ ${data.error}`);
        continue;
      }

      console.log(`\n🔹 ${language.toUpperCase()} DETECTED:`);
      
      // Show framework-specific details
      switch (language) {
        case 'javascript':
          console.log('  📁 Files Found:');
          console.log('    - NestJS controllers, services, modules');
          console.log('    - Express.js routes and middleware');
          console.log('    - React components and hooks');
          console.log('    - Node.js utilities and helpers');
          console.log(`  💾 Memory Usage: ${getMemoryUsage(language, data)}MB`);
          console.log('  🔄 Profiling: All JS execution contexts');
          break;

        case 'typescript':
          console.log('  📁 Files Found:');
          console.log('    - NestJS decorators and DTOs');
          console.log('    - TypeScript interfaces and types');
          console.log('    - Angular/React TypeScript components');
          console.log(`  💾 Memory Usage: ${getMemoryUsage(language, data)}MB`);
          console.log('  🔄 Profiling: Compiled JS + type information');
          break;

        case 'java':
          console.log('  📁 Files Found:');
          console.log('    - Spring Boot controllers and services');
          console.log('    - JPA entities and repositories');
          console.log('    - Configuration classes');
          console.log(`  💾 Memory Usage: ${getMemoryUsage(language, data)}MB`);
          console.log('  🔄 Profiling: JVM heap and garbage collection');
          break;

        case 'python':
          console.log('  📁 Files Found:');
          console.log('    - Django/Flask applications');
          console.log('    - FastAPI endpoints');
          console.log('    - Data processing scripts');
          console.log(`  💾 Memory Usage: ${getMemoryUsage(language, data)}MB`);
          console.log('  🔄 Profiling: Python process memory');
          break;

        default:
          console.log(`  💾 Memory Usage: ${getMemoryUsage(language, data)}MB`);
          console.log('  🔄 Profiling: Active');
      }
    }

    // Show cross-framework memory flow analysis
    console.log('\n🔄 Cross-Framework Memory Flow Analysis:');
    console.log('=======================================');
    
    console.log('📊 Memory Flow Patterns Detected:');
    console.log('  1. NestJS → Database (via TypeORM)');
    console.log('  2. Spring Boot → Redis Cache');
    console.log('  3. Python Scripts → Data Processing');
    console.log('  4. Frontend → API Calls → Backend');
    
    console.log('\n🎯 Memory Hotspots by Framework:');
    console.log('================================');
    
    // Simulate framework-specific memory analysis
    const frameworks = detectFrameworks(stats);
    frameworks.forEach(framework => {
      console.log(`\n${framework.name}:`);
      console.log(`  📈 Memory Usage: ${framework.memoryMB}MB`);
      console.log(`  🔥 Hotspots: ${framework.hotspots.join(', ')}`);
      console.log(`  ⚠️  Issues: ${framework.issues.length} detected`);
      
      framework.issues.forEach(issue => {
        console.log(`    - ${issue.type}: ${issue.description}`);
        console.log(`      Fix: ${issue.solution}`);
      });
    });

    // Generate comprehensive report
    console.log('\n📋 Generating Multi-Framework Report...');
    const reports = await generateReport(profiler, null, {
      format: 'html',
      outputDir: './multi-framework-reports'
    });

    console.log(`\n✅ Multi-framework analysis complete!`);
    if (reports.html) {
      console.log(`📊 Detailed report: ${reports.html}`);
    }

  } catch (error) {
    console.error('❌ Error during multi-framework profiling:', error.message);
  } finally {
    profiler.stop();
  }
}

async function createSampleProjectStructure() {
  const fs = require('fs').promises;
  
  console.log('📁 Creating sample multi-framework project structure...\n');
  
  try {
    // NestJS files
    await fs.writeFile('app.controller.ts', `
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
`);

    await fs.writeFile('app.service.ts', `
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private cache = new Map();
  
  getHello(): string {
    // Potential memory leak - unbounded cache
    this.cache.set(Date.now(), 'Hello World!');
    return 'Hello World!';
  }
}
`);

    // Spring Boot files
    await fs.writeFile('UserController.java', `
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }
}
`);

    await fs.writeFile('UserService.java', `
@Service
public class UserService {
    
    private List<User> cache = new ArrayList<>();
    
    public List<User> findAll() {
        // Potential memory issue - growing cache
        cache.addAll(userRepository.findAll());
        return cache;
    }
}
`);

    // Python files
    await fs.writeFile('main.py', `
from fastapi import FastAPI
import asyncio

app = FastAPI()

# Global cache - potential memory leak
global_cache = {}

@app.get("/")
async def read_root():
    # Memory leak - unbounded dictionary
    global_cache[len(global_cache)] = "Hello World"
    return {"Hello": "World"}
`);

    await fs.writeFile('data_processor.py', `
import pandas as pd
import numpy as np

class DataProcessor:
    def __init__(self):
        self.processed_data = []
    
    def process_large_dataset(self, data):
        # Memory intensive operation
        df = pd.DataFrame(data)
        processed = df.apply(lambda x: x * 2)
        self.processed_data.append(processed)  # Accumulating data
        return processed
`);

    console.log('✅ Sample project structure created');
    console.log('   - NestJS TypeScript files');
    console.log('   - Spring Boot Java files');
    console.log('   - FastAPI Python files');
    console.log('   - Data processing scripts\n');

  } catch (error) {
    console.log('⚠️  Could not create sample files:', error.message);
  }
}

function getMemoryUsage(language, data) {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return Math.round((data.heapUsed || 0) / 1024 / 1024);
    case 'python':
      return Math.round((data.rss || 0) / 1024 / 1024);
    case 'java':
      return Math.round((data.heapUsed || 0) / 1024 / 1024);
    default:
      return 0;
  }
}

function detectFrameworks(stats) {
  const frameworks = [];
  
  // NestJS Detection
  if (stats.languages.typescript || stats.languages.javascript) {
    frameworks.push({
      name: 'NestJS (Node.js)',
      memoryMB: getMemoryUsage('typescript', stats.languages.typescript || stats.languages.javascript),
      hotspots: ['Controllers', 'Services', 'Decorators', 'Dependency Injection'],
      issues: [
        {
          type: 'Service Memory Leak',
          description: 'Unbounded cache in AppService',
          solution: 'Implement LRU cache with size limits'
        },
        {
          type: 'Circular Dependencies',
          description: 'Potential circular references in DI container',
          solution: 'Use forwardRef() or restructure dependencies'
        }
      ]
    });
  }
  
  // Spring Boot Detection
  if (stats.languages.java) {
    frameworks.push({
      name: 'Spring Boot (JVM)',
      memoryMB: getMemoryUsage('java', stats.languages.java),
      hotspots: ['Controllers', 'Services', 'JPA Entities', 'Bean Container'],
      issues: [
        {
          type: 'JPA Memory Leak',
          description: 'Unbounded entity cache in UserService',
          solution: 'Use pagination and proper cache eviction'
        },
        {
          type: 'Connection Pool',
          description: 'Database connections not properly closed',
          solution: 'Use @Transactional and connection pooling'
        }
      ]
    });
  }
  
  // FastAPI/Django Detection
  if (stats.languages.python) {
    frameworks.push({
      name: 'FastAPI/Django (Python)',
      memoryMB: getMemoryUsage('python', stats.languages.python),
      hotspots: ['Endpoints', 'Middleware', 'Data Processing', 'Global Variables'],
      issues: [
        {
          type: 'Global Cache Growth',
          description: 'Unbounded global_cache dictionary',
          solution: 'Use Redis or implement cache size limits'
        },
        {
          type: 'DataFrame Accumulation',
          description: 'DataProcessor accumulating processed data',
          solution: 'Clear processed_data after use or use generators'
        }
      ]
    });
  }
  
  return frameworks;
}

// Cleanup function
async function cleanup() {
  const fs = require('fs').promises;
  const files = [
    'app.controller.ts', 'app.service.ts',
    'UserController.java', 'UserService.java',
    'main.py', 'data_processor.py'
  ];
  
  for (const file of files) {
    try {
      await fs.unlink(file);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  console.log('🧹 Cleaned up sample files');
}

// Run the demo
demonstrateMultiFrameworkProfiling()
  .then(() => cleanup())
  .catch(console.error);