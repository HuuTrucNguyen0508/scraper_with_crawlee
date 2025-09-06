# Frontend Guide - Markdown Viewer

A simple web interface for viewing and uploading Markdown content to your Next.js backend.

## Features

### 🎨 **Modern UI**
- Clean, responsive design with Tailwind CSS
- Mobile-friendly interface
- Loading states and error handling
- Real-time character count

### 📝 **Markdown Upload**
- Text area for entering Markdown content
- Character counter
- Upload button with loading state
- Success/error notifications

### 👀 **Markdown Display**
- Rendered Markdown with syntax highlighting
- Support for GitHub Flavored Markdown (GFM)
- Metadata display (ID, creation date, file size)
- Refresh button to reload content

### 🔄 **Real-time Updates**
- Automatic refresh after upload
- Manual refresh button
- Loading indicators

## How to Use

### 1. **View Latest Markdown**
- The page automatically loads the most recent Markdown content
- If no content exists, you'll see a helpful message
- Click "Refresh" to reload the latest content

### 2. **Upload New Markdown**
1. Scroll to the "Upload New Markdown" section
2. Type or paste your Markdown content in the text area
3. Watch the character counter
4. Click "Upload Markdown" to save
5. The page will automatically refresh to show your new content

### 3. **View Metadata**
- **ID**: Unique identifier for the Markdown entry
- **Created**: When the content was saved
- **Size**: File size in human-readable format

## Supported Markdown Features

The frontend supports all standard Markdown features plus GitHub Flavored Markdown:

- **Headers** (H1-H6)
- **Bold** and *italic* text
- **Lists** (ordered and unordered)
- **Links** and images
- **Code blocks** with syntax highlighting
- **Tables**
- **Blockquotes**
- **Horizontal rules**
- **Strikethrough** text
- **Task lists**
- **And more!**

## API Integration

The frontend uses your existing API endpoints:

- **GET /api/get-latest-markdown** - Fetches the most recent content
- **POST /api/save-markdown** - Saves new content

## Styling

The interface uses a clean, professional design with:

- **Color Scheme**: Gray and blue palette
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent padding and margins
- **Responsive**: Works on desktop and mobile
- **Accessibility**: Proper contrast and focus states

## File Structure

```
src/app/
├── page.tsx          # Main frontend component
├── globals.css       # Global styles + Markdown styling
└── layout.tsx        # App layout (default Next.js)
```

## Customization

### Changing Colors
Edit the Tailwind classes in `page.tsx`:
```tsx
// Change primary color from blue to green
className="bg-blue-600 hover:bg-blue-700"
// becomes
className="bg-green-600 hover:bg-green-700"
```

### Adding Features
The component is modular and easy to extend:
- Add file upload support
- Add markdown editing capabilities
- Add content history
- Add export functionality

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

- **Client-side rendering** for fast interactions
- **Optimized bundle** with Next.js
- **Efficient re-renders** with React hooks
- **Lazy loading** for large content

## Troubleshooting

### Content Not Loading
1. Check if the backend is running
2. Verify API endpoints are working
3. Check browser console for errors

### Upload Not Working
1. Ensure content is not empty
2. Check file size (2MB limit)
3. Verify network connection

### Styling Issues
1. Clear browser cache
2. Check if Tailwind CSS is loading
3. Verify custom CSS is applied

## Development

To modify the frontend:

1. **Edit the main component**: `src/app/page.tsx`
2. **Update styles**: `src/app/globals.css`
3. **Add new pages**: Create new files in `src/app/`
4. **Test changes**: Run `pnpm run dev`

The frontend will automatically reload when you make changes!
