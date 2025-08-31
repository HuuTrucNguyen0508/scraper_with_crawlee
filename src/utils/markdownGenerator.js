// Function to create markdown content
export function createMarkdownContent(chapters, novelTitle = '') {
  let markdown = '';
  
  // Add novel title as the first line if available
  if (novelTitle && novelTitle.trim()) {
    markdown += `# ${novelTitle}\n\n`;
  } else {
    markdown += `# Novel Chapters\n\n`;
  }
  
  markdown += `**Source:** ${chapters[0]?.url?.split('/b/')[0] || 'novelbin.com'}\n`;
  markdown += `**Total Chapters:** ${chapters.length}\n`;
  markdown += `**Scraped:** ${new Date().toISOString()}\n\n`;
  markdown += `---\n\n`;
  
  chapters.forEach((chapter, index) => {
    markdown += `## Chapter ${index + 1}\n\n`;
    markdown += `**Title:** ${chapter.title}\n\n`;
    markdown += `**URL:** ${chapter.url}\n\n`;
    
    if (chapter.content && chapter.content.trim()) {
      markdown += `${chapter.content}\n\n`;
    } else {
      markdown += `*Content extraction failed for this chapter. Please check the original URL manually.*\n\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  return markdown;
}

// Function to get novel name from URL
export function getNovelName(url) {
  try {
    const urlParts = url.split('/');
    const novelIndex = urlParts.findIndex(part => part === 'b') + 1;
    if (novelIndex > 0 && novelIndex < urlParts.length) {
      return urlParts[novelIndex].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  } catch (error) {
    // Fallback to generic name
  }
  return 'novel';
}
