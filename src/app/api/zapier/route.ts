import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/validateEnv';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(env.ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Zapier responded with status: ${response.status}`);
    }
    
    const zapierResponse = await response.json();
    
    return NextResponse.json(zapierResponse);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Zapier trigger API is running. Please use POST method to trigger Zapier workflows.' }
  );
} 