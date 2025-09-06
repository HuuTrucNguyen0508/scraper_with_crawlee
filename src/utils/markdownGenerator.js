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
  
  // Sort chapters by actual chapter number to ensure proper order
  const sortedChapters = chapters.sort((a, b) => {
    const aNum = a.actualChapterNumber || a.chapterNumber || 0;
    const bNum = b.actualChapterNumber || b.chapterNumber || 0;
    return aNum - bNum;
  });
  
  sortedChapters.forEach((chapter, index) => {
    const chapterNumber = chapter.actualChapterNumber || chapter.chapterNumber || (index + 1);
    const chapterTitle = chapter.title || `Chapter ${chapterNumber}`;
    
    markdown += `## ${chapterTitle}\n\n`;
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
