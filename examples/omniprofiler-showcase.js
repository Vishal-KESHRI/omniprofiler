const { autoProfile, generateReport } = require('../index');

async function showcaseOmniProfiler() {
  console.log('🌟 OmniProfiler - Universal Memory Profiler');
  console.log('==========================================');
  console.log('🚀 Auto-detecting and profiling ALL languages in your project...\n');

  try {
    // One line to profile everything
    const profiler = await autoProfile();
    
    console.log('✅ OmniProfiler successfully detected and is monitoring:');
    
    const stats = await profiler.getAllMemoryStats();
    
    for (const [language, data] of Object.entries(stats.languages)) {
      if (data.error) {
        console.log(`   ${language.toUpperCase()}: ⚠️  ${data.error}`);
      } else {
        const memoryMB = getMemoryUsage(language, data);
        const status = memoryMB > 100 ? '🔴' : memoryMB > 50 ? '🟡' : '🟢';
        console.log(`   ${language.toUpperCase()}: ${status} ${memoryMB}MB`);
      }
    }

    console.log('\n🎯 OmniProfiler Features:');
    console.log('   ✅ Universal Language Detection');
    console.log('   ✅ Framework-Aware Profiling');
    console.log('   ✅ Real-time Leak Detection');
    console.log('   ✅ Cross-Platform Memory Analysis');
    console.log('   ✅ Production-Safe Monitoring');
    console.log('   ✅ Zero Configuration Required');

    // Generate comprehensive report
    const reports = await generateReport(profiler, null, {
      format: 'html',
      outputDir: './omniprofiler-reports'
    });

    console.log('\n📊 OmniProfiler Report Generated:');
    if (reports.html) {
      console.log(`   🌐 Visual Dashboard: ${reports.html}`);
      console.log('   📈 Memory trends, leak analysis, and optimization recommendations');
    }

    profiler.stop();
    console.log('\n🎉 OmniProfiler demo complete!');
    console.log('   Ready to monitor your multi-language, multi-framework projects!');

  } catch (error) {
    console.error('❌ OmniProfiler Error:', error.message);
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

showcaseOmniProfiler().catch(console.error);