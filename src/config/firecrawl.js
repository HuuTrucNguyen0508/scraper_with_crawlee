// Firecrawl integration for fallback content extraction
let firecrawlAvailable = false;
let firecrawl = null;

// Function to check Firecrawl availability
export async function checkFirecrawlAvailability() {
  try {
    // Check if we have the Firecrawl SDK available
    const Firecrawl = await import('@mendable/firecrawl-js');
    
    // Check if API key is available
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.log('ℹ️  Firecrawl SDK available but no API key found. Set FIRECRAWL_API_KEY environment variable to enable Firecrawl fallback.');
      return false;
    }
    
    // Initialize Firecrawl
    firecrawl = new Firecrawl.default({ apiKey: apiKey });
    
    // Test with a simple request
    try {
      const testResponse = await firecrawl.scrape('https://example.com', {
        formats: ['markdown'],
        onlyMainContent: true
      });
      
      if (testResponse && testResponse.markdown) {
        firecrawlAvailable = true;
        console.log('✅ Firecrawl SDK detected and working - will be used as fallback for content extraction');
        return true;
      }
    } catch (testError) {
      console.log(`ℹ️  Firecrawl SDK available but test request failed: ${testError.message}`);
      return false;
    }
    
  } catch (error) {
    // Firecrawl SDK not available
    console.log('ℹ️  Firecrawl SDK not available - using standard extraction methods only');
    console.log('💡 To enable Firecrawl fallback, install: npm install @mendable/firecrawl-js');
    return false;
  }
  
  return false;
}

// Function to extract content with Firecrawl as fallback
export async function extractContentWithFirecrawl(url, log) {
  if (!firecrawlAvailable || !firecrawl) {
    return { content: '', method: 'Firecrawl not available' };
  }
  
  try {
    log.info(`🔄 Attempting Firecrawl extraction for: ${url}`);
    
    // Use Firecrawl SDK to scrape the page content
    const data = await firecrawl.scrape(url, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000
    });
    
    if (data && data.markdown && data.markdown.trim().length > 100) {
      log.info(`✅ Firecrawl extraction successful: ${data.markdown.length} characters`);
      return { content: data.markdown, method: 'Firecrawl SDK' };
    } else {
      log.warning(`Firecrawl returned insufficient content: ${data?.markdown?.length || 0} characters`);
      return { content: '', method: 'Firecrawl returned insufficient content' };
    }
    
  } catch (error) {
    log.warning(`Firecrawl extraction failed: ${error.message}`);
    return { content: '', method: `Firecrawl failed: ${error.message}` };
  }
}

export function isFirecrawlAvailable() {
  return firecrawlAvailable;
}
