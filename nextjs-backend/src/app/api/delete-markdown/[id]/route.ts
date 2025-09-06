import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Configure runtime for this route
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function DELETE(
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
    
    // Check if markdown exists
    const checkResult = db.exec(
      'SELECT id FROM markdowns WHERE id = ?',
      [Number(id)]
    );
    
    if (checkResult.length === 0 || checkResult[0].values.length === 0) {
      return NextResponse.json(
        { error: 'Markdown not found' },
        { status: 404 }
      );
    }

    // Delete the markdown
    db.exec('DELETE FROM markdowns WHERE id = ?', [Number(id)]);

    return NextResponse.json({
      message: 'Markdown deleted successfully',
      id: Number(id)
    });

  } catch (error) {
    console.error('Error deleting markdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
