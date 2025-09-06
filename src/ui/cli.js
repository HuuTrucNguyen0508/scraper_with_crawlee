import readline from 'readline';
import { isFirecrawlAvailable } from '../config/firecrawl.js';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
export function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to show main menu
export async function showMainMenu() {
  console.log('\n'.repeat(50));
  console.log('🌟 Welcome to the Improved Novel Crawler! 🌟\n');
  console.log('📚 What would you like to do?\n');
  console.log('1. 🚀 Start a new novel scraping session');
  console.log('2. 📖 View previous scraping sessions');
  console.log('3. 🔧 Advanced crawler settings');
  console.log('4. 📚 Browse available novels');
  console.log('5. ❓ Help & Information');
  console.log('6. 🚪 Exit\n');
  
  const choice = await askQuestion('Enter your choice (1-6): ');
  return choice;
}

// Function to get novel URL interactively
export async function getNovelURL() {
  console.log('\n📖 Novel URL Setup\n');
  console.log('Please provide the starting URL for the novel chapter.');
  console.log('Example: https://novelbin.com/b/monster-paradise/chapter-7');
  console.log('         https://novelbin.me/b/monster-paradise/chapter-7\n');
  
  let url = await askQuestion('Enter the novel chapter URL: ');
  
  // Validate URL
  if (!url.includes('novelbin.com') && !url.includes('novelbin.me')) {
    console.log('❌ Error: URL must be from novelbin.com or novelbin.me domain');
    return await getNovelURL();
  }
  
  return url;
}

// Function to get chapter count interactively
export async function getChapterCount() {
  console.log('\n📊 Chapter Count Setup\n');
  console.log('How many chapters would you like to scrape?\n');
  console.log('💡 Tips:');
  console.log('   - Start with 1-3 chapters to test');
  console.log('   - Use 5-10 for a good reading session');
  console.log('   - Use 20+ for longer novels (be patient!)\n');
  
  let count = await askQuestion('Enter number of chapters (1-100): ');
  count = parseInt(count);
  
  if (isNaN(count) || count < 1 || count > 100) {
    console.log('❌ Error: Please enter a valid number between 1 and 100');
    return await getChapterCount();
  }
  
  return count;
}

