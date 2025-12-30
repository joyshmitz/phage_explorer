/**
 * Rate Limiting Utilities for External APIs
 *
 * NCBI allows 3 requests/second without an API key.
 * This module provides shared rate limiting across all NCBI-based API clients.
 */

// Shared state for NCBI rate limiting
let lastNCBIRequestTime = 0;
const NCBI_REQUEST_DELAY_MS = 350; // ~3 requests/second

/**
 * Throttled fetch for NCBI APIs (SRA, Entrez, etc.)
 * Ensures we don't exceed NCBI's rate limit of 3 requests/second.
 */
export async function throttledNCBIFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastNCBIRequestTime;

  if (timeSinceLastRequest < NCBI_REQUEST_DELAY_MS) {
    await new Promise(resolve =>
      setTimeout(resolve, NCBI_REQUEST_DELAY_MS - timeSinceLastRequest)
    );
  }

  lastNCBIRequestTime = Date.now();
  return fetch(url);
}

/**
 * Reset rate limit state (useful for testing)
 */
export function resetNCBIRateLimit(): void {
  lastNCBIRequestTime = 0;
}
