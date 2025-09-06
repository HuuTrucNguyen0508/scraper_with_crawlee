# Next.js Backend for Markdown Storage

A Next.js server with API routes that serves as a bridge between a JavaScript app and a Flutter mobile app, using a local SQLite database to store Markdown content.

## Features

- **POST /api/save-markdown**: Accepts JSON with `markdownContent` field (up to 2MB)
- **GET /api/get-latest-markdown**: Returns the most recently saved Markdown content
- **SQLite Database**: Local `.db` file storage with automatic table creation
- **Error Handling**: Proper HTTP status codes and error messages
- **TypeScript**: Full TypeScript support
- **2MB Body Size Limit**: Configured to handle large Markdown files

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up the database:**
   ```bash
   pnpm run setup-db
   ```

3. **Start the development server:**
   ```bash
   pnpm run dev
   ```

The server will be available at `http://localhost:3000`

## API Endpoints

### POST /api/save-markdown

Saves Markdown content to the database.

**Request Body:**
```json
{
  "markdownContent": "# Your Markdown Content\n\nThis is a sample markdown file..."
}
```

**Response:**
```json
{
  "message": "Markdown content saved successfully",
  "size": 1024
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid markdownContent
- `413 Payload Too Large`: Content exceeds 2MB limit
- `500 Internal Server Error`: Database or server error

### GET /api/get-latest-markdown

Retrieves the most recently saved Markdown content.

**Response:**
```json
{
  "markdownContent": "# Your Markdown Content\n\nThis is a sample markdown file...",
  "id": 1,
  "createdAt": "2024-01-15 10:30:00",
  "size": 1024
}
```

**Error Responses:**
- `404 Not Found`: No markdown content found
- `500 Internal Server Error`: Database or server error

## Database Schema

The SQLite database contains a single table:

```sql
CREATE TABLE markdowns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Configuration

The server is configured with:
- **Body Size Limit**: 2MB for request bodies
- **Response Limit**: 8MB for responses
- **Database**: SQLite with `sql.js` (pure JavaScript implementation)

## Usage Examples

### JavaScript/Node.js Client

```javascript
// Save markdown content
const response = await fetch('http://localhost:3000/api/save-markdown', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    markdownContent: '# Hello World\n\nThis is a test markdown file.'
  })
});

const result = await response.json();
console.log(result);

// Get latest markdown content
const getResponse = await fetch('http://localhost:3000/api/get-latest-markdown');
const latestContent = await getResponse.json();
console.log(latestContent.markdownContent);
```

### Flutter/Dart Client

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

// Save markdown content
Future<void> saveMarkdown(String content) async {
  final response = await http.post(
    Uri.parse('http://localhost:3000/api/save-markdown'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'markdownContent': content}),
  );
  
  if (response.statusCode == 201) {
    print('Markdown saved successfully');
  }
}

// Get latest markdown content
Future<String?> getLatestMarkdown() async {
  final response = await http.get(
    Uri.parse('http://localhost:3000/api/get-latest-markdown'),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['markdownContent'];
  }
  return null;
}
```

## Development

- **Database Setup**: Run `pnpm run setup-db` to initialize the database
- **Development Server**: Run `pnpm run dev` to start the development server
- **Build**: Run `pnpm run build` to build for production
- **Start Production**: Run `pnpm run start` to start the production server

## File Structure

```
nextjs-backend/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── save-markdown/
│   │       │   └── route.ts
│   │       └── get-latest-markdown/
│   │           └── route.ts
│   └── lib/
│       └── db.ts
├── scripts/
│   └── setup-db.ts
├── next.config.js
├── package.json
└── README.md
```

## Notes

- The database file (`markdown.db`) is created automatically in the project root
- The server uses `sql.js` for SQLite functionality, which is a pure JavaScript implementation
- All API routes include proper error handling and HTTP status codes
- The server is configured to handle large request bodies up to 2MB