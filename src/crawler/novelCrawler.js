import { PlaywrightCrawler, Dataset } from 'crawlee';
import { writeFileSync } from 'fs';
import { extractContentWithRetry, extractNovelTitle, extractChapterTitle } from '../utils/contentExtractor.js';
import { createMarkdownContent, getNovelName } from '../utils/markdownGenerator.js';
import { showProgress, showCompletionSummary } from '../ui/cli.js';
import { retryFailedChapters } from '../retry-crawler.js';

// Function to generate chapter URLs based on the starting URL
function generateChapterUrls(startUrl, count) {
  const urls = [];
  const urlObj = new URL(startUrl);
  const pathParts = urlObj.pathname.split('/');
  
  // Extract the base novel path and chapter number
  const novelPath = pathParts.slice(0, -1).join('/'); // Everything except the last part
  const chapterMatch = pathParts[pathParts.length - 1].match(/chapter-(\d+)/);
  
  if (!chapterMatch) {
    throw new Error('Could not extract chapter number from URL. Please use a URL like: https://novelbin.com/b/monster-paradise/chapter-1160');
  }
  
  const startChapter = parseInt(chapterMatch[1]);
  
  // Generate URLs for the requested number of chapters
  for (let i = 0; i < count; i++) {
    const chapterNumber = startChapter + i;
    const chapterUrl = `${urlObj.origin}${novelPath}/chapter-${chapterNumber}`;
    urls.push({
      url: chapterUrl,
      uniqueKey: chapterUrl,
      chapterNumber: i + 1
    });
  }
  
  return urls;
}

