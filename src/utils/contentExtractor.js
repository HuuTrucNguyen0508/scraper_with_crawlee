import { cleanContent } from './contentCleaner.js';
import { extractContentWithFirecrawl, isFirecrawlAvailable } from '../config/firecrawl.js';

// Function to extract content with multiple strategies
export async function extractContentWithRetry(page, log, currentUrl, settings) {
  let content = '';
  let extractionMethod = '';
  
  // Strategy 1: Try multiple content selectors
  const contentSelectors = [
    '.chapter-content',
    '.content',
    '.chapter-body',
    '.read-content',
    '#chapter-content',
    '.text-content',
    '.chapter-text',
    '.novel-content',
    '.story-content',
    '.post-content'
  ];
  
  for (const selector of contentSelectors) {
    try {
      const contentElement = await page.locator(selector).first();
      if (await contentElement.isVisible()) {
        content = await contentElement.textContent();
        if (content && content.trim().length > 100) {
          extractionMethod = `Selector: ${selector}`;
          break;
        }
      }
    } catch (error) {
      // Continue trying other selectors
    }
  }
  
  // Strategy 2: If no content found, try getting all paragraph text
  if (!content || content.trim().length < 100) {
    try {
      const paragraphs = await page.locator('p').allTextContents();
      const paragraphText = paragraphs.join('\n\n');
      if (paragraphText && paragraphText.trim().length > 100) {
        content = paragraphText;
        extractionMethod = 'Paragraph extraction';
      } else {
        // Log that paragraph extraction didn't yield enough content
        log.info(`Paragraph extraction found ${paragraphText?.trim().length || 0} characters, not enough for success`);
      }
    } catch (error) {
      log.warning(`Could not extract paragraph content: ${error.message}`);
    }
  }
  
  // Strategy 3: Try getting text from the entire body
  if (!content || content.trim().length < 100) {
    try {
      const bodyText = await page.locator('body').textContent();
      if (bodyText && bodyText.trim().length > 100) {
        // Filter out navigation and other non-content elements
        const lines = bodyText.split('\n');
        const contentLines = lines.filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 20 && 
                 !trimmed.includes('Menu') && 
                 !trimmed.includes('Navigation') &&
                 !trimmed.includes('Footer') &&
                 !trimmed.includes('Cookie') &&
                 !trimmed.includes('Privacy');
        });
        content = contentLines.join('\n');
        extractionMethod = 'Body text extraction (filtered)';
      }
    } catch (error) {
      log.warning(`Could not extract body text: ${error.message}`);
    }
  }
  
  // Strategy 4: If all Playwright methods failed, try Firecrawl as fallback
  const cleanedPlaywrightContent = cleanContent(content);

  // Now, check if the CLEANED content is insufficient. If so, try Firecrawl.
  if ((!cleanedPlaywrightContent || cleanedPlaywrightContent.trim().length < 100) && isFirecrawlAvailable() && settings.useFirecrawl) {
      log.info(`🔄 Playwright extraction yielded insufficient content (${cleanedPlaywrightContent.trim().length} chars), trying Firecrawl fallback...`);
      const firecrawlResult = await extractContentWithFirecrawl(currentUrl, log);

      // Use Firecrawl's result ONLY if it's valid
      if (firecrawlResult.content && firecrawlResult.content.trim().length > 100) {
          // Clean the Firecrawl content to remove ads, scripts, and unwanted elements
          const cleanedFirecrawlContent = cleanContent(firecrawlResult.content);
          log.info(`🧹 Firecrawl content cleaned: ${firecrawlResult.content.trim().length} → ${cleanedFirecrawlContent.trim().length} characters`);
          
          // Return the cleaned Firecrawl content
          return { content: cleanedFirecrawlContent, method: firecrawlResult.method };
      }
  }

  // If Firecrawl wasn't needed or failed, return the cleaned Playwright content
  return { content: cleanedPlaywrightContent, method: extractionMethod };
}

// Function to extract novel title from the page
export async function extractNovelTitle(page, log) {
  let novelTitle = '';
  
  try {
    // Try the specific CSS path you provided
    const novelTitleSelectors = [
      'a.novel-title',
      '.novel-title',
      'a[class*="novel-title"]',
      'div.col-xs-12 a.novel-title',
      'div.row div.col-xs-12 a.novel-title'
    ];
    
    for (const selector of novelTitleSelectors) {
      try {
        const titleElement = await page.locator(selector).first();
        if (await titleElement.isVisible()) {
          const titleText = await titleElement.textContent();
          if (titleText && titleText.trim()) {
            novelTitle = titleText.trim();
            log.info(`✅ Novel title extracted using selector: ${selector}`);
            break;
          }
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    // If no title found, try to get any visible text that might be a novel title
    if (!novelTitle) {
      try {
        const allLinks = await page.locator('a').allTextContents();
        const potentialTitles = allLinks.filter(text => 
          text && text.trim().length > 3 && 
          text.trim().length < 100 &&
          !text.includes('Chapter') &&
          !text.includes('Next') &&
          !text.includes('Prev') &&
          !text.includes('Home') &&
          !text.includes('Menu')
        );
        
        if (potentialTitles.length > 0) {
          novelTitle = potentialTitles[0].trim();
          log.info(`✅ Novel title extracted from potential titles: ${novelTitle}`);
        }
      } catch (debugError) {
        log.warning(`Could not extract potential novel titles: ${debugError.message}`);
      }
    }
    
  } catch (error) {
    log.warning(`Could not extract novel title: ${error.message}`);
  }
  
  return novelTitle;
}

// Function to extract chapter title
export async function extractChapterTitle(page, log) {
  let chapterTitle = 'Unknown Chapter';
  try {
    const titleSelectors = [
      '.chr-text',  // The correct selector you identified
      'h2 a.chr-title span.chr-text',
      'span.chr-text',
      'h2 a.chr-title',
      'h1.chapter-title',
      'h1.title',
      '.chapter-header h1',
      '.chapter-title',
      'h1',
      '.title',
      '.novel-title',
      '.story-title'
    ];
    
    for (const selector of titleSelectors) {
      try {
        const titleElement = await page.locator(selector).first();
        if (await titleElement.isVisible()) {
          const titleText = await titleElement.textContent();
          if (titleText && titleText.trim()) {
            chapterTitle = titleText.trim();
            log.info(`✅ Title extracted using selector: ${selector}`);
            break;
          }
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    if (chapterTitle === 'Unknown Chapter') {
      log.warning(`Could not extract chapter title with any selector`);
      // Try to get any visible text that might be a title
      try {
        const allH2s = await page.locator('h2').allTextContents();
        const allH1s = await page.locator('h1').allTextContents();
        log.info(`Available H2 elements: ${allH2s.join(', ')}`);
        log.info(`Available H1 elements: ${allH1s.join(', ')}`);
      } catch (debugError) {
        log.warning(`Debug info unavailable: ${debugError.message}`);
      }
    }
  } catch (error) {
    log.warning(`Could not extract chapter title: ${error.message}`);
  }
  
  return chapterTitle;
}
