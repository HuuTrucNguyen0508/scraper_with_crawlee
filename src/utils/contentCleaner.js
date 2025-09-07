// Function to clean content by removing unwanted text and ads
export function cleanContent(content) {
  if (!content) return '';
  
  const unwantedPatterns = [
    // Privacy and cookie notices
    /Your personal data will be processed.*?Close/s,
    /Total Responses: \d+/,
    /Cookie duration:.*?Uses other forms of storage\./gs,
    /Ad partners.*?Start Blocking Ads/s,
    /Accept all.*?Confirm choices/s,
    /TCF vendors.*?Privacy choices/s,
    /Data collected and processed:.*?Privacy choices/s,
    /Some vendors may process.*?Privacy choices/s,
    /How this consent management platform.*?Privacy choices/s,
    /Vendors can use your data.*?Privacy choices/s,
    /Accept all.*?Close/s,
    
    // Ad-related content
    /Start Blocking Ads.*?Watch Youtube Without Ads/s,
    /Tired of ads on YouTube.*?Here's the fix/s,
    /Start Blocking Ads Now.*?$/s,
    /Watch Youtube Without Ads.*?$/s,
    /The best gaming browser.*?$/s,
    
    // JavaScript and technical content
    /window\.pubfuturetag.*?\)/gs,
    /\(function.*?\)/gs,
    /aclib\.runInPagePush.*?\)/gs,
    /MutationObserver.*?\)/gs,
    /document\.body.*?\)/gs,
    /window\.pubfuturetag.*?pf-\d+-\d+/gs,
    /\.pf-config-.*?\{.*?\}/gs,
    
    // Navigation elements
    /Prev Chapter.*?Next Chapter/gs,
    /Chapter \d+.*?You Are Still So Weak!/gs,
    /Monster Paradise.*?Chapter \d+/gs,
    /Novel\s+Monster Paradise\s+Chapter \d+/gs,
    
    // French and other language ads (common at end of chapters)
    /🎖 Bonus quotidien actif.*?$/s,
    /🎁 Cadeau en approche.*?$/s,
    /🔥 Pas de pitié.*?$/s,
    /Emily's Got a Secret.*?$/s,
    
    // Generic ad patterns
    /Connecte-toi pour ton prix.*?$/s,
    /Réclame ton bonus.*?$/s,
    /Cadeau en approche.*?$/s,
    /Bonus quotidien.*?$/s,
    
    // Disqus and social media content
    /!\[.*?\]\(https?:\/\/.*?disquscdn\.com.*?\)/g,
    /!\[.*?\]\(https?:\/\/.*?facebook\.com.*?\)/g,
    /!\[.*?\]\(https?:\/\/.*?twitter\.com.*?\)/g,
    /!\[.*?\]\(https?:\/\/.*?instagram\.com.*?\)/g,
    /!\[.*?\]\(https?:\/\/.*?youtube\.com.*?\)/g,
    
    // Image embeds and media
    /!\[.*?\]\(https?:\/\/.*?\)/g,
    /\[.*?\]\(https?:\/\/.*?\)/g,
    
    // Social media buttons and widgets
    /Share on.*?Facebook/gi,
    /Tweet.*?Twitter/gi,
    /Follow.*?Instagram/gi,
    /Subscribe.*?YouTube/gi,
    
    // Comment sections and social features
    /Leave a comment.*?$/i,
    /Comments.*?$/i,
    /Share this.*?$/i,
    /Like this.*?$/i,
    
    // Website branding and footer content
    /Powered by.*?$/i,
    /©.*?All rights reserved/gi,
    /Terms of Service.*?$/i,
    /Privacy Policy.*?$/i,
    
    // Remove everything after "Report Chapter" (common end marker)
    /Report Chapter.*$/is,
    
    // Remove everything after "Remove ads safely" or similar ad removal text
    /Remove ads safely.*$/is,
    /Remove All Ads.*$/is,
    /Start Blocking Ads Today.*$/is,
    /Say goodbye to online ads.*$/is,
    
    // Whitespace cleanup
    /\n\s*\n\s*\n/g,
    /\s{3,}/g
  ];
  
  let cleanedContent = content;
  unwantedPatterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '');
  });
  
  // Remove lines that are likely ads or unwanted content
  const lines = cleanedContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) return false;
    
    // Skip technical content
    if (trimmedLine.includes('window.') || 
        trimmedLine.includes('function(') || 
        trimmedLine.includes('document.')) return false;
    
    // Skip navigation
    if (trimmedLine.includes('Prev Chapter') || 
        trimmedLine.includes('Next Chapter')) return false;
    
    // Skip short chapter references
    if (trimmedLine.includes('Chapter') && trimmedLine.length < 20) return false;
    if (trimmedLine.includes('Monster Paradise') && trimmedLine.length < 30) return false;
    
    // Skip ad-like content at the end
    if (trimmedLine.includes('🎖') || 
        trimmedLine.includes('🎁') || 
        trimmedLine.includes('🔥') ||
        trimmedLine.includes('Bonus') ||
        trimmedLine.includes('Cadeau') ||
        trimmedLine.includes('Réclame')) return false;
    
    // Skip social media and comment content
    if (trimmedLine.includes('![') && trimmedLine.includes('](')) return false;
    if (trimmedLine.includes('disquscdn.com')) return false;
    if (trimmedLine.includes('facebook.com')) return false;
    if (trimmedLine.includes('twitter.com')) return false;
    if (trimmedLine.includes('instagram.com')) return false;
    if (trimmedLine.includes('youtube.com')) return false;
    
    // Skip social media buttons
    if (trimmedLine.toLowerCase().includes('share on') ||
        trimmedLine.toLowerCase().includes('tweet') ||
        trimmedLine.toLowerCase().includes('follow') ||
        trimmedLine.toLowerCase().includes('subscribe')) return false;
    
    // Skip comment sections
    if (trimmedLine.toLowerCase().includes('leave a comment') ||
        trimmedLine.toLowerCase().includes('comments') ||
        trimmedLine.toLowerCase().includes('share this') ||
        trimmedLine.toLowerCase().includes('like this')) return false;
    
    // Skip website branding
    if (trimmedLine.toLowerCase().includes('powered by') ||
        trimmedLine.toLowerCase().includes('all rights reserved') ||
        trimmedLine.toLowerCase().includes('terms of service') ||
        trimmedLine.toLowerCase().includes('privacy policy')) return false;
    
    // Skip lines that are just numbers or very short
    if (trimmedLine.length <= 2 && /^\d+$/.test(trimmedLine)) return false;
    
    return true;
  });
  
  let result = filteredLines.join('\n').trim();
  
  // Process content for proper formatting
  result = formatContent(result);
  
  return result;
}

