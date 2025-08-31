# Novel Crawler

A self-contained JavaScript web crawler for scraping novel chapters from `novelbin.com` using Crawlee and Commander.js.

## Features

- 📖 Scrapes chapter titles and content from novelbin.com
- 🔗 Automatically follows "Next" chapter links
- 📊 Tracks progress and saves data to JSON format
- ⚙️ Configurable crawling parameters
- 🛡️ Respectful crawling with delays and single concurrency
- 💾 Automatic data export and graceful interruption handling
- 🎯 Multiple selector strategies for robust content extraction

## Requirements

- Node.js 16.0.0 or higher
- pnpm (package manager)

## Installation

1. Install dependencies using pnpm:
```bash
pnpm install
```

This will install:
- `crawlee` (^3.11.2) - Web scraping and crawling framework
- `commander` (^12.1.0) - Command-line argument parsing

## Usage

### Basic Usage

```bash
node novel-crawler.js --url "https://novelbin.com/b/monster-paradise/chapter-7" --count 5
```

### Command Line Arguments

#### Required Arguments

- `--url <url>`: The starting URL of the novel chapter
  - Must be from novelbin.com domain
  - Example: `https://novelbin.com/b/monster-paradise/chapter-7`

- `--count <count>`: Number of chapters to scrape, starting from the given URL
  - Must be a positive integer
  - Example: `--count 10`

#### Optional Arguments

- `--headless`: Run browser in headless mode (default: true)
  - Use `--no-headless` to see the browser window while scraping

- `--delay <ms>`: Delay between requests in milliseconds (default: 1000)
  - Example: `--delay 2000` for 2-second delays

### Examples

#### Scrape 10 chapters with visible browser
```bash
node novel-crawler.js --url "https://novelbin.com/b/your-novel/chapter-1" --count 10 --no-headless
```

#### Scrape 5 chapters with 2-second delays
```bash
node novel-crawler.js --url "https://novelbin.com/b/your-novel/chapter-1" --count 5 --delay 2000
```

#### Show help
```bash
node novel-crawler.js --help
```

## Output

The crawler saves the scraped data in multiple formats:

### JSON Export
- **Filename**: `novel-chapters-{timestamp}.json`
- **Location**: Current working directory
- **Format**: Array of chapter objects

### Dataset Storage
- **Location**: `./storage/datasets/default/`
- **Format**: Individual JSON files per chapter

### Data Structure

Each scraped chapter contains:

```json
{
  "url": "https://novelbin.com/b/novel-name/chapter-1",
  "title": "Chapter 1: The Beginning",
  "content": "Chapter content text...",
  "chapterNumber": 1,
  "scrapedAt": "2024-01-01T12:00:00.000Z"
}
```

## Error Handling

- **Failed chapters**: Saved with error information
- **Missing next links**: Crawler stops gracefully
- **Network errors**: Automatic retries (up to 3 attempts)
- **Interruption**: Ctrl+C saves progress before exiting

## Interruption Handling

If you need to stop the crawler (Ctrl+C), it will:
1. Save all currently scraped chapters
2. Export data to `novel-chapters-interrupted-{timestamp}.json`
3. Exit gracefully

## Content Extraction Strategy

The crawler uses multiple fallback strategies to extract content:

### Chapter Titles
- `h1.chapter-title`
- `h1.title`
- `.chapter-header h1`
- `h1` (generic)
- `.title`

### Chapter Content
- `.chapter-content`
- `.content`
- `.chapter-body`
- `.read-content`
- `#chapter-content`
- `.text-content`
- All `<p>` tags (fallback)

### Next Chapter Links
- `a[title*="Next"]`
- `a.next`
- `.next-chapter`
- `a:has-text("Next")`
- `.pagination .next`
- And more...

## Performance Considerations

- **Concurrency**: Limited to 1 concurrent request to be respectful
- **Delays**: Default 1-second delay between requests
- **Timeouts**: 60-second timeout per page
- **Retries**: Up to 3 retries for failed requests

## Troubleshooting

### Common Issues

1. **"URL must be from novelbin.com domain"**
   - Ensure the URL contains `novelbin.com`

2. **"Count must be a positive number"**
   - Use a number greater than 0 for the count

3. **"Could not find next chapter link"**
   - The crawler stops when it can't find a valid next chapter link
   - This is normal at the end of available chapters

4. **Browser launch failures**
   - Ensure you have sufficient system resources
   - Try running with `--headless` mode

### Debugging

Run with visible browser to see what's happening:
```bash
node novel-crawler.js --url "your-url" --count 1 --no-headless
```

## License

MIT License - Feel free to use and modify as needed.

## Disclaimer

This tool is for educational purposes. Please respect the website's terms of service and robots.txt file. Use responsibly and considerately.
