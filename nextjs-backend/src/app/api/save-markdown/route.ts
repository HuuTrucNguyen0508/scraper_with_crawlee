import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Configure body size limit for this route
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markdownContent } = body;

    // Validate input
    if (!markdownContent || typeof markdownContent !== 'string') {
      return NextResponse.json(
        { error: 'Markdown content is required and must be a string' },
        { status: 400 }
      );
    }

    // Check content size (2MB limit)
    const contentSize = Buffer.byteLength(markdownContent, 'utf8');
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    
    if (contentSize > maxSize) {
      return NextResponse.json(
        { error: 'Markdown content exceeds 2MB size limit' },
        { status: 413 }
      );
    }

    // Save to database
    const db = await getDb();
    db.exec('INSERT INTO markdowns (content) VALUES (?)', [markdownContent]);

    return NextResponse.json(
      { 
        message: 'Markdown content saved successfully',
        size: contentSize
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error saving markdown content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