// Function to format content with proper dialogue and paragraph handling
function formatContent(content) {
  if (!content) return '';
  
  // First, normalize Unicode quotes to standard ASCII quotes
  content = normalizeQuotes(content);
  
  // Handle duplicate chapter titles at the beginning
  content = removeDuplicateChapterTitles(content);
  
  // Improve dialogue formatting
  content = improveDialogueFormatting(content);
  
  // Split content into lines for processing
  const lines = content.split('\n');
  const processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      processedLines.push('');
      continue;
    }
    
    // Check if this line contains dialogue (starts with quote)
    if (line.startsWith('"') || line.startsWith("'")) {
      // This is dialogue - ensure it's on its own line
      processedLines.push(line);
    } else {
      // Check if this line contains dialogue in the middle
      const dialogueMatches = line.match(/"[^"]*"/g) || line.match(/'[^']*'/g);
      if (dialogueMatches && dialogueMatches.length > 0) {
        // Split the line to separate dialogue
        const parts = splitDialogueFromNarrative(line);
        processedLines.push(...parts);
      } else {
        processedLines.push(line);
      }
    }
  }
  
  // Join lines and improve paragraph spacing
  let result = processedLines.join('\n');
  
  // Clean up dialogue formatting issues
  result = cleanupDialogueFormatting(result);
  
  // Fix broken contractions that were split across lines
  result = fixBrokenContractions(result);
  
  // Improve paragraph spacing - add double newlines after sentences that end with .!?
  result = result
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return result;
}

// Function to normalize Unicode quotes to standard ASCII quotes
function normalizeQuotes(content) {
  return content
    .replace(/\u201c/g, '"')  // Left double quotation mark (")
    .replace(/\u201d/g, '"')  // Right double quotation mark (")
    .replace(/\u2018/g, "'")  // Left single quotation mark (')
    .replace(/\u2019/g, "'"); // Right single quotation mark (')
}

