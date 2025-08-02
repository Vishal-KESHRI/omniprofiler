#!/usr/bin/env python3
"""
Python Memory Profiler Component
Provides detailed memory profiling for Python applications
"""

import psutil
import tracemalloc
import json
import sys
import time
import gc
import threading
from typing import Dict, Any, List

class PythonMemoryProfiler:
    def __init__(self, options: Dict[str, Any] = None):
        self.options = options or {}
        self.process = psutil.Process()
        self.is_running = False
        self.samples = []
        self.max_samples = self.options.get('max_samples', 100)
        
        # Start tracemalloc for detailed tracking
        if not tracemalloc.is_tracing():
            tracemalloc.start()
    
    def start(self):
        """Start memory profiling"""
        self.is_running = True
        print("🐍 Python Memory Profiler started")
    
    def stop(self):
        """Stop memory profiling"""
        self.is_running = False
        print("🐍 Python Memory Profiler stopped")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get comprehensive memory statistics"""
        try:
            # Process memory info
            memory_info = self.process.memory_info()
            memory_percent = self.process.memory_percent()
            
            # Tracemalloc statistics
            current, peak = tracemalloc.get_traced_memory()
            
            # Garbage collection stats
            gc_stats = gc.get_stats()
            
            stats = {
                'timestamp': int(time.time() * 1000),
                'rss': memory_info.rss,  # Resident Set Size
                'vms': memory_info.vms,  # Virtual Memory Size
                'percent': memory_percent,
                'traced_current': current,
                'traced_peak': peak,
                'gc_collections': [stat['collections'] for stat in gc_stats],
                'gc_collected': [stat['collected'] for stat in gc_stats],
                'gc_uncollectable': [stat['uncollectable'] for stat in gc_stats],
                'object_count': len(gc.get_objects())
            }
            
            # Add to samples
            self.samples.append(stats)
            if len(self.samples) > self.max_samples:
                self.samples.pop(0)
            
            return stats
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': int(time.time() * 1000)
            }
    
    def get_top_memory_objects(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top memory consuming objects"""
        try:
            snapshot = tracemalloc.take_snapshot()
            top_stats = snapshot.statistics('lineno')
            
            objects = []
            for index, stat in enumerate(top_stats[:limit]):
                objects.append({
                    'rank': index + 1,
                    'filename': stat.traceback.format()[0] if stat.traceback else 'unknown',
                    'size_mb': stat.size / 1024 / 1024,
                    'count': stat.count
                })
            
            return objects
            
        except Exception as e:
            return [{'error': str(e)}]
    
    def detect_memory_leaks(self) -> Dict[str, Any]:
        """Detect potential memory leaks"""
        if len(self.samples) < 5:
            return {'status': 'insufficient_data'}
        
        recent_samples = self.samples[-5:]
        
        # Calculate growth rate
        first_sample = recent_samples[0]
        last_sample = recent_samples[-1]
        
        time_diff = (last_sample['timestamp'] - first_sample['timestamp']) / 1000  # seconds
        memory_growth = last_sample['rss'] - first_sample['rss']
        
        growth_rate = memory_growth / time_diff if time_diff > 0 else 0  # bytes per second
        
        # Check for consistent growth
        is_leak = growth_rate > 1024 * 1024  # 1MB/sec threshold
        
        return {
            'is_leak_detected': is_leak,
            'growth_rate_mb_per_sec': growth_rate / 1024 / 1024,
            'total_growth_mb': memory_growth / 1024 / 1024,
            'duration_seconds': time_diff,
            'confidence': min(abs(growth_rate) / (1024 * 1024) * 100, 100)
        }
    
    def force_gc(self) -> Dict[str, Any]:
        """Force garbage collection"""
        before_stats = self.get_memory_stats()
        
        # Force garbage collection
        collected = gc.collect()
        
        after_stats = self.get_memory_stats()
        
        freed_bytes = before_stats['rss'] - after_stats['rss']
        
        return {
            'objects_collected': collected,
            'memory_freed_mb': freed_bytes / 1024 / 1024,
            'before_rss_mb': before_stats['rss'] / 1024 / 1024,
            'after_rss_mb': after_stats['rss'] / 1024 / 1024
        }

def main():
    """Main function for standalone usage"""
    if len(sys.argv) < 2:
        print("Usage: python-profiler.py <command>")
        print("Commands: stats, objects, leaks, gc")
        sys.exit(1)
    
    command = sys.argv[1]
    profiler = PythonMemoryProfiler()
    
    try:
        if command == 'stats':
            stats = profiler.get_memory_stats()
            print(json.dumps(stats, indent=2))
        
        elif command == 'objects':
            objects = profiler.get_top_memory_objects()
            print(json.dumps(objects, indent=2))
        
        elif command == 'leaks':
            # Take multiple samples for leak detection
            for i in range(5):
                profiler.get_memory_stats()
                time.sleep(1)
            
            leaks = profiler.detect_memory_leaks()
            print(json.dumps(leaks, indent=2))
        
        elif command == 'gc':
            gc_result = profiler.force_gc()
            print(json.dumps(gc_result, indent=2))
        
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)
    
    except Exception as e:
        error_result = {'error': str(e)}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()