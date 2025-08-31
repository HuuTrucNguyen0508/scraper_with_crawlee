import { PlaywrightCrawler, Dataset } from 'crawlee';
import { writeFileSync } from 'fs';
import { extractContentWithRetry, extractNovelTitle, extractChapterTitle } from '../utils/contentExtractor.js';
import { createMarkdownContent, getNovelName } from '../utils/markdownGenerator.js';
import { showProgress, showCompletionSummary } from '../ui/cli.js';

// Function to run the improved crawler
export async function runImprovedCrawler(url, count, outputDir, settings) {
  // Global state to track progress
  let chaptersScraped = 0;
  const maxChapters = count;
  const allChapters = [];
  const failedChapters = [];
  let novelTitle = ''; // Store the novel title globally
  
  // Create the improved crawler
  const crawler = new PlaywrightCrawler({
    headless: settings.headless,
    
    async requestHandler({ page, request, log, crawler }) {
      try {
        // Update progress display
        showProgress(chaptersScraped + 1, maxChapters, request.url, 'Loading page...');
        
        // Wait for the page to load with configurable timeout
        try {
          await page.waitForLoadState('networkidle', { timeout: settings.pageTimeout });
        } catch (timeoutError) {
          log.warning(`Page load timeout after ${settings.pageTimeout}ms, continuing anyway...`);
        }
        
        // Additional wait for dynamic content
        await page.waitForTimeout(2000);
        
        // Extract novel title on the first page only
        if (chaptersScraped === 0 && !novelTitle) {
          novelTitle = await extractNovelTitle(page, log);
          if (novelTitle) {
            log.info(`📚 Novel title extracted: "${novelTitle}"`);
          }
        }
        
        // Extract chapter title with the correct CSS selector
        const chapterTitle = await extractChapterTitle(page, log);
        
        // Extract chapter content with improved strategies
        const { content: chapterContent, method: extractionMethod } = await extractContentWithRetry(page, log, request.url, settings);
        
        // Check if content extraction was successful
        if (!chapterContent || chapterContent.trim().length < 50) {
          log.warning(`Content extraction failed or insufficient content for ${request.url}`);
          log.info(`Extraction method attempted: ${extractionMethod}`);
          
          // Add to failed chapters list
          failedChapters.push({
            number: chaptersScraped + 1,
            url: request.url,
            issue: 'Insufficient content extracted',
            method: extractionMethod
          });
        }
        
        // Log the actual content length for debugging
        log.info(`📝 Raw content length: ${chapterContent?.length || 0} characters`);
        log.info(`📝 Cleaned content length: ${chapterContent?.length || 0} characters`);
        
        // Save the extracted data
        const chapterData = {
          url: request.url,
          title: chapterTitle,
          content: chapterContent,
          chapterNumber: chaptersScraped + 1,
          scrapedAt: new Date().toISOString(),
          extractionMethod: extractionMethod
        };
        
        await Dataset.pushData(chapterData);
        allChapters.push(chapterData);
        
        if (chapterContent && chapterContent.trim().length >= 50) {
          log.info(`✅ Successfully scraped: "${chapterTitle}" (${extractionMethod})`);
          log.info(`📝 Content length: ${chapterContent.length} characters`);
        } else {
          log.warning(`⚠️  Chapter scraped but with insufficient content: "${chapterTitle}" (${extractionMethod})`);
          log.info(`📝 Content length: ${chapterContent.length} characters`);
        }
        
        chaptersScraped++;
        
        // Check if we need to scrape more chapters
        if (chaptersScraped < maxChapters) {
          // Look for "Next" chapter link
          let nextChapterUrl = null;
          
          try {
            const nextLinkSelectors = [
              'a[title*="Next"]',
              'a[title*="next"]',
              'a.next',
              '.next-chapter',
              '.chapter-nav .next',
              'a:has-text("Next")',
              'a:has-text("next")',
              'a:has-text("Next Chapter")',
              'a:has-text("→")',
              '.pagination .next',
              '[rel="next"]'
            ];
            
            for (const selector of nextLinkSelectors) {
              try {
                const nextLink = await page.locator(selector).first();
                if (await nextLink.isVisible()) {
                  nextChapterUrl = await nextLink.getAttribute('href');
                  if (nextChapterUrl) {
                    if (nextChapterUrl.startsWith('/')) {
                      const currentUrl = new URL(request.url);
                      nextChapterUrl = `${currentUrl.origin}${nextChapterUrl}`;
                    }
                    break;
                  }
                }
              } catch (selectorError) {
                // Continue trying other selectors
              }
            }
          } catch (error) {
            log.warning(`Could not find next chapter link: ${error.message}`);
          }
          
          // Add next chapter to the queue if found
          if (nextChapterUrl && (nextChapterUrl.includes('novelbin.com') || nextChapterUrl.includes('novelbin.me'))) {
            // Add delay before next request
            if (settings.delay > 0) {
              await new Promise(resolve => setTimeout(resolve, settings.delay));
            }
            
            await crawler.addRequests([{
              url: nextChapterUrl,
              uniqueKey: nextChapterUrl
            }]);
          } else {
            log.warning(`❌ Could not find valid next chapter link. Stopping crawl.`);
            chaptersScraped = maxChapters;
          }
        }
        
      } catch (error) {
        log.error(`❌ Error processing ${request.url}: ${error.message}`);
        throw error;
      }
    },
    
    async failedRequestHandler({ request, log }) {
      log.error(`❌ Request failed after retries: ${request.url}`);
      
      // Add to failed chapters list
      failedChapters.push({
        number: chaptersScraped + 1,
        url: request.url,
        issue: 'Request failed after retries'
      });
      
      await Dataset.pushData({
        url: request.url,
        title: 'FAILED',
        content: 'Failed to scrape this chapter',
        chapterNumber: chaptersScraped + 1,
        error: 'Request failed after retries',
        scrapedAt: new Date().toISOString()
      });
    },
    
    maxRequestRetries: settings.retryAttempts,
    requestHandlerTimeoutSecs: Math.ceil(settings.pageTimeout / 1000) + 30,
    maxConcurrency: 1,
    
    launchContext: {
      launchOptions: {
        headless: settings.headless,
        timeout: settings.pageTimeout + 10000
      }
    }
  });
  
  try {
    // Add the starting URL to the request queue
    await crawler.run([{
      url: url,
      uniqueKey: url
    }]);
    
    // Get information about the saved data
    const dataset = await Dataset.open();
    const info = await dataset.getInfo();
    
    // Get novel name for better file naming
    const novelName = getNovelName(url);
    const timestamp = Date.now();
    
    // Export data to JSON file
    const jsonFilename = `${outputDir}/chapters-${timestamp}.json`;
    const allData = await dataset.getData();
    writeFileSync(jsonFilename, JSON.stringify(allData, null, 2), 'utf8');
    
    // Export combined markdown file
    let markdownFilename = '';
    if (allChapters.length > 0) {
      const markdownContent = createMarkdownContent(allChapters, novelTitle);
      markdownFilename = `${outputDir}/${novelName}-chapters-${timestamp}.md`;
      writeFileSync(markdownFilename, markdownContent, 'utf8');
    }
    
    // Show completion summary
    const files = [
      `chapters-${timestamp}.json`,
      `${novelName}-chapters-${timestamp}.md`
    ];
    
    showCompletionSummary(chaptersScraped, outputDir, files, failedChapters);
    
  } catch (error) {
    console.error(`❌ Crawling failed: ${error.message}`);
    throw error;
  }
}
