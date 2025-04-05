import { NextRequest, NextResponse } from 'next/server';

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/your-webhook-id';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 추출
    const body = await request.json();
    
    // Zapier 웹훅 호출
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Zapier 응답 처리
    if (!response.ok) {
      throw new Error(`Zapier responded with status: ${response.status}`);
    }
    
    const zapierResponse = await response.json();
    
    // 원본 요청에 대한 응답으로 Zapier의 응답 반환
    return NextResponse.json(zapierResponse);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// GET 메서드도 지원 (테스트 용도)
export async function GET() {
  return NextResponse.json(
    { message: 'Zapier trigger API is running. Please use POST method to trigger Zapier workflows.' }
  );
} 