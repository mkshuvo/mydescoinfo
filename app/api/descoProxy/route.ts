export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

const DESCO_API_BASE_URL = 'https://prepaid.desco.org.bd/api/tkdes/customer';

// Whitelist of allowed DESCO API endpoints to prevent SSRF
const ALLOWED_ENDPOINTS = new Set([
  'getCustomerInfo',
  'getBalance',
  'getCustomerDailyConsumption',
]);

export async function GET(request: NextRequest) {
  // Verify authentication
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');
  const accountNo = searchParams.get('accountNo');
  const meterNo = searchParams.get('meterNo');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  // Validate required params
  if (!endpoint || !accountNo) {
    return NextResponse.json(
      { message: 'Missing required parameters: endpoint or accountNo' },
      { status: 400 }
    );
  }

  // SECURITY: Whitelist check to prevent SSRF / path traversal
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json(
      { message: `Invalid endpoint: ${endpoint}` },
      { status: 400 }
    );
  }

  if (!meterNo) {
    return NextResponse.json(
      { message: 'Missing required parameter: meterNo' },
      { status: 400 }
    );
  }

  // Sanitize inputs — only allow alphanumeric chars and hyphens
  const sanitize = (value: string): string => value.replace(/[^a-zA-Z0-9\-]/g, '');

  let targetUrl = `${DESCO_API_BASE_URL}/${endpoint}?accountNo=${sanitize(accountNo)}&meterNo=${sanitize(meterNo)}`;

  if (endpoint === 'getCustomerDailyConsumption') {
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { message: 'Missing dateFrom or dateTo for getCustomerDailyConsumption' },
        { status: 400 }
      );
    }
    targetUrl += `&dateFrom=${sanitize(dateFrom)}&dateTo=${sanitize(dateTo)}`;
  }

  try {
    const descoResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const contentType = descoResponse.headers.get('content-type');
    let responseData: unknown;

    if (contentType?.includes('application/json')) {
      responseData = await descoResponse.json();
    } else {
      responseData = await descoResponse.text();
    }

    if (!descoResponse.ok) {
      console.error(`[PROXY] DESCO API Error (${descoResponse.status}):`, responseData);
      const errorMessage =
        typeof responseData === 'string'
          ? responseData
          : 'Error fetching data from DESCO API';
      return NextResponse.json(
        { message: errorMessage },
        { status: descoResponse.status }
      );
    }

    if (contentType?.includes('application/json')) {
      return NextResponse.json(responseData);
    }

    return NextResponse.json(
      { message: 'Received non-JSON response from DESCO API.', data: responseData },
      { status: 502 }
    );
  } catch (error: unknown) {
    console.error('[PROXY] Internal Server Error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error in Proxy.';
    return NextResponse.json({ message }, { status: 500 });
  }
}