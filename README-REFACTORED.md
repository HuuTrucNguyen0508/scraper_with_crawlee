# Improved Novel Crawler - Refactored Version

A modular, well-organized web crawler for scraping novel chapters from novelbin.com and novelbin.me.

## 🏗️ Project Structure

The project has been refactored into a clean, modular structure:

```
src/
├── app.js                    # Main application orchestrator
├── config/
│   └── firecrawl.js         # Firecrawl SDK configuration and availability checking
├── crawler/
│   └── novelCrawler.js      # Main crawler logic using PlaywrightCrawler
├── ui/
│   └── cli.js               # Command-line interface and user interaction
└── utils/
    ├── contentCleaner.js    # Content cleaning and ad removal
    ├── contentExtractor.js  # Content extraction strategies
    └── markdownGenerator.js # Markdown file generation utilities
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Firecrawl (optional):**
   ```bash
   # Create .env file
   echo "FIRECRAWL_API_KEY=fc-your-api-key-here" > .env
   ```

3. **Run the crawler:**
   ```bash
   pnpm start
   # or
   node improved-crawler-refactored.js
   ```

## 📁 Module Breakdown

### `src/app.js`
- Main application entry point
- Orchestrates the entire crawling process
- Handles user flow and error management

### `src/config/firecrawl.js`
- Firecrawl SDK initialization and testing
- API key validation
- Fallback content extraction functionality

### `src/crawler/novelCrawler.js`
- Core crawling logic using PlaywrightCrawler
- Chapter extraction and navigation
- Progress tracking and error handling

### `src/ui/cli.js`
- Interactive command-line interface
- User input validation and prompts
- Progress display and completion summaries

### `src/utils/contentCleaner.js`
- Comprehensive content cleaning
- Ad and unwanted content removal
- Pattern-based filtering

### `src/utils/contentExtractor.js`
- Multiple content extraction strategies
- Fallback mechanisms
- Title extraction for both novels and chapters

### `src/utils/markdownGenerator.js`
- Markdown file generation
- Novel name extraction from URLs
- Structured output formatting

## 🔧 Features

- **Modular Architecture**: Clean separation of concerns
- **Interactive CLI**: User-friendly interface with validation
- **Multiple Extraction Strategies**: Robust content extraction with fallbacks
- **Firecrawl Integration**: Advanced content extraction when needed
- **Comprehensive Cleaning**: Removes ads, scripts, and unwanted content
- **Progress Tracking**: Real-time progress display
- **Error Handling**: Graceful error recovery and reporting
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🎯 Benefits of Refactoring

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Individual modules can be tested in isolation
3. **Reusability**: Components can be reused in other projects
4. **Readability**: Code is easier to understand and navigate
5. **Scalability**: Easy to add new features or modify existing ones

## 📝 Usage

The refactored version maintains the same functionality as the original but with better organization:

1. **Start the application**: `pnpm start`
2. **Choose option 1**: Start a new novel scraping session
3. **Enter novel URL**: From novelbin.com or novelbin.me
4. **Specify chapter count**: How many chapters to scrape
5. **Configure settings**: Delay, timeout, retry attempts, Firecrawl
6. **Wait for completion**: Monitor progress and review results

## 🔄 Migration from Original

The original `improved-crawler.js` file is still available for reference. The new modular version:

- Maintains all existing functionality
- Improves code organization
- Makes future development easier
- Preserves all user-facing features

## 🛠️ Development

To work on the codebase:

1. **Modify specific modules** without affecting others
2. **Add new features** by creating new modules
3. **Test individual components** in isolation
4. **Maintain clean interfaces** between modules

## 📦 Dependencies

- `crawlee`: Web scraping framework
- `playwright`: Browser automation
- `@mendable/firecrawl-js`: Advanced content extraction
- `dotenv`: Environment variable management
- `commander`: Command-line argument parsing (for future CLI mode)

## 🎉 Conclusion

The refactored version provides the same powerful novel scraping capabilities with a much cleaner, more maintainable codebase. Each module has a clear purpose and can be developed or modified independently.
