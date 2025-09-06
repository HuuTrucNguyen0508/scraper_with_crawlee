import 'dotenv/config';
import { PlaywrightCrawler, Dataset } from 'crawlee';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { extractContentWithRetry, extractNovelTitle, extractChapterTitle } from './utils/contentExtractor.js';
import { createMarkdownContent, getNovelName } from './utils/markdownGenerator.js';

// Function to retry failed chapters with higher delays and more retries
export async function retryFailedChapters(retryFilePath, outputDir, settings = {}, chapterMapping = null) {
  console.log('🔄 Starting Retry Crawler for Failed Chapters...\n');
  
  // Load retry data
  if (!existsSync(retryFilePath)) {
    throw new Error(`Retry file not found: ${retryFilePath}`);
  }
  
  const retryData = JSON.parse(readFileSync(retryFilePath, 'utf8'));
  const failedChapters = retryData.failedChapters;
  const metadata = retryData.metadata;
  
  if (failedChapters.length === 0) {
    console.log('✅ No failed chapters to retry!');
    return;
  }
  
  console.log(`📊 Found ${failedChapters.length} failed chapters to retry`);
  console.log(`📚 Novel: ${metadata.novelName} (Chapters ${metadata.startChapter}-${metadata.endChapter})`);
  console.log(`⚙️  Using enhanced retry settings...\n`);
  
  // Enhanced retry settings
  const retrySettings = {
    delay: settings.delay || 8000, // 8 seconds default (slower)
    maxConcurrency: settings.maxConcurrency || 1, // Sequential by default
    retryAttempts: settings.retryAttempts || 5, // More retries
    pageTimeout: settings.pageTimeout || 60000, // Longer timeout
    headless: settings.headless !== false,
    useFirecrawl: settings.useFirecrawl !== false
  };
  
  console.log('🔧 Retry Configuration:');
  console.log(`   ⏱️  Delay: ${retrySettings.delay}ms`);
  console.log(`   ⚡ Concurrency: ${retrySettings.maxConcurrency}`);
  console.log(`   🔄 Retry attempts: ${retrySettings.retryAttempts}`);
  console.log(`   ⏰ Page timeout: ${retrySettings.pageTimeout}ms`);
  console.log(`   🌐 Headless: ${retrySettings.headless}`);
  console.log(`   🔥 Firecrawl: ${retrySettings.useFirecrawl}\n`);
  
  // Track retry progress
  let retryResults = {
    successful: [],
    stillFailed: [],
    totalProcessed: 0
  };
  
  // Create retry crawler
  const crawler = new PlaywrightCrawler({
    headless: retrySettings.headless,
    
    async requestHandler({ page, request, log }) {
      try {
        const chapterNumber = request.userData?.chapterNumber;
        const originalError = request.userData?.originalError;
        
        const retryProgress = retryResults.totalProcessed + 1;
        const totalRetries = failedChapters.length;
        console.log(`🔄 Retrying Chapter ${chapterNumber} (${retryProgress}/${totalRetries})...`);
        console.log(`   📍 URL: ${request.url}`);
        console.log(`   ❌ Original error: ${originalError}`);
        
        // Enhanced delay for retry
        if (retrySettings.delay > 0) {
          const randomDelay = retrySettings.delay + Math.random() * 2000; // Add more randomness
          console.log(`   ⏳ Waiting ${Math.round(randomDelay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
        
        // Wait for page load with longer timeout
        try {
          await page.waitForLoadState('networkidle', { timeout: retrySettings.pageTimeout });
        } catch (timeoutError) {
          log.warning(`Page load timeout after ${retrySettings.pageTimeout}ms, continuing anyway...`);
        }
        
        // Additional wait for dynamic content
        await page.waitForTimeout(3000);
        
        // Extract chapter title
        const chapterTitle = await extractChapterTitle(page, log);
        
        // Extract chapter content with enhanced retry
        const { content: chapterContent, method: extractionMethod } = await extractContentWithRetry(
          page, 
          log, 
          request.url, 
          retrySettings
        );
        
        // Check if retry was successful
        if (chapterContent && chapterContent.trim().length >= 50) {
          console.log(`   ✅ SUCCESS! Chapter ${chapterNumber} retried successfully`);
          console.log(`   📝 Content length: ${chapterContent.length} characters`);
          console.log(`   🔧 Method: ${extractionMethod}\n`);
          
          // Update chapter mapping if provided
          if (chapterMapping) {
            const chapterData = chapterMapping.get(chapterNumber);
            if (chapterData) {
              chapterData.status = 'success';
              chapterData.title = chapterTitle;
              chapterData.content = chapterContent;
              chapterData.extractionMethod = extractionMethod;
              chapterData.scrapedAt = new Date().toISOString();
              chapterData.retryCount = (chapterData.retryCount || 0) + 1;
            }
          }
          
          // Save successful retry
          const retryData = {
            url: request.url,
            title: chapterTitle,
            content: chapterContent,
            chapterNumber: chapterNumber,
            scrapedAt: new Date().toISOString(),
            extractionMethod: extractionMethod,
            retryAttempt: request.userData?.retryAttempt || 1,
            originalError: originalError
          };
          
          await Dataset.pushData(retryData);
          retryResults.successful.push(retryData);
          
        } else {
          console.log(`   ❌ FAILED! Chapter ${chapterNumber} still failed after retry`);
          console.log(`   📝 Content length: ${chapterContent?.length || 0} characters`);
          console.log(`   🔧 Method attempted: ${extractionMethod}\n`);
          
          retryResults.stillFailed.push({
            chapterNumber: chapterNumber,
            url: request.url,
            originalError: originalError,
            retryError: 'Insufficient content after retry',
            contentLength: chapterContent?.length || 0
          });
        }
        
        retryResults.totalProcessed++;
        
      } catch (error) {
        console.log(`   ❌ ERROR! Chapter ${request.userData?.chapterNumber} failed with error: ${error.message}\n`);
        
        retryResults.stillFailed.push({
          chapterNumber: request.userData?.chapterNumber,
          url: request.url,
          originalError: request.userData?.originalError,
          retryError: error.message
        });
        
        retryResults.totalProcessed++;
        throw error;
      }
    },
    
    async failedRequestHandler({ request, log }) {
      console.log(`   ❌ FINAL FAILURE! Chapter ${request.userData?.chapterNumber} failed after all retries\n`);
      
      retryResults.stillFailed.push({
        chapterNumber: request.userData?.chapterNumber,
        url: request.url,
        originalError: request.userData?.originalError,
        retryError: 'Failed after all retry attempts'
      });
      
      retryResults.totalProcessed++;
    },
    
    maxRequestRetries: retrySettings.retryAttempts,
    requestHandlerTimeoutSecs: Math.ceil(retrySettings.pageTimeout / 1000) + 60,
    maxConcurrency: retrySettings.maxConcurrency,
    
    launchContext: {
      launchOptions: {
        headless: retrySettings.headless,
        timeout: retrySettings.pageTimeout + 15000
      }
    }
  });
  
  try {
    // Prepare retry requests
    const retryRequests = failedChapters.map((chapter, index) => ({
      url: chapter.url,
      uniqueKey: `${chapter.url}-retry-${Date.now()}-${index}`,
      userData: {
        chapterNumber: chapter.chapterNumber,
        originalError: chapter.error,
        retryAttempt: chapter.retryCount + 1
      }
    }));
    
    console.log(`🚀 Starting retry process for ${retryRequests.length} chapters...\n`);
    
    // Run retry crawler
    await crawler.run(retryRequests);
    
    // Generate retry report
    const timestamp = Date.now();
    const retryReport = {
      metadata: {
        ...metadata,
        retryPerformedAt: new Date().toISOString(),
        retrySettings: retrySettings
      },
      retryResults: {
        totalProcessed: retryResults.totalProcessed,
        successful: retryResults.successful.length,
        stillFailed: retryResults.stillFailed.length,
        successRate: `${Math.round((retryResults.successful.length / retryResults.totalProcessed) * 100)}%`
      },
      successfulRetries: retryResults.successful,
      stillFailedChapters: retryResults.stillFailed
    };
    
    // Save retry report
    const reportFilename = `${outputDir}/retry-report-${timestamp}.json`;
    writeFileSync(reportFilename, JSON.stringify(retryReport, null, 2), 'utf8');
    
    // Show retry summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 RETRY CRAWLER COMPLETED! 🎉');
    console.log('='.repeat(60));
    console.log(`📊 Total chapters processed: ${retryResults.totalProcessed}`);
    console.log(`✅ Successfully retried: ${retryResults.successful.length}`);
    console.log(`❌ Still failed: ${retryResults.stillFailed.length}`);
    console.log(`📈 Success rate: ${retryReport.retryResults.successRate}`);
    console.log(`📄 Retry report saved: ${reportFilename}`);
    
    if (retryResults.successful.length > 0) {
      console.log('\n✅ Successfully retried chapters:');
      retryResults.successful.forEach(chapter => {
        console.log(`   Chapter ${chapter.chapterNumber}: ${chapter.title}`);
      });
    }
    
    if (retryResults.stillFailed.length > 0) {
      console.log('\n❌ Still failed chapters:');
      retryResults.stillFailed.forEach(chapter => {
        console.log(`   Chapter ${chapter.chapterNumber}: ${chapter.retryError}`);
      });
    }
    
    console.log('\n🚀 What\'s next?');
    console.log('   - Check the retry report for detailed results');
    console.log('   - Run the retry crawler again for still-failed chapters');
    console.log('   - Manually check specific chapters if needed');
    console.log('   - Merge successful retries with your main novel file\n');
    
    return retryReport;
    
  } catch (error) {
    console.error(`❌ Retry crawling failed: ${error.message}`);
    throw error;
  }
}

// CLI function for easy retry
export async function runRetryCLI() {
  console.log('🔄 Novel Chapter Retry Crawler\n');
  
  // Simple CLI for retry
  const retryFilePath = process.argv[2];
  const outputDir = process.argv[3] || 'novel-output';
  
  if (!retryFilePath) {
    console.log('Usage: node src/retry-crawler.js <retry-file-path> [output-dir]');
    console.log('Example: node src/retry-crawler.js novel-output/retry-chapters-1234567890.json');
    process.exit(1);
  }
  
  try {
    await retryFailedChapters(retryFilePath, outputDir);
  } catch (error) {
    console.error(`❌ Retry failed: ${error.message}`);
    process.exit(1);
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRetryCLI();
}
