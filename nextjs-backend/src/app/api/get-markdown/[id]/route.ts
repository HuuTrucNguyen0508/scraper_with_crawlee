import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Configure runtime for this route
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid markdown ID' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Get specific markdown content by ID
    const result = db.exec(
      'SELECT id, content, created_at FROM markdowns WHERE id = ?',
      [Number(id)]
    );
    
    const markdown = result.length > 0 && result[0].values.length > 0 
      ? {
          id: result[0].values[0][0],
          content: result[0].values[0][1] as string,
          createdAt: result[0].values[0][2] as string
        }
      : null;

    if (!markdown) {
      return NextResponse.json(
        { error: 'Markdown not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      markdownContent: markdown.content,
      id: markdown.id,
      createdAt: markdown.createdAt,
      size: Buffer.byteLength(markdown.content, 'utf8')
    });

  } catch (error) {
    console.error('Error retrieving markdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
