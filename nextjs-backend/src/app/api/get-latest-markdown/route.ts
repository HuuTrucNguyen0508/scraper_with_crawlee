import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Configure runtime for this route
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  try {
    const db = await getDb();
    
    // Get the most recent markdown content
    const result = db.exec(
      'SELECT id, content, created_at FROM markdowns ORDER BY created_at DESC LIMIT 1'
    );
    
    const latestMarkdown = result.length > 0 && result[0].values.length > 0 
      ? {
          id: result[0].values[0][0],
          content: result[0].values[0][1] as string,
          created_at: result[0].values[0][2] as string
        }
      : null;

    if (!latestMarkdown || !latestMarkdown.content) {
      return NextResponse.json(
        { error: 'No markdown content found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      markdownContent: latestMarkdown.content,
      id: latestMarkdown.id,
      createdAt: latestMarkdown.created_at,
      size: Buffer.byteLength(latestMarkdown.content, 'utf8')
    });

  } catch (error) {
    console.error('Error retrieving markdown content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
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
