'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownData {
  markdownContent: string;
  id: number;
  createdAt: string;
  size: number;
}

interface MarkdownListItem {
  id: number;
  content: string;
  createdAt: string;
  size: number;
  preview: string;
}

export default function Home() {
  const [markdownList, setMarkdownList] = useState<MarkdownListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedMarkdown, setSelectedMarkdown] = useState<MarkdownData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchMarkdownList = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/list-markdowns');
      
      if (response.ok) {
        const data = await response.json();
        setMarkdownList(data.markdowns || []);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch markdown list');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkdownById = async (id: number) => {
    try {
      const response = await fetch(`/api/get-markdown/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setSelectedMarkdown(data);
        setShowPreview(true);
      } else {
        alert('Failed to fetch markdown content');
      }
    } catch {
      alert('Network error occurred');
    }
  };

  const deleteMarkdown = async (id: number) => {
    if (!confirm('Are you sure you want to delete this markdown?')) {
      return;
    }

    try {
      const response = await fetch(`/api/delete-markdown/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMarkdownList(); // Refresh the list
        setShowPreview(false);
        setSelectedMarkdown(null);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch {
      alert('Network error occurred');
    }
  };

  const downloadMarkdown = (content: string, id: number, createdAt: string) => {
    try {
      // Create a meaningful filename
      const date = new Date(createdAt).toISOString().split('T')[0];
      const filename = `markdown-${id}-${date}.md`;
      
      // Create blob with markdown content
      const blob = new Blob([content], { type: 'text/markdown' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading file');
    }
  };

  const uploadMarkdown = async () => {
    if (!uploadText.trim()) {
      alert('Please enter some markdown content');
      return;
    }

    try {
      setUploading(true);
      const response = await fetch('/api/save-markdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdownContent: uploadText,
        }),
      });

      if (response.ok) {
        setUploadText('');
        await fetchMarkdownList(); // Refresh the list
        alert('Markdown saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch {
      alert('Network error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.markdown')) {
        alert('Please select a Markdown file (.md or .markdown)');
        return;
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      setSelectedFile(file);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadText(content);
      };
      reader.onerror = () => {
        alert('Error reading file');
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadText('');
    setFileInputKey(prev => prev + 1); // Reset file input
  };

  useEffect(() => {
    fetchMarkdownList();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📝 Markdown Storage API
          </h1>
          <p className="text-lg text-gray-600">
            Upload, manage, and retrieve Markdown content
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Upload New Markdown
          </h2>
          
          {/* File Import Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-700">
                📁 Import from File
              </h3>
              {selectedFile && (
                <button
                  onClick={clearFile}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Clear File
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                key={fileInputKey}
                type="file"
                accept=".md,.markdown"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer transition-colors"
              >
                Choose Markdown File
              </label>
              
              {selectedFile && (
                <div className="flex-1">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Selected:</span> {selectedFile.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Size: {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700">
                ✏️ Or Type Manually
              </h3>
              {selectedFile && (
                <span className="text-sm text-green-600">
                  ✓ File content loaded below
                </span>
              )}
            </div>
            
            <textarea
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Enter your markdown content here or import a file above..."
              className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {uploadText.length} characters
                {selectedFile && (
                  <span className="ml-2 text-green-600">
                    (from {selectedFile.name})
                  </span>
                )}
              </span>
              <button
                onClick={uploadMarkdown}
                disabled={uploading || !uploadText.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Markdown'}
              </button>
            </div>
          </div>
        </div>

        {/* Markdown List Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Stored Markdowns ({markdownList.length})
            </h2>
            <button
              onClick={fetchMarkdownList}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 text-lg mb-2">⚠️ {error}</div>
              <p className="text-gray-500">
                Upload some markdown content to get started!
              </p>
            </div>
          ) : markdownList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-2">📝 No markdowns stored yet</div>
              <p className="text-gray-400">
                Upload your first markdown using the form above!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {markdownList.map((markdown) => (
                <div key={markdown.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-sm font-medium text-gray-600">#{markdown.id}</span>
                        <span className="text-sm text-gray-500">{formatDate(markdown.createdAt)}</span>
                        <span className="text-sm text-gray-500">{formatFileSize(markdown.size)}</span>
                      </div>
                      <div className="text-gray-700 mb-2">
                        {markdown.preview}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => fetchMarkdownById(markdown.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => downloadMarkdown(markdown.content, markdown.id, markdown.createdAt)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => deleteMarkdown(markdown.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {showPreview && selectedMarkdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Markdown Preview - #{selectedMarkdown.id}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadMarkdown(selectedMarkdown.markdownContent, selectedMarkdown.id, selectedMarkdown.createdAt)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedMarkdown.markdownContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🔗 API Endpoints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-mono bg-white p-2 rounded border">
                <div className="text-green-600">POST</div>
                <div>/api/save-markdown</div>
              </div>
              <div className="font-mono bg-white p-2 rounded border">
                <div className="text-blue-600">GET</div>
                <div>/api/get-latest-markdown</div>
              </div>
              <div className="font-mono bg-white p-2 rounded border">
                <div className="text-blue-600">GET</div>
                <div>/api/list-markdowns</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-mono bg-white p-2 rounded border">
                <div className="text-blue-600">GET</div>
                <div>/api/get-markdown/[id]</div>
              </div>
              <div className="font-mono bg-white p-2 rounded border">
                <div className="text-red-600">DELETE</div>
                <div>/api/delete-markdown/[id]</div>
              </div>
            </div>
          </div>
          <p className="text-blue-700 text-sm mt-3">
            Use these endpoints to integrate with your JavaScript or Flutter apps!
          </p>
        </div>
      </div>
    </div>
  );
}