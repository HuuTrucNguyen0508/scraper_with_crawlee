# File Import Guide

Your Markdown viewer now supports importing Markdown files directly from your file system!

## 🎯 **New Features Added**

### 📁 **File Import Button**
- Click "Choose Markdown File" to open your file explorer
- Select `.md` or `.markdown` files
- File content automatically loads into the text area

### ✅ **File Validation**
- **File Type**: Only accepts `.md` and `.markdown` files
- **File Size**: Maximum 2MB limit (same as API)
- **Error Handling**: Clear error messages for invalid files

### 🎨 **Enhanced UI**
- **File Info Display**: Shows selected filename and size
- **Clear File Option**: Remove selected file and reset
- **Visual Indicators**: Green checkmarks and status messages
- **Dual Input Methods**: File import OR manual typing

## 🚀 **How to Use File Import**

### **Step 1: Click Import Button**
1. Go to the "Upload New Markdown" section
2. Look for the green "Choose Markdown File" button
3. Click it to open your file explorer

### **Step 2: Select Your File**
1. Navigate to your Markdown file
2. Select any `.md` or `.markdown` file
3. Click "Open"

### **Step 3: Review Content**
1. File content automatically appears in the text area
2. You can edit the content if needed
3. File info shows at the bottom

### **Step 4: Upload**
1. Click "Upload Markdown" to save
2. Content appears in the display section
3. File is now stored in your database

## 📋 **Supported File Types**

- ✅ `.md` files
- ✅ `.markdown` files
- ❌ Other file types (will show error)

## 🔧 **File Validation Rules**

### **File Type Validation**
```javascript
// Only these extensions are allowed
.md
.markdown
```

### **File Size Validation**
```javascript
// Maximum file size: 2MB
if (file.size > 2 * 1024 * 1024) {
  alert('File size must be less than 2MB');
}
```

## 🎨 **UI Components**

### **File Import Section**
- **Green Button**: "Choose Markdown File"
- **File Info**: Shows selected filename and size
- **Clear Button**: Removes selected file

### **Status Indicators**
- **✓ File content loaded below**: When file is imported
- **File size display**: Human-readable format
- **Character count**: Includes file source info

### **Error Messages**
- **File type error**: "Please select a Markdown file (.md or .markdown)"
- **File size error**: "File size must be less than 2MB"
- **Read error**: "Error reading file"

## 🔄 **Workflow Options**

### **Option 1: File Import Only**
1. Click "Choose Markdown File"
2. Select your file
3. Click "Upload Markdown"

### **Option 2: File Import + Edit**
1. Click "Choose Markdown File"
2. Select your file
3. Edit content in text area
4. Click "Upload Markdown"

### **Option 3: Manual Typing**
1. Type directly in text area
2. Click "Upload Markdown"

### **Option 4: Clear and Start Over**
1. Click "Clear File" to remove imported file
2. Choose new file or type manually

## 🛠️ **Technical Details**

### **File Reading**
```javascript
const reader = new FileReader();
reader.onload = (e) => {
  const content = e.target?.result as string;
  setUploadText(content);
};
reader.readAsText(file);
```

### **File Validation**
```javascript
// Type validation
if (!file.name.toLowerCase().endsWith('.md') && 
    !file.name.toLowerCase().endsWith('.markdown')) {
  alert('Please select a Markdown file (.md or .markdown)');
  return;
}

// Size validation
if (file.size > 2 * 1024 * 1024) {
  alert('File size must be less than 2MB');
  return;
}
```

### **State Management**
- `selectedFile`: Stores the selected File object
- `fileInputKey`: Resets file input when clearing
- `uploadText`: Contains the file content for editing

## 🎯 **Use Cases**

### **Import Existing Documentation**
- Upload README files
- Import documentation from other projects
- Load Markdown notes

### **Batch Processing**
- Import multiple files one by one
- Edit content before uploading
- Combine multiple sources

### **Content Migration**
- Move Markdown from other tools
- Import from version control
- Transfer between systems

## 🚨 **Troubleshooting**

### **File Won't Import**
1. Check file extension (must be `.md` or `.markdown`)
2. Verify file size (must be under 2MB)
3. Ensure file is not corrupted

### **Content Not Loading**
1. Check browser console for errors
2. Try a different file
3. Clear browser cache

### **Upload Failing**
1. Check network connection
2. Verify server is running
3. Check file content is valid

## 🎉 **Benefits**

- **Easy Import**: One-click file selection
- **Flexible Editing**: Modify content before upload
- **File Validation**: Prevents errors before upload
- **User Friendly**: Clear visual feedback
- **Efficient Workflow**: Quick file-to-database process

Your Markdown viewer is now a complete file management system!
