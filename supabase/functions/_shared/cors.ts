// CORS configuration for different environments
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://kctmenswear.com',
  'https://www.kctmenswear.com',
  'https://admin.kctmenswear.com'
];

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  // For webhook endpoints, typically no CORS needed
  if (!origin) {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  
  if (isAllowed) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
  }

  // No CORS headers for disallowed origins
  return {
    'Content-Type': 'application/json',
  };
}

// Legacy export for backward compatibility (to be phased out)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}