// Function to get output directory interactively
export async function getOutputDirectory() {
  console.log('\n📁 Output Directory Setup\n');
  console.log('Where would you like to save the scraped novels?\n');
  console.log('💡 Tips:');
  console.log('   - Use descriptive names like "fantasy-novels" or "my-library"');
  console.log('   - Each scraping session will create a new folder');
  console.log('   - Leave empty for default "novel-output" folder\n');
  
  let outputDir = await askQuestion('Enter output directory name (or press Enter for default): ');
  
  if (!outputDir) {
    outputDir = 'novel-output';
  }
  
  // Clean the directory name
  outputDir = outputDir.replace(/[<>:"/\\|?*]/g, '_');
  
  return outputDir;
}

// Function to get advanced crawler settings
export async function getAdvancedSettings() {
  console.log('\n⚙️  Advanced Crawler Settings\n');
  console.log('Configure advanced crawler behavior:\n');
  
  // Headless mode
  const headlessChoice = await askQuestion('Run browser in background? (y/n, default: y): ');
  const headless = headlessChoice.toLowerCase() !== 'n';
  
  // Delay between requests
  console.log('\n⏱️  Delay between requests helps avoid being blocked by the website.');
  console.log('Recommended delays:');
  console.log('   - 1000ms (1 second) - Fast but may get blocked');
  console.log('   - 2000ms (2 seconds) - Balanced (recommended)');
  console.log('   - 5000ms (5 seconds) - Slow but safe\n');
  
  let delay = await askQuestion('Enter delay in milliseconds (default: 2000): ');
  delay = parseInt(delay) || 2000;
  
  // Page load timeout
  console.log('\n⏰ Page load timeout (how long to wait for content to load):');
  console.log('   - 30000ms (30 seconds) - Standard (default)');
  console.log('   - 60000ms (60 seconds) - For slow-loading pages');
  console.log('   - 120000ms (120 seconds) - For very slow pages\n');
  
  let pageTimeout = await askQuestion('Enter page timeout in milliseconds (default: 30000): ');
  pageTimeout = parseInt(pageTimeout) || 30000;
  
  // Retry attempts for failed chapters
  console.log('\n🔄 Retry attempts for failed chapters:');
  console.log('   - 1-3 attempts - Standard (default: 3)');
  console.log('   - 4-5 attempts - For problematic websites');
  console.log('   - 6+ attempts - Not recommended (may get blocked)\n');
  
  let retryAttempts = await askQuestion('Enter retry attempts (default: 3): ');
  retryAttempts = parseInt(retryAttempts) || 3;
  
  // Parallel processing settings
  console.log('\n⚡ Parallel Processing:');
  console.log('   - Process multiple chapters simultaneously for faster scraping');
  console.log('   - Higher concurrency = faster but more likely to get blocked');
  console.log('   - Lower concurrency = slower but more stable\n');
  console.log('Recommended settings:');
  console.log('   - 1-2 concurrent requests - Conservative (recommended for testing)');
  console.log('   - 3-5 concurrent requests - Balanced (recommended)');
  console.log('   - 6+ concurrent requests - Aggressive (may get blocked)\n');
  
  let maxConcurrency = await askQuestion('Enter max concurrent requests (default: 3): ');
  maxConcurrency = parseInt(maxConcurrency) || 3;
  
  // Ensure reasonable limits
  if (maxConcurrency < 1) maxConcurrency = 1;
  if (maxConcurrency > 10) maxConcurrency = 10;
  
  // Firecrawl fallback option
  if (isFirecrawlAvailable()) {
    console.log('\n🔥 Firecrawl Fallback:');
    console.log('   - Enable Firecrawl as backup when normal extraction fails');
    console.log('   - More reliable but slower than Playwright extraction\n');
    
    const useFirecrawlChoice = await askQuestion('Enable Firecrawl fallback? (y/n, default: y): ');
    const useFirecrawl = useFirecrawlChoice.toLowerCase() !== 'n';
    
    return { headless, delay, pageTimeout, retryAttempts, maxConcurrency, useFirecrawl };
  }
  
  return { headless, delay, pageTimeout, retryAttempts, maxConcurrency, useFirecrawl: false };
}

// Function to show scraping progress
export function showProgress(current, total, url, status = 'Processing') {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  
  console.log('\n'.repeat(50));
  console.log('🔄 Scraping in Progress...\n');
  console.log(`📊 Progress: ${current}/${total} chapters (${percentage}%)`);
  console.log(`▕${progressBar}▏`);
  console.log(`\n📍 Current: ${url}`);
  console.log(`⏳ Status: ${status}\n`);
}

// Function to show completion summary
export function showCompletionSummary(chaptersScraped, outputDir, files, failedChapters = []) {
  console.log('\n'.repeat(50));
  console.log('🎉 Scraping Completed Successfully! 🎉\n');
  console.log(`📊 Total chapters scraped: ${chaptersScraped}`);
  console.log(`📁 Output directory: ${outputDir}/\n`);
  
  if (failedChapters.length > 0) {
    console.log('⚠️  Chapters with issues (may need manual review):');
    failedChapters.forEach(chapter => {
      console.log(`   ❌ Chapter ${chapter.number}: ${chapter.url} - ${chapter.issue}`);
    });
    console.log('');
  }
  
  console.log('📄 Files created:');
  files.forEach(file => {
    console.log(`   ✅ ${file}`);
  });
  
  console.log('\n🚀 What\'s next?');
  console.log('   - Open the markdown file to read your novel');
  console.log('   - Check the JSON file for raw data');
  console.log('   - Review failed chapters manually if needed');
  console.log('   - Start another scraping session\n');
}

// Function to show help
export async function showHelp() {
  console.log('\n'.repeat(50));
  console.log('❓ Help & Information\n');
  console.log('🌟 Improved Novel Crawler Help\n');
  console.log('This tool helps you scrape novel chapters from novelbin.com and novelbin.me with better handling of problematic pages.\n');
  
  console.log('📚 How to Use:');
  console.log('1. Choose "Start a new novel scraping session"');
  console.log('2. Enter the URL of the first chapter you want to scrape');
  console.log('3. Specify how many chapters to scrape');
  console.log('4. Choose where to save the files');
  console.log('5. Configure advanced crawler settings');
  console.log('6. Wait for the scraping to complete\n');
  
  console.log('💡 Tips:');
  console.log('• Start with 1-3 chapters to test');
  console.log('• Use longer delays (2-5 seconds) to avoid being blocked');
  console.log('• Each scraping session creates organized folders');
  console.log('• Markdown files are perfect for mobile reading');
  console.log('• If chapters fail, try increasing page timeout and retry attempts');
  if (isFirecrawlAvailable()) {
    console.log('• Firecrawl fallback provides more reliable content extraction');
    console.log('• Enable Firecrawl in advanced settings for problematic chapters\n');
  } else {
    console.log('• To enable Firecrawl fallback:');
    console.log('  1. Get API key from firecrawl.dev');
    console.log('  2. Set environment variable: FIRECRAWL_API_KEY=fc-YOUR-API-KEY');
    console.log('  3. Restart the script\n');
  }
  
  console.log('⚠️  Important Notes:');
  console.log('• Respect the website\'s terms of service');
  console.log('• Use reasonable delays between requests');
  console.log('• Only scrape content for personal use');
  console.log('• Some chapters may fail due to website structure differences\n');
  
  await askQuestion('\nPress Enter to continue...');
}

// Function to browse available novels
export async function browseNovels() {
  console.log('\n'.repeat(50));
  console.log('📚 Browse Available Novels\n');
  console.log('Here are some popular novels you can start with:\n');
  
  const popularNovels = [
    {
      name: 'Monster Paradise',
      description: 'A fantasy novel about monster hunting and evolution',
      sampleUrl: 'https://novelbin.com/b/monster-paradise/chapter-7',
      altUrl: 'https://novelbin.me/b/monster-paradise/chapter-7',
      note: 'Start from chapter 7+ for best results'
    },
    {
      name: 'The Legendary Mechanic',
      description: 'Sci-fi novel about a mechanic in a game world',
      sampleUrl: 'https://novelbin.com/b/the-legendary-mechanic/chapter-10',
      altUrl: 'https://novelbin.me/b/the-legendary-mechanic/chapter-10',
      note: 'Start from chapter 10+ for best results'
    },
    {
      name: 'Solo Leveling',
      description: 'Action fantasy about a solo player in a monster world',
      sampleUrl: 'https://novelbin.com/b/solo-leveling/chapter-15',
      altUrl: 'https://novelbin.me/b/solo-leveling/chapter-15',
      note: 'Start from chapter 15+ for best results'
    }
  ];
  
  popularNovels.forEach((novel, index) => {
    console.log(`${index + 1}. 📖 ${novel.name}`);
    console.log(`   📝 ${novel.description}`);
    console.log(`   🔗 ${novel.sampleUrl}`);
    console.log(`   🔗 Alternative: ${novel.altUrl}`);
    console.log(`   💡 ${novel.note}\n`);
  });
  
  console.log('💡 To scrape any of these novels:');
  console.log('1. Go back to main menu');
  console.log('2. Choose "Start a new novel scraping session"');
  console.log('3. Use one of the URLs above as your starting point');
  console.log('4. Both .com and .me domains are supported');
  console.log('5. Use higher chapter numbers for better success rates\n');
  
  await askQuestion('Press Enter to continue...');
}

export function closeReadline() {
  rl.close();
}