// Function to run the improved crawler with parallelization
export async function runImprovedCrawler(url, count, outputDir, settings) {
  // Global state to track progress
  let chaptersScraped = 0;
  const maxChapters = count;
  const allChapters = [];
  const failedChapters = [];
  let novelTitle = ''; // Store the novel title globally
  
  // Generate all chapter URLs upfront
  console.log(`🔗 Generating ${count} chapter URLs...`);
  const chapterUrls = generateChapterUrls(url, count);
  console.log(`✅ Generated URLs from ${chapterUrls[0].url} to ${chapterUrls[chapterUrls.length - 1].url}`);
  
  // Create a chapter mapping system to track all chapters with proper ordering
  const chapterMapping = new Map(); // Map actual chapter number to chapter data
  const chapterOrder = []; // Array to maintain order for output
  
  // Initialize chapter mapping with all chapters
  chapterUrls.forEach((chapter, index) => {
    const chapterData = {
      chapterIndex: index, // 0-49 for array indexing
      actualChapterNumber: chapter.chapterNumber, // 1167-1216
      url: chapter.url,
      status: 'pending', // pending, success, failed
      content: null,
      title: null,
      error: null,
      extractionMethod: null,
      scrapedAt: null,
      retryCount: 0
    };
    
    chapterMapping.set(chapter.chapterNumber, chapterData);
    chapterOrder.push(chapter.chapterNumber); // Maintain order for output
  });
  
  // Create the improved crawler with parallelization
  const crawler = new PlaywrightCrawler({
    headless: settings.headless,
    
    async requestHandler({ page, request, log, crawler }) {
      try {
        // Extract actual chapter number from the request metadata
        const actualChapterNumber = request.userData?.actualChapterNumber;
        if (!actualChapterNumber) {
          throw new Error(`No chapter number found in request metadata for ${request.url}`);
        }
        
        // Get the chapter data from mapping
        const chapterData = chapterMapping.get(actualChapterNumber);
        if (!chapterData) {
          throw new Error(`Chapter data not found for chapter ${actualChapterNumber}`);
        }
        
        // Add delay between requests to avoid overwhelming the server
        if (settings.delay > 0) {
          const randomDelay = settings.delay + Math.random() * 1000; // Add some randomness
          await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
        
        // Update progress display with actual chapter number
        const completedChapters = Array.from(chapterMapping.values()).filter(ch => ch.status === 'success').length;
        showProgress(completedChapters + 1, maxChapters, request.url, `Chapter ${actualChapterNumber} - Loading page...`);
        
        // Wait for the page to load with configurable timeout
        try {
          await page.waitForLoadState('networkidle', { timeout: settings.pageTimeout });
        } catch (timeoutError) {
          log.warning(`Page load timeout after ${settings.pageTimeout}ms, continuing anyway...`);
        }
        
        // Additional wait for dynamic content
        await page.waitForTimeout(2000);
        
        // Extract novel title on the first page only
        if (completedChapters === 0 && !novelTitle) {
          novelTitle = await extractNovelTitle(page, log);
          if (novelTitle) {
            log.info(`📚 Novel title extracted: "${novelTitle}"`);
          }
        }
        
        // Extract chapter title with the correct CSS selector
        const chapterTitle = await extractChapterTitle(page, log);
        
        // Extract chapter content with improved strategies
        const { content: chapterContent, method: extractionMethod } = await extractContentWithRetry(page, log, request.url, settings);
        
        // Update chapter data in mapping
        chapterData.status = 'success';
        chapterData.title = chapterTitle;
        chapterData.content = chapterContent;
        chapterData.extractionMethod = extractionMethod;
        chapterData.scrapedAt = new Date().toISOString();
        
        // Check if content extraction was successful
        if (!chapterContent || chapterContent.trim().length < 50) {
          log.warning(`Content extraction failed or insufficient content for Chapter ${actualChapterNumber}`);
          log.info(`Extraction method attempted: ${extractionMethod}`);
          
          chapterData.status = 'failed';
          chapterData.error = 'Insufficient content extracted';
          
          // Add to failed chapters list
          failedChapters.push({
            number: actualChapterNumber,
            url: request.url,
            issue: 'Insufficient content extracted',
            method: extractionMethod
          });
        }
        
        // Log the actual content length for debugging
        log.info(`📝 Raw content length: ${chapterContent?.length || 0} characters`);
        log.info(`📝 Cleaned content length: ${chapterContent?.length || 0} characters`);
        
        // Save the extracted data to dataset
        const datasetData = {
          url: request.url,
          title: chapterTitle,
          content: chapterContent,
          chapterNumber: actualChapterNumber,
          scrapedAt: new Date().toISOString(),
          extractionMethod: extractionMethod
        };
        
        await Dataset.pushData(datasetData);
        allChapters.push(datasetData);
        
        if (chapterData.status === 'success') {
          log.info(`✅ Successfully scraped: "Chapter ${actualChapterNumber} - ${chapterTitle}" (${extractionMethod})`);
          log.info(`📝 Content length: ${chapterContent.length} characters`);
        } else {
          log.warning(`⚠️  Chapter ${actualChapterNumber} scraped but with insufficient content: "${chapterTitle}" (${extractionMethod})`);
          log.info(`📝 Content length: ${chapterContent.length} characters`);
        }
        
      } catch (error) {
        log.error(`❌ Error processing ${request.url}: ${error.message}`);
        
        // Update chapter data to failed status
        const actualChapterNumber = request.userData?.actualChapterNumber;
        if (actualChapterNumber) {
          const chapterData = chapterMapping.get(actualChapterNumber);
          if (chapterData) {
            chapterData.status = 'failed';
            chapterData.error = error.message;
            chapterData.retryCount++;
          }
        }
        
        throw error;
      }
    },
    
    async failedRequestHandler({ request, log }) {
      const actualChapterNumber = request.userData?.actualChapterNumber;
      log.error(`❌ Request failed after retries: ${request.url}`);
      
      // Update chapter data to failed status
      if (actualChapterNumber) {
        const chapterData = chapterMapping.get(actualChapterNumber);
        if (chapterData) {
          chapterData.status = 'failed';
          chapterData.error = 'Request failed after retries';
          chapterData.retryCount++;
          
          // Add to failed chapters list
          failedChapters.push({
            number: actualChapterNumber,
            url: request.url,
            issue: 'Request failed after retries'
          });
        }
      }
      
      await Dataset.pushData({
        url: request.url,
        title: 'FAILED',
        content: 'Failed to scrape this chapter',
        chapterNumber: actualChapterNumber,
        error: 'Request failed after retries',
        scrapedAt: new Date().toISOString()
      });
    },
    
    maxRequestRetries: settings.retryAttempts,
    requestHandlerTimeoutSecs: Math.ceil(settings.pageTimeout / 1000) + 30,
    maxConcurrency: settings.maxConcurrency || 3, // Allow parallel processing
    
    // Add better rate limiting for parallel requests
    autoscaledPoolOptions: {
      maxConcurrency: settings.maxConcurrency || 3,
      desiredConcurrency: Math.min(settings.maxConcurrency || 3, 2), // Start conservative
      scaleUpStepRatio: 0.1, // Increase slowly
      scaleDownStepRatio: 0.05, // Decrease slowly
    },
    
    launchContext: {
      launchOptions: {
        headless: settings.headless,
        timeout: settings.pageTimeout + 10000
      }
    }
  });
  
  try {
    // Add all chapter URLs to the request queue with metadata
    const requestsWithMetadata = chapterUrls.map(chapter => ({
      url: chapter.url,
      uniqueKey: chapter.url,
      userData: { 
        actualChapterNumber: chapter.chapterNumber,
        chapterIndex: chapter.chapterNumber - chapterUrls[0].chapterNumber
      }
    }));
    
    console.log(`🚀 Starting parallel crawling of ${requestsWithMetadata.length} chapters...`);
    console.log(`📊 Chapter range: ${chapterUrls[0].chapterNumber} to ${chapterUrls[chapterUrls.length - 1].chapterNumber}`);
    await crawler.run(requestsWithMetadata);
    
    // Get information about the saved data
    const dataset = await Dataset.open();
    const info = await dataset.getInfo();
    
    // Get novel name for better file naming
    const novelName = getNovelName(url);
    const timestamp = Date.now();
    
    // Create ordered chapter data for output
    const orderedChapters = chapterOrder.map(chapterNum => {
      const chapterData = chapterMapping.get(chapterNum);
      return {
        chapterIndex: chapterData.chapterIndex,
        actualChapterNumber: chapterData.actualChapterNumber,
        url: chapterData.url,
        status: chapterData.status,
        title: chapterData.title,
        content: chapterData.content,
        error: chapterData.error,
        extractionMethod: chapterData.extractionMethod,
        scrapedAt: chapterData.scrapedAt,
        retryCount: chapterData.retryCount
      };
    });
    
    // Create comprehensive output data
    const outputData = {
      metadata: {
        novelTitle: novelTitle,
        novelName: novelName,
        startChapter: chapterUrls[0].chapterNumber,
        endChapter: chapterUrls[chapterUrls.length - 1].chapterNumber,
        totalChapters: count,
        scrapedAt: new Date().toISOString(),
        settings: {
          delay: settings.delay,
          maxConcurrency: settings.maxConcurrency,
          retryAttempts: settings.retryAttempts,
          pageTimeout: settings.pageTimeout
        }
      },
      statistics: {
        totalChapters: count,
        successfulChapters: orderedChapters.filter(ch => ch.status === 'success').length,
        failedChapters: orderedChapters.filter(ch => ch.status === 'failed').length,
        pendingChapters: orderedChapters.filter(ch => ch.status === 'pending').length
      },
      chapters: orderedChapters,
      failedChapters: failedChapters,
      retryInfo: {
        chaptersNeedingRetry: orderedChapters.filter(ch => ch.status === 'failed').map(ch => ({
          chapterNumber: ch.actualChapterNumber,
          url: ch.url,
          error: ch.error,
          retryCount: ch.retryCount
        }))
      }
    };
    
    // Export comprehensive JSON file
    const jsonFilename = `${outputDir}/chapters-${timestamp}.json`;
    writeFileSync(jsonFilename, JSON.stringify(outputData, null, 2), 'utf8');
    
    // Export retry-specific JSON file for easy retry processing
    const retryFilename = `${outputDir}/retry-chapters-${timestamp}.json`;
    const retryData = {
      metadata: outputData.metadata,
      failedChapters: outputData.retryInfo.chaptersNeedingRetry
    };
    writeFileSync(retryFilename, JSON.stringify(retryData, null, 2), 'utf8');
    
    // Export combined markdown file
    let markdownFilename = '';
    const successfulChapters = orderedChapters.filter(ch => ch.status === 'success');
    if (successfulChapters.length > 0) {
      const markdownContent = createMarkdownContent(successfulChapters, novelTitle);
      markdownFilename = `${outputDir}/${novelName}-chapters-${timestamp}.md`;
      writeFileSync(markdownFilename, markdownContent, 'utf8');
    }
    
    // Show completion summary
    const files = [
      `chapters-${timestamp}.json`,
      `retry-chapters-${timestamp}.json`,
      `${novelName}-chapters-${timestamp}.md`
    ];
    
    const successfulCount = outputData.statistics.successfulChapters;
    const failedCount = outputData.statistics.failedChapters;
    
    // Show initial completion summary
    showCompletionSummary(successfulCount, outputDir, files, failedChapters);
    
    // Automatically retry failed chapters if there are any
    if (failedCount > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 AUTOMATIC RETRY AVAILABLE');
      console.log('='.repeat(60));
      console.log(`📊 Found ${failedCount} failed chapters that can be retried`);
      console.log('⚙️  Enhanced retry settings:');
      console.log(`   ⏱️  Delay: ${settings.delay * 2}ms (doubled)`);
      console.log(`   ⚡ Concurrency: 1 (sequential)`);
      console.log(`   🔄 Retry attempts: ${settings.retryAttempts + 2} (increased)`);
      console.log(`   ⏰ Page timeout: ${settings.pageTimeout * 2}ms (doubled)`);
      console.log(`   🔥 Firecrawl: ${settings.useFirecrawl ? 'Enabled' : 'Disabled'}\n`);
      
      // For now, automatically proceed with retry
      // In the future, you could add a user prompt here
      console.log('🚀 Starting automatic retry...\n');
      
      try {
        const retryResults = await retryFailedChapters(
          retryFilename, 
          outputDir, 
          {
            delay: settings.delay * 2, // Double the delay
            maxConcurrency: 1, // Sequential processing
            retryAttempts: settings.retryAttempts + 2, // More retries
            pageTimeout: settings.pageTimeout * 2, // Longer timeout
            headless: settings.headless,
            useFirecrawl: settings.useFirecrawl
          },
          chapterMapping // Pass the chapter mapping for updates
        );
        
        // Update the main output files with retry results
        if (retryResults.successful > 0) {
          console.log('\n🔄 Updating main output files with retry results...');
          
          // Re-generate the main JSON file with updated data
          const updatedOrderedChapters = chapterOrder.map(chapterNum => {
            const chapterData = chapterMapping.get(chapterNum);
            return {
              chapterIndex: chapterData.chapterIndex,
              actualChapterNumber: chapterData.actualChapterNumber,
              url: chapterData.url,
              status: chapterData.status,
              title: chapterData.title,
              content: chapterData.content,
              error: chapterData.error,
              extractionMethod: chapterData.extractionMethod,
              scrapedAt: chapterData.scrapedAt,
              retryCount: chapterData.retryCount
            };
          });
          
          // Update statistics
          const finalSuccessfulCount = updatedOrderedChapters.filter(ch => ch.status === 'success').length;
          const finalFailedCount = updatedOrderedChapters.filter(ch => ch.status === 'failed').length;
          
          const updatedOutputData = {
            ...outputData,
            statistics: {
              totalChapters: count,
              successfulChapters: finalSuccessfulCount,
              failedChapters: finalFailedCount,
              pendingChapters: 0
            },
            chapters: updatedOrderedChapters,
            retryResults: {
              initialSuccessful: successfulCount,
              retrySuccessful: retryResults.successful,
              finalSuccessful: finalSuccessfulCount,
              stillFailed: finalFailedCount,
              retrySuccessRate: `${Math.round((retryResults.successful / failedCount) * 100)}%`
            }
          };
          
          // Save updated JSON file
          writeFileSync(jsonFilename, JSON.stringify(updatedOutputData, null, 2), 'utf8');
          
          // Update markdown file if there are successful chapters
          if (finalSuccessfulCount > 0) {
            const successfulChapters = updatedOrderedChapters.filter(ch => ch.status === 'success');
            const updatedMarkdownContent = createMarkdownContent(successfulChapters, novelTitle);
            writeFileSync(markdownFilename, updatedMarkdownContent, 'utf8');
          }
          
          console.log('\n' + '='.repeat(60));
          console.log('🎉 AUTOMATIC RETRY COMPLETED! 🎉');
          console.log('='.repeat(60));
          console.log(`📊 Initial successful: ${successfulCount}`);
          console.log(`🔄 Retry successful: ${retryResults.successful}`);
          console.log(`✅ Final successful: ${finalSuccessfulCount}`);
          console.log(`❌ Still failed: ${finalFailedCount}`);
          console.log(`📈 Retry success rate: ${Math.round((retryResults.successful / failedCount) * 100)}%`);
          console.log(`📄 Updated files: ${jsonFilename}, ${markdownFilename}`);
          
        } else {
          console.log('\n❌ No chapters were successfully retried.');
          console.log('💡 You may want to try manual retry with different settings later.');
        }
        
      } catch (retryError) {
        console.error(`\n❌ Automatic retry failed: ${retryError.message}`);
        console.log('💡 You can still use the manual retry script later.');
      }
    } else {
      console.log('\n✅ No failed chapters to retry - all chapters scraped successfully!');
    }
    
  } catch (error) {
    console.error(`❌ Crawling failed: ${error.message}`);
    throw error;
  }
}