// Function to remove duplicate chapter titles at the beginning
function removeDuplicateChapterTitles(content) {
  const lines = content.split('\n');
  const processedLines = [];
  let foundFirstChapterTitle = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line looks like a chapter title
    if (line.match(/^Chapter \d+/i) || line.match(/^Chapter \d+:/i)) {
      if (!foundFirstChapterTitle) {
        // This is the first chapter title we've seen - keep it
        processedLines.push(line);
        foundFirstChapterTitle = true;
      } else {
        // This is a duplicate chapter title - check if it's at the beginning of content
        // If it's within the first few lines and looks like a duplicate, skip it
        if (i < 5) {
          continue;
        } else {
          // If it's later in the content, it might be legitimate - keep it
          processedLines.push(line);
        }
      }
    } else {
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n');
}

// Function to fix broken contractions that were split across lines
function fixBrokenContractions(content) {
  const lines = content.split('\n');
  const fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    // Check if current line ends with a word that should be part of a contraction
    // and next line starts with 't, 's, 're, 've, 'll, 'd, etc.
    if (currentLine && nextLine) {
      const contractionPattern = /^'[a-zA-Z]+$/;
      const wordEndPattern = /[a-zA-Z]$/;
      
      if (wordEndPattern.test(currentLine) && contractionPattern.test(nextLine)) {
        // Merge the lines to fix the contraction
        const mergedLine = currentLine + nextLine;
        fixedLines.push(mergedLine);
        i++; // Skip the next line since we merged it
        continue;
      }
    }
    
    fixedLines.push(currentLine);
  }
  
  return fixedLines.join('\n');
}

// Function to split dialogue from narrative text
function splitDialogueFromNarrative(line) {
  const result = [];
  let currentText = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prevChar = i > 0 ? line[i - 1] : '';
    const nextChar = i < line.length - 1 ? line[i + 1] : '';
    
    // Check if this is a contraction (apostrophe between letters)
    const isContraction = (char === "'" && 
                          prevChar && /[a-zA-Z]/.test(prevChar) && 
                          nextChar && /[a-zA-Z]/.test(nextChar));
    
    if ((char === '"' || char === "'") && !inQuotes && !isContraction) {
      // Starting a quote (but not a contraction)
      if (currentText.trim()) {
        result.push(currentText.trim());
        currentText = '';
      }
      inQuotes = true;
      quoteChar = char;
      currentText += char;
    } else if (char === quoteChar && inQuotes && !isContraction) {
      // Ending a quote (but not a contraction)
      currentText += char;
      result.push(currentText.trim());
      currentText = '';
      inQuotes = false;
      quoteChar = '';
    } else {
      currentText += char;
    }
  }
  
  // Add any remaining text
  if (currentText.trim()) {
    result.push(currentText.trim());
  }
  
  return result.filter(text => text.length > 0);
}

// Function to clean up dialogue formatting issues
function cleanupDialogueFormatting(content) {
  const lines = content.split('\n');
  const cleanedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      cleanedLines.push('');
      continue;
    }
    
    // Fix common dialogue issues
    // Remove standalone quote marks
    if (line === '"' || line === "'" || line === '""' || line === "''") {
      continue; // Skip these lines
    }
    
    // Fix broken dialogue patterns
    // Pattern: " text " -> "text"
    line = line.replace(/^"\s+([^"]+)\s+"$/, '"$1"');
    
    // Pattern: ' text ' -> 'text'
    line = line.replace(/^'\s+([^']+)\s+'$/, "'$1'");
    
    // Fix dialogue that starts with space after quote
    line = line.replace(/^"\s+/, '"');
    line = line.replace(/^'\s+/, "'");
    
    // Fix dialogue that ends with space before quote
    line = line.replace(/\s+"$/, '"');
    line = line.replace(/\s+'$/, "'");
    
    // Only add non-empty lines
    if (line.trim()) {
      cleanedLines.push(line);
    }
  }
  
  return cleanedLines.join('\n');
}

// Function to improve dialogue formatting
function improveDialogueFormatting(content) {
  // Split content into lines
  const lines = content.split('\n');
  const processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      processedLines.push('');
      continue;
    }
    
    // Check if this line contains dialogue
    const dialogueMatches = line.match(/"[^"]*"/g) || line.match(/'[^']*'/g);
    
    if (dialogueMatches && dialogueMatches.length > 0) {
      // Split dialogue from narrative
      const parts = splitDialogueFromNarrative(line);
      processedLines.push(...parts);
    } else {
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n');
}