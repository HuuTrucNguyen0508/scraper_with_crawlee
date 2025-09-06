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
  
  // Improve paragraph spacing
  result = result
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return result;
}
