import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Configure runtime for this route
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  try {
    const db = await getDb();
    
    // Get all markdown content with metadata
    const result = db.exec(
      'SELECT id, content, created_at FROM markdowns ORDER BY created_at DESC'
    );
    
    const markdowns = result.length > 0 ? result[0].values.map((row: unknown[]) => ({
      id: row[0],
      content: row[1] as string,
      createdAt: row[2] as string,
      size: Buffer.byteLength(row[1] as string, 'utf8'),
      preview: (row[1] as string).substring(0, 100) + '...'
    })) : [];

    return NextResponse.json({
      markdowns,
      count: markdowns.length
    });

  } catch (error) {
    console.error('Error retrieving markdown list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
