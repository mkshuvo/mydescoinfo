import { NextRequest, NextResponse } from 'next/server';

const DESCO_API_BASE_URL = 'https://prepaid.desco.org.bd/api/tkdes/customer';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');
  const accountNo = searchParams.get('accountNo');
  const meterNo = searchParams.get('meterNo');
  const dateFrom = searchParams.get('dateFrom'); // Specific to getCustomerDailyConsumption
  const dateTo = searchParams.get('dateTo');   // Specific to getCustomerDailyConsumption

  // Basic validation for common parameters
  if (!endpoint || !accountNo) {
    return NextResponse.json(
      { message: 'Missing required parameters: endpoint or accountNo' },
      { status: 400 }
    );
  }

  // Meter number is required for most DESCO endpoints
  if (endpoint !== 'someEndpointThatDoesNotNeedMeterNo' && !meterNo) { // Adjust condition if such an endpoint exists
      return NextResponse.json(
          { message: 'Missing required parameter: meterNo' },
          { status: 400 }
      );
  }

  let targetUrl = `${DESCO_API_BASE_URL}/${endpoint}?accountNo=${accountNo}`;
  
  // Add meterNo if it's provided and relevant (most cases)
  if (meterNo) {
      targetUrl += `&meterNo=${meterNo}`;
  }

  // Specific parameters for 'getCustomerDailyConsumption'
  if (endpoint === 'getCustomerDailyConsumption') {
    if (dateFrom && dateTo) {
      targetUrl += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    } else {
      // If dateFrom or dateTo are mandatory for this endpoint, return an error
      return NextResponse.json(
        { message: 'Missing dateFrom or dateTo for getCustomerDailyConsumption' },
        { status: 400 }
      );
    }
  }

  console.log(`[PROXY] Requesting URL: ${targetUrl}`);

  // Disable SSL certificate verification for DESCO API
  if (typeof process !== 'undefined') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  try {
    const descoResponse = await fetch(targetUrl, {
      method: 'GET', // Explicitly set method
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0' // Setting User-Agent as requested
        // Add any other headers DESCO API might require or benefit from
      }
    });

    // Try to parse JSON, but handle cases where it might not be JSON (e.g., plain text error)
    let responseData;
    const contentType = descoResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        responseData = await descoResponse.json();
    } else {
        responseData = await descoResponse.text(); // Fallback to text
        // If you expect JSON but get text, it might indicate an API error page (HTML/text)
        if (descoResponse.ok) {
            // If status is OK but not JSON, this is unexpected. Log it.
            console.warn(`[PROXY] DESCO API response was OK but not JSON. Content-Type: ${contentType}, Body: ${responseData.substring(0,100)}...`);
        } 
    }

    if (!descoResponse.ok) {
      console.error(`[PROXY] DESCO API Error (${descoResponse.status}):`, responseData);
      // Ensure the error response to the client is JSON
      const errorMessage = typeof responseData === 'string' ? responseData : (responseData?.message || 'Error fetching data from DESCO API');
      return NextResponse.json(
        { message: errorMessage, details: typeof responseData === 'object' ? responseData : null },
        { status: descoResponse.status }
      );
    }
    
    // If response was OK and JSON, return it as is
    if (contentType && contentType.includes('application/json')){
        return NextResponse.json(responseData);
    }
    // If response was OK but not JSON (e.g. plain text that you want to proxy as is)
    // This case might need specific handling based on what DESCO API returns for non-JSON success
    // For now, if it was text and OK, we'll assume it's an error or unexpected success format.
    // Let's treat it as an error for now if it's not JSON and was expected to be.
    console.warn(`[PROXY] DESCO API response was OK but not JSON. Treating as an issue. Body: ${String(responseData).substring(0,100)}...`);
    return NextResponse.json(
        { message: 'Received non-JSON response from DESCO API despite OK status.', data: responseData },
        { status: 200 } // Or perhaps a 502 Bad Gateway if it's truly unexpected
    );

  } catch (error: any) {
    console.error('[PROXY] Internal Server Error:', error);
    // Differentiate network errors from other errors if possible
    let errorMessage = 'Internal Server Error in Proxy.';
    if (error.name === 'AbortError') {
        errorMessage = 'Request to DESCO API timed out.';
    }
    else if (error instanceof TypeError && error.message.includes('fetch failed')) {
        errorMessage = 'Network error: Unable to connect to DESCO API.';
    }
     else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { message: errorMessage, details: error.toString() },
      { status: 500 }
    );
  }
}