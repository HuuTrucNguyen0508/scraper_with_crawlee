import 'dotenv/config';
import { mkdirSync, existsSync } from 'fs';
import { checkFirecrawlAvailability } from './config/firecrawl.js';
import { 
  askQuestion, 
  showMainMenu, 
  getNovelURL, 
  getChapterCount, 
  getOutputDirectory, 
  getAdvancedSettings,
  showHelp,
  browseNovels,
  closeReadline
} from './ui/cli.js';
import { runImprovedCrawler } from './crawler/novelCrawler.js';

// Function to start the interactive crawling process
async function startInteractiveCrawling() {
  try {
    console.log('\n🚀 Starting Improved Novel Crawler...\n');
    
    // Check Firecrawl availability FIRST, before any user input
    console.log('🔍 Checking Firecrawl availability...');
    await checkFirecrawlAvailability();
    
    // Get user inputs
    const url = await getNovelURL();
    const count = await getChapterCount();
    const outputDir = await getOutputDirectory();
    const settings = await getAdvancedSettings();
    
    // Confirm settings
    console.log('\n📋 Crawler Configuration Summary:\n');
    console.log(`📍 Starting URL: ${url}`);
    console.log(`📊 Chapters to scrape: ${count}`);
    console.log(`📁 Output directory: ${outputDir}/`);
    console.log(`🌐 Browser mode: ${settings.headless ? 'Background' : 'Visible'}`);
    console.log(`⏱️  Delay between requests: ${settings.delay}ms`);
    console.log(`⏰ Page timeout: ${settings.pageTimeout}ms`);
    console.log(`🔄 Retry attempts: ${settings.retryAttempts}`);
    console.log(`🔥 Firecrawl fallback: ${settings.useFirecrawl ? 'Enabled' : 'Disabled'}`);
    console.log('');
    
    const confirm = await askQuestion('Does this look correct? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('\n🔄 Let\'s start over...\n');
      return await startInteractiveCrawling();
    }
    
    // Create output directory
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${outputDir}`);
    }
    
    console.log('\n🔍 Initializing improved crawler...\n');
    
    // Start the actual crawling process
    await runImprovedCrawler(url, count, outputDir, settings);
    
  } catch (error) {
    console.error(`\n❌ Error during setup: ${error.message}`);
    await askQuestion('\nPress Enter to continue...');
  }
}

// Main application loop
async function main() {
  try {
    while (true) {
      const choice = await showMainMenu();
      
      switch (choice) {
        case '1':
          await startInteractiveCrawling();
          break;
        case '2':
          console.log('\n📖 Previous sessions feature coming soon...');
          await askQuestion('Press Enter to continue...');
          break;
        case '3':
          console.log('\n⚙️  Advanced settings are configured during each session.');
          console.log('You can customize delay, headless mode, page timeout, and retry attempts.\n');
          await askQuestion('Press Enter to continue...');
          break;
        case '4':
          await browseNovels();
          break;
        case '5':
          await showHelp();
          break;
        case '6':
          console.log('\n👋 Thank you for using the Improved Novel Crawler!');
          console.log('Happy reading! 📚✨\n');
          closeReadline();
          process.exit(0);
          break;
        default:
          console.log('\n❌ Invalid choice. Please enter a number between 1 and 6.');
          await askQuestion('Press Enter to continue...');
      }
    }
  } catch (error) {
    console.error(`\n❌ Application error: ${error.message}`);
    await askQuestion('\nPress Enter to continue...');
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received interrupt signal. Exiting gracefully...');
  closeReadline();
  process.exit(0);
});

// Start the application
main().catch(error => {
  console.error(`❌ Application error: ${error.message}`);
  closeReadline();
  process.exit(1);
});
