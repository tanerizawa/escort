import { NextRequest, NextResponse } from 'next/server';

const GEOCODE_BASE_URL = 'https://nominatim.openstreetmap.org/search';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  const limitRaw = request.nextUrl.searchParams.get('limit') || '1';
  const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 1, 1), 5);

  if (!query) {
    return NextResponse.json({ message: 'Missing query parameter q' }, { status: 400 });
  }

  const upstream = new URL(GEOCODE_BASE_URL);
  upstream.searchParams.set('format', 'json');
  upstream.searchParams.set('q', query);
  upstream.searchParams.set('limit', String(limit));

  try {
    const response = await fetch(upstream.toString(), {
      headers: {
        'User-Agent': 'ARETON-Web/1.0 (support@areton.id)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Geocode upstream error', status: response.status },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json({ message: 'Failed to resolve geocode' }, { status: 502 });
  }
}